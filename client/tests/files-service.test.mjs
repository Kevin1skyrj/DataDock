import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  FileServiceError,
  collectDescendants,
  createFolder,
  getPath,
  listItems,
  moveItems,
  renameItem,
  restoreItems,
  starItems,
  trashItems,
  __resetDrive,
} from "@/services/mock/files";

/**
 * The service is the contract the real backend will have to honour, so these
 * assert the contract rather than the fixture: shapes, ordering rules, error
 * codes and the invariants the UI is built on top of.
 */
beforeEach(() => __resetDrive());

describe("listItems — contract", () => {
  it("always returns a page, even when everything fits on one", () => {
    return listItems().then((page) => {
      assert.ok(Array.isArray(page.items));
      assert.equal(typeof page.total, "number");
      assert.ok("nextCursor" in page, "nextCursor must always be present");
    });
  });

  it("paginates with an opaque cursor", async () => {
    const first = await listItems({ limit: 2 });
    assert.equal(first.items.length, 2);
    assert.ok(first.nextCursor, "expected more pages");

    const second = await listItems({ limit: 2, cursor: first.nextCursor });
    const overlap = second.items.filter((i) => first.items.some((f) => f.id === i.id));
    assert.equal(overlap.length, 0, "pages must not repeat items");
  });

  it("reports total independently of the page size", async () => {
    const all = await listItems();
    const one = await listItems({ limit: 1 });
    assert.equal(one.total, all.total);
    assert.equal(one.items.length, 1);
  });
});

describe("listItems — ordering", () => {
  it("puts folders before files whatever the sort", async () => {
    for (const field of ["name", "size", "updatedAt"]) {
      for (const direction of ["asc", "desc"]) {
        const { items } = await listItems({ sort: { field, direction } });
        const lastFolder = items.findLastIndex((i) => i.type === "folder");
        const firstFile = items.findIndex((i) => i.type === "file");
        if (lastFolder !== -1 && firstFile !== -1) {
          assert.ok(
            lastFolder < firstFile,
            `${field}/${direction} interleaved folders and files`,
          );
        }
      }
    }
  });

  it("sorts by name within a group, and reverses on desc", async () => {
    const asc = await listItems({ sort: { field: "name", direction: "asc" } });
    const desc = await listItems({ sort: { field: "name", direction: "desc" } });

    const folderNames = (p) => p.items.filter((i) => i.type === "folder").map((i) => i.name);
    assert.deepEqual(folderNames(desc), [...folderNames(asc)].reverse());
  });

  it("is stable — equal keys never shuffle between calls", async () => {
    const once = await listItems({ sort: { field: "size", direction: "asc" } });
    const twice = await listItems({ sort: { field: "size", direction: "asc" } });
    assert.deepEqual(
      once.items.map((i) => i.id),
      twice.items.map((i) => i.id),
    );
  });
});

describe("listItems — filtering", () => {
  it("matches names case-insensitively", async () => {
    const { items } = await listItems({ filter: { query: "ARCHIVE" } });
    assert.ok(items.length > 0);
    assert.ok(items.every((i) => i.name.toLowerCase().includes("archive")));
  });

  it("excludes trashed items from their own folder's listing", async () => {
    const { items } = await listItems();
    const victim = items.find((i) => i.type === "file");
    await trashItems([victim.id]);

    const after = await listItems({ parentId: victim.parentId });
    assert.ok(!after.items.some((i) => i.id === victim.id), "trashed item still listed");

    const bin = await listItems({ filter: { trashed: true } });
    assert.ok(bin.items.some((i) => i.id === victim.id), "trashed item missing from trash");
  });

  it("keeps the parent a trashed item will be restored to", async () => {
    const { items } = await listItems();
    const victim = items.find((i) => i.type === "file");
    const origin = victim.parentId;

    await trashItems([victim.id]);
    await restoreItems([victim.id]);

    const back = await listItems({ parentId: origin });
    assert.ok(back.items.some((i) => i.id === victim.id), "did not return to its folder");
  });

  it("treats Starred and Recent as drive-wide, not folder-scoped", async () => {
    const { items } = await listItems();
    const target = items.find((i) => i.type === "file");
    await starItems([target.id], true);

    const starred = await listItems({ filter: { starred: true } });
    assert.ok(starred.items.some((i) => i.id === target.id));
  });

  it("never lists a folder as Recent", async () => {
    const { items } = await listItems({ filter: { recent: true } });
    assert.ok(items.every((i) => i.type === "file"), "a folder appeared in Recent");
  });
});

