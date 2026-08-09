import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatBytes, formatCount, formatDate, formatDateFull } from "@/lib/format";

describe("formatBytes", () => {
  it("uses decimal units, because storage is sold in them", () => {
    // The comment in the module makes this a promise: 1 KB is 1000 bytes, not
    // 1024. Getting this wrong is what makes a 100 GB plan report 93.1 GB.
    assert.equal(formatBytes(1000), "1.0 KB");
    assert.equal(formatBytes(1_000_000), "1.0 MB");
    assert.equal(formatBytes(1_000_000_000), "1.0 GB");
  });

  it("drops the decimal at and above 100 so columns stay scannable", () => {
    assert.equal(formatBytes(4_400_000), "4.4 MB");
    assert.equal(formatBytes(612_400_000), "612 MB");
  });

  it("never shows a fractional byte", () => {
    assert.equal(formatBytes(1), "1 B");
    assert.equal(formatBytes(999), "999 B");
  });

  it("distinguishes zero from unknown", () => {
    // A folder has no size and must not claim to be empty.
    assert.equal(formatBytes(0), "0 B");
    assert.equal(formatBytes(null), "—");
    assert.equal(formatBytes(undefined), "—");
  });

  it("clamps at the largest unit it knows", () => {
    assert.match(formatBytes(5_000_000_000_000_000), /TB$/);
  });
});

describe("formatDate", () => {
  const at = (offsetDays, hours = 9, minutes = 5) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  it("names today and yesterday rather than dating them", () => {
    assert.match(formatDate(at(0)), /^Today, \d{2}:\d{2}$/);
    assert.match(formatDate(at(1)), /^Yesterday, \d{2}:\d{2}$/);
  });

  it("omits the year within the current year", () => {
    const jan = new Date(new Date().getFullYear(), 0, 15, 12, 0, 0);
    // Only meaningful when that date is actually in the past.
    if (jan < new Date()) {
      const out = formatDate(jan.toISOString());
      assert.doesNotMatch(out, /\d{4}/, `expected no year in "${out}"`);
    }
  });

  it("includes the year once outside it", () => {
    assert.match(formatDate("2019-03-04T10:00:00Z"), /2019/);
  });

  it("returns the em dash for missing or unparseable input", () => {
    assert.equal(formatDate(null), "—");
    assert.equal(formatDate(""), "—");
    assert.equal(formatDate("not-a-date"), "—");
    assert.equal(formatDateFull("not-a-date"), "—");
  });
});

describe("formatCount", () => {
  it("pluralises and groups thousands", () => {
    assert.equal(formatCount(1), "1 item");
    assert.equal(formatCount(0), "0 items");
    assert.equal(formatCount(2), "2 items");
    assert.equal(formatCount(1234), "1,234 items");
  });

  it("takes a custom noun", () => {
    assert.equal(formatCount(1, "file"), "1 file");
    assert.equal(formatCount(3, "folder"), "3 folders");
  });
});
