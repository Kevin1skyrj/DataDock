import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Shared file" };

export default async function PublicSharePage({ params }) {
  const { token } = await params;
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shares/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });

  if (!response.ok) notFound();
  const { data } = await response.json();

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <section className="w-full max-w-lg rounded-xl border border-line bg-overlay p-6 text-center">
        <p className="text-sm text-brand">Shared through DataDock</p>
        <h1 className="mt-2 text-display-xs font-semibold text-foreground">{data.name}</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Permission: {data.access}. {data.expiresAt ? `Expires ${new Date(data.expiresAt).toLocaleString()}.` : "This link does not expire."}
        </p>
        <Link href="/" className="mt-5 inline-block text-base font-medium text-brand">
          Open DataDock
        </Link>
      </section>
    </main>
  );
}