describe("mutations", () => {
  it("resolves to the updated entities so callers can reconcile", async () => {
    const { items } = await listItems();
    const target = items.find((i) => i.type === "file");

    const updated = await renameItem(target.id, "Renamed thing.pdf");
    assert.equal(updated.name, "Renamed thing.pdf");
    assert.equal(updated.id, target.id);
  });

  it("refuses a duplicate name in the same folder", async () => {
    const { items } = await listItems();
    const [a, b] = items.filter((i) => i.parentId === null);
    await assert.rejects(
      () => renameItem(b.id, a.name),
      (e) => e instanceof FileServiceError && e.code === "name-conflict",
    );
  });

  it("refuses an empty name", async () => {
    const { items } = await listItems();
    await assert.rejects(
      () => renameItem(items[0].id, "   "),
      (e) => e.code === "empty-name",
    );
  });

  it("reports a missing item rather than failing silently", async () => {
    await assert.rejects(
      () => renameItem("nope", "x"),
      (e) => e.code === "not-found",
    );
  });

  it("refuses to move a folder inside itself", async () => {
    const { items } = await listItems();
    const folder = items.find((i) => i.type === "folder");
    await assert.rejects(
      () => moveItems([folder.id], folder.id),
      (e) => e.code === "cyclic-move",
    );
  });

  it("refuses to move a folder into its own descendant", async () => {
    const { items } = await listItems();
    const parent = items.find((i) => i.type === "folder");
    const child = await createFolder({ parentId: parent.id, name: "Nested" });

    await assert.rejects(
      () => moveItems([parent.id], child.id),
      (e) => e.code === "cyclic-move",
    );
  });

  it("rejects a folder name that already exists beside it", async () => {
    const existing = (await listItems()).items.find((i) => i.type === "folder");
    await assert.rejects(
      () => createFolder({ parentId: null, name: existing.name }),
      (e) => e.code === "name-conflict",
    );
  });
});

describe("hierarchy", () => {
  it("collectDescendants gathers the whole subtree, root included", async () => {
    const parent = (await listItems()).items.find((i) => i.type === "folder");
    const child = await createFolder({ parentId: parent.id, name: "Level one" });
    const grandchild = await createFolder({ parentId: child.id, name: "Level two" });

    const found = collectDescendants(parent.id);
    assert.ok(found.has(child.id), "missing direct child");
    assert.ok(found.has(grandchild.id), "missing grandchild — must recurse, not just one level");

    // The root is in the set on purpose: the drag layer asks "may this land
    // inside?" and a folder may not land inside itself either. Dropping the
    // root from the set is what would let you drag a folder onto its own row.
    assert.ok(found.has(parent.id), "root must be included so self-drop is forbidden");
  });

  it("getPath walks from the root down to the folder", async () => {
    const parent = (await listItems()).items.find((i) => i.type === "folder");
    const child = await createFolder({ parentId: parent.id, name: "Deep" });

    const trail = await getPath(child.id);
    assert.equal(trail.at(-1).id, child.id, "trail must end at the folder itself");
    assert.equal(trail.at(-2).id, parent.id, "parent must precede it");
  });

  it("getPath at the root is empty", async () => {
    assert.deepEqual(await getPath(null), []);
  });
});
