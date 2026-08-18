import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Shared file" };

export default async function PublicSharePage({ params }) {
  const { token } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const encodedToken = encodeURIComponent(token);
  const response = await fetch(`${apiUrl}/shares/${encodedToken}`, {
    cache: "no-store",
  });

  if (!response.ok) notFound();
  const { data } = await response.json();
  let preview = null;

  if (data.type === "file") {
    const previewResponse = await fetch(`${apiUrl}/shares/${encodedToken}/preview`, {
      cache: "no-store",
    });
    if (previewResponse.ok) preview = (await previewResponse.json()).data;
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <section className="w-full max-w-5xl rounded-xl border border-line bg-overlay p-6 text-center">
        <p className="text-sm text-brand">Shared through DataDock</p>
        <h1 className="mt-2 text-display-xs font-semibold text-foreground">{data.name}</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Permission: {data.access}. {data.expiresAt ? `Expires ${new Date(data.expiresAt).toLocaleString()}.` : "This link does not expire."}
        </p>
        {preview ? <SharedPreview preview={preview} name={data.name} /> : null}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          {data.type === "file" ? (
            <a
              href={`${apiUrl}/shares/${encodedToken}/download`}
              className="rounded-lg bg-brand px-4 py-2 text-base font-medium text-brand-contrast"
            >
              Download
            </a>
          ) : null}
          <Link href="/" className="text-base font-medium text-brand">
            Open DataDock
          </Link>
        </div>
      </section>
    </main>
  );
}

function SharedPreview({ preview, name }) {
  if (["pdf", "office"].includes(preview.kind)) {
    return <iframe src={preview.url} title={name} className="mt-6 h-[65dvh] w-full rounded-lg bg-bg-deep" />;
  }
  if (preview.kind === "image") {
    // The URL is a short-lived S3 signature with a dynamic host and query string.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={preview.url} alt={name} className="mx-auto mt-6 max-h-[65dvh] rounded-lg object-contain" />;
  }
  if (preview.kind === "video") {
    return <video src={preview.url} aria-label={name} controls className="mx-auto mt-6 max-h-[65dvh] max-w-full rounded-lg" />;
  }
  if (preview.kind === "audio") {
    return <audio src={preview.url} aria-label={name} controls className="mx-auto mt-6 w-full max-w-xl" />;
  }
  if (["text", "code", "markdown"].includes(preview.kind)) {
    return <pre className="mt-6 max-h-[65dvh] overflow-auto rounded-lg bg-bg-deep p-4 text-left font-mono text-sm text-foreground">{preview.content}</pre>;
  }
  return <p className="mt-6 text-sm text-muted-foreground">{preview.reason}</p>;
}
