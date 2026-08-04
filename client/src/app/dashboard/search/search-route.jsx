"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import { SearchFilters } from "@/components/search/search-filters";
import { FileWorkspace } from "@/components/workspace/file-workspace";
import { useWorkspace } from "@/components/workspace/workspace-context";
import { WORKSPACE_VIEWS } from "@/constants/workspace-views";
import { rememberSearch } from "@/lib/recent-searches";

/**
 * Search.
 *
 * Results render through `FileWorkspace`, so everything that works in All files
 * works here — selection, sorting, the context menu, Quick Look, sharing, drag
 * to move. A bespoke results list would be a listing without any of that, which
 * is what makes search feel like a lesser part of most products.
 *
 * Every filter lives in the URL. That is what makes a result set something you
 * can send to someone, bookmark, or reach again with the back button — and it
 * is what lets the workspace refetch from the same derived key it uses
 * everywhere else, with no effect watching the filters and no second source of
 * truth to fall out of step.
 */
export function SearchRoute() {
  const router = useRouter();
  const params = useSearchParams();

  const query = params.get("q") ?? "";

  const filters = useMemo(
    () => ({
      kinds: params.get("kind")?.split(",").filter(Boolean) ?? [],
      date: params.get("date") ?? "any",
      size: params.get("size") ?? "any",
      owner: params.get("owner") ?? "anyone",
      sharedOnly: params.get("shared") === "1",
    }),
    [params],
  );

  const scope = useMemo(
    () => ({
      query,
      kinds: filters.kinds,
      date: filters.date,
      size: filters.size,
      owner: filters.owner,
      sharedOnly: filters.sharedOnly,
    }),
    [query, filters],
  );

  // Remembered on a debounce rather than per keystroke, or the history fills
  // with every prefix of what was actually typed.
  useEffect(() => {
    if (query.trim().length < 2) return undefined;
    const id = window.setTimeout(() => rememberSearch(query), 900);
    return () => window.clearTimeout(id);
  }, [query]);

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(params);
      const write = (key, value, empty) => {
        if (value === undefined) return;
        if (value === empty || (Array.isArray(value) && value.length === 0)) next.delete(key);
        else next.set(key, Array.isArray(value) ? value.join(",") : String(value));
      };

      write("q", changes.query, "");
      write("kind", changes.kinds, undefined);
      write("date", changes.date, "any");
      write("size", changes.size, "any");
      write("owner", changes.owner, "anyone");
      if (changes.sharedOnly !== undefined) {
        if (changes.sharedOnly) next.set("shared", "1");
        else next.delete("shared");
      }

      // `replace`, not `push`: typing a query would otherwise stack one history
      // entry per character and make the back button unusable.
      router.replace(`/dashboard/search?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  return (
    <FileWorkspace
      view={WORKSPACE_VIEWS.search}
      scope={scope}
      header={<SearchHeader query={query} filters={filters} onChange={update} />}
    />
  );
}

/**
 * Inside the provider, so the field can report the count the workspace
 * actually fetched rather than running the same search a second time.
 */
function SearchHeader({ query, filters, onChange }) {
  const { total, loading, facets } = useWorkspace();

  return (
    <SearchFilters
      query={query}
      filters={filters}
      facets={facets}
      total={total}
      loading={loading}
      onChange={onChange}
    />
  );
}
