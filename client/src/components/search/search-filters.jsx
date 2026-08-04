"use client";

import { Check, ChevronDown, Clock, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { FILE_KINDS } from "@/constants/file-kinds";
import { clearSearches, forgetSearch, useRecentSearches } from "@/lib/recent-searches";
import { cn } from "@/lib/utils";

const DATES = [
  { id: "any", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "week", label: "Past week" },
  { id: "month", label: "Past month" },
  { id: "year", label: "Past year" },
];

const SIZES = [
  { id: "any", label: "Any size" },
  { id: "small", label: "Under 1 MB" },
  { id: "medium", label: "1 MB – 100 MB" },
  { id: "large", label: "Over 100 MB" },
];

const OWNERS = [
  { id: "anyone", label: "Anyone" },
  { id: "me", label: "Me" },
];

function Facet({ label, value, options, active, onSelect }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className={cn("gap-1.5", active && "border-brand/35 text-foreground")}
          >
            {value}
            <ChevronDown className="size-3.5 text-dim" />
          </Button>
        }
      />
      <DropdownMenuContent className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {options.map((option) => (
            <DropdownMenuItem key={option.id} onClick={() => onSelect(option.id)}>
              <span className="flex-1">{option.label}</span>
              {option.label === value ? <Check className="size-3.5 text-brand" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The search bar, and everything that narrows it.
 *
 * Filters live in the URL rather than in component state, which is what makes a
 * result set something you can send to someone, bookmark, or reach again with
 * the back button. It is also what lets the workspace below refetch from the
 * same derived key it uses everywhere else — no effect watching the filters, no
 * second source of truth.
 *
 * Facet counts come from the *matched* set before the other filters narrow it,
 * so ticking Images does not drop every other kind to zero and leave no way
 * back out.
 */
export function SearchFilters({ query, filters, facets, total, loading, onChange }) {
  const recent = useRecentSearches();
  const active =
    filters.kinds.length > 0 ||
    filters.date !== "any" ||
    filters.size !== "any" ||
    filters.owner !== "anyone" ||
    filters.sharedOnly;

  const toggleKind = (kind) =>
    onChange({
      kinds: filters.kinds.includes(kind)
        ? filters.kinds.filter((entry) => entry !== kind)
        : [...filters.kinds, kind],
    });

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-line p-3">
      <div className="flex items-center gap-2">
        <Input
          size="lg"
          value={query}
          autoFocus
          placeholder="Search files and folders…"
          aria-label="Search"
          startIcon={<Search />}
          onChange={(event) => onChange({ query: event.target.value })}
          endSlot={
            query ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Clear search"
                className="-mr-2"
                onClick={() => onChange({ query: "" })}
              >
                <X />
              </Button>
            ) : null
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant={filters.kinds.length ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5"
              >
                {filters.kinds.length
                  ? `${filters.kinds.length} kind${filters.kinds.length > 1 ? "s" : ""}`
                  : "Kind"}
                <ChevronDown className="size-3.5 text-dim" />
              </Button>
            }
          />
          <DropdownMenuContent className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Kind</DropdownMenuLabel>
              {Object.entries(FILE_KINDS).map(([id, kind]) => {
                const count = facets?.kinds.find((facet) => facet.kind === id)?.count ?? 0;
                return (
                  <DropdownMenuItem key={id} closeOnClick={false} onClick={() => toggleKind(id)}>
                    <span className="flex-1">{kind.label}</span>
                    {count ? <span className="text-2xs text-dim">{count}</span> : null}
                    {filters.kinds.includes(id) ? (
                      <Check className="size-3.5 text-brand" />
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Facet
          label="Modified"
          value={DATES.find((entry) => entry.id === filters.date).label}
          options={DATES}
          active={filters.date !== "any"}
          onSelect={(date) => onChange({ date })}
        />

        <Facet
          label="Size"
          value={SIZES.find((entry) => entry.id === filters.size).label}
          options={SIZES}
          active={filters.size !== "any"}
          onSelect={(size) => onChange({ size })}
        />

        <Facet
          label="Owner"
          value={OWNERS.find((entry) => entry.id === filters.owner).label}
          options={OWNERS}
          active={filters.owner !== "anyone"}
          onSelect={(owner) => onChange({ owner })}
        />

        <Button
          variant={filters.sharedOnly ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={filters.sharedOnly}
          className={cn(filters.sharedOnly && "border-brand/35 text-foreground")}
          onClick={() => onChange({ sharedOnly: !filters.sharedOnly })}
        >
          Shared only
        </Button>

        {active ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                kinds: [],
                date: "any",
                size: "any",
                owner: "anyone",
                sharedOnly: false,
              })
            }
          >
            Clear filters
          </Button>
        ) : null}

        <span className="ml-auto shrink-0 text-sm text-dim" aria-live="polite">
          {loading ? "Searching…" : query ? `${total} result${total === 1 ? "" : "s"}` : null}
        </span>
      </div>

      {/* Only while the field is empty. A history that stays visible over
          results is a list competing with the answer. */}
      {!query && recent.length ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="flex items-center gap-1.5 text-sm text-dim">
            <Clock className="size-3.5" />
            Recent
          </span>

          {recent.map((entry) => (
            <span key={entry} className="group flex items-center">
              <button
                type="button"
                onClick={() => onChange({ query: entry })}
                className="rounded-l-md border border-line bg-surface py-1 pr-1.5 pl-2.5 text-sm text-muted-foreground transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-foreground"
              >
                {entry}
              </button>
              <button
                type="button"
                aria-label={`Forget “${entry}”`}
                onClick={() => forgetSearch(entry)}
                className="rounded-r-md border border-l-0 border-line bg-surface px-1.5 py-1 text-dim transition-colors duration-150 ease-standard hover:bg-surface-2 hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}

          <Button variant="ghost" size="sm" onClick={clearSearches}>
            Clear
          </Button>
        </div>
      ) : null}
    </div>
  );
}
