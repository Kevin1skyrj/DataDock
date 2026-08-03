import { PageContainer } from "@/components/dashboard/page-container";

/**
 * A screen that does not exist yet.
 *
 * Every destination in the sidebar resolves to something, which is what makes
 * the shell reviewable: you can navigate it, watch the active state track, read
 * the breadcrumbs change and jump around with ⌘K, all before a single page has
 * been designed.
 *
 * It says plainly that it is a placeholder. A convincing empty state here would
 * be a screen someone has to notice is fake, and this milestone is the shell —
 * the pages come next, one at a time.
 */
export function PagePlaceholder({ title, description }) {
  return (
    <PageContainer>
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-display-xs font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="max-w-80 text-base leading-[1.6] text-muted-foreground text-balance">
          {description}
        </p>
      </div>
    </PageContainer>
  );
}
