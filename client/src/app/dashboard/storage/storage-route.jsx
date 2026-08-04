"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PreviewDialog } from "@/components/preview/preview-dialog";
import { ShareDialog } from "@/components/sharing/share-dialog";
import {
  CleanupSuggestions,
  LargestFiles,
  Panel,
  PanelSkeleton,
  StorageActivity,
  StorageBreakdown,
  StorageOverview,
} from "@/components/storage/storage-panels";
import { notify } from "@/components/ui/toast";
import {
  getCleanupSuggestions,
  getLargestFiles,
  getStorageActivity,
  getStorageBreakdown,
  getStorageSummary,
  restoreItems,
  trashItems,
} from "@/services/files";

/**
 * Where the space went.
 *
 * Five independent panels, five independent requests. They are separate on
 * purpose: a breakdown by kind, the largest files and a cleanup scan are three
 * different aggregate queries, and waiting for the slowest before drawing any
 * of them would make the page feel worse than the sum of its parts. Each fills
 * in as it lands, so the overview — which is the cheapest — is up almost
 * immediately.
 *
 * The dialogs are the workspace's own. Previewing a large file here should be
 * the same act as previewing it in the file browser, and sharing it should open
 * the same sharing terms.
 */
export function StorageRoute() {
  const router = useRouter();
  const [nonce, setNonce] = useState(0);

  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [largest, setLargest] = useState(null);
  const [activity, setActivity] = useState(null);
  const [cleanup, setCleanup] = useState(null);

  const [previewing, setPreviewing] = useState(null);
  const [sharing, setSharing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const set = (setter) => (value) => {
      if (!cancelled) setter(value);
    };

    getStorageSummary().then(set(setSummary));
    getStorageBreakdown().then(set(setBreakdown));
    getLargestFiles().then(set(setLargest));
    getStorageActivity().then(set(setActivity));
    getCleanupSuggestions().then(set(setCleanup));

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const refresh = () => setNonce((current) => current + 1);

  const trash = async (file) => {
    await trashItems([file.id]);
    refresh();
    notify({
      title: `${file.name} moved to trash`,
      undo: async () => {
        await restoreItems([file.id]);
        refresh();
      },
    });
  };

  return (
    <div className="min-h-full overflow-y-auto p-3 sm:p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <Panel title="Storage">
          {summary ? <StorageOverview summary={summary} /> : <PanelSkeleton rows={3} />}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="By kind">
            {breakdown ? <StorageBreakdown breakdown={breakdown} /> : <PanelSkeleton rows={5} />}
          </Panel>

          <Panel title="Suggestions">
            {cleanup ? (
              <CleanupSuggestions
                suggestions={cleanup}
                onReview={(suggestion) => {
                  // Reviewing hands off to the place built for reviewing files.
                  // A second, lesser file list inside the storage page would be
                  // a listing without selection, sorting or a context menu.
                  if (suggestion.id === "old-trash") router.push("/dashboard/trash");
                  else if (suggestion.id === "duplicates") {
                    router.push(
                      `/dashboard/search?q=${encodeURIComponent(suggestion.items[0]?.name ?? "")}`,
                    );
                  } else router.push("/dashboard/files?sort=size");
                }}
              />
            ) : (
              <PanelSkeleton rows={4} />
            )}
          </Panel>

          <Panel title="Largest files">
            {largest ? (
              <LargestFiles
                files={largest}
                onPreview={setPreviewing}
                onShare={setSharing}
                onTrash={trash}
              />
            ) : (
              <PanelSkeleton rows={6} />
            )}
          </Panel>

          <Panel title="Recent activity">
            {activity ? <StorageActivity events={activity} /> : <PanelSkeleton rows={6} />}
          </Panel>
        </div>
      </div>

      <PreviewDialog
        open={Boolean(previewing)}
        items={previewing ? [previewing] : []}
        index={0}
        actions={[]}
        onClose={() => setPreviewing(null)}
        onIndex={() => {}}
      />

      <ShareDialog
        item={sharing}
        open={Boolean(sharing)}
        onClose={() => setSharing(null)}
        onChanged={refresh}
      />
    </div>
  );
}
