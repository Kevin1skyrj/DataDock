/**
 * What a file looks like inside.
 *
 * The fixtures have no bytes, so this stands in for whatever the real preview
 * pipeline will return. That pipeline is not one thing: an image is a presigned
 * S3 URL, a PDF is a rendered page set, a text file is a ranged read, and a
 * video is a streaming URL with a poster. So this returns a *descriptor* — a
 * kind plus whatever that kind needs — rather than pretending they are all the
 * same shape and forcing the renderer to guess.
 *
 * Everything is derived from the file's id, so the same file always previews
 * the same way. A preview that changed each time you opened it would be a
 * strange thing to look at.
 */

/** Stable pseudo-random from a string, so mock content never flickers. */
function seed(id) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A placeholder image, drawn rather than fetched.
 *
 * Hex values here are content, not design — this is standing in for pixels an
 * S3 object would supply, and it is generated in the service layer precisely so
 * no component ever holds a colour it did not get from a token.
 */
function mockImage(item) {
  const hue = seed(item.id) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 55% 42%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 48) % 360} 60% 22%)"/>
    </linearGradient></defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <circle cx="${300 + (seed(item.id) % 500)}" cy="${200 + (seed(item.name) % 300)}" r="180"
      fill="hsl(${(hue + 180) % 360} 70% 60%)" opacity="0.35"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SAMPLE = {
  code: `{
  "brand": {
    "blue":   { "value": "#4c8dff" },
    "purple": { "value": "#6d5cf5" },
    "teal":   { "value": "#2fbfa5" }
  },
  "radius": { "sm": 6, "md": 8, "lg": 12 },
  "motion": {
    "standard": "cubic-bezier(0.22, 0.61, 0.36, 1)",
    "expo":     "cubic-bezier(0.16, 1, 0.3, 1)"
  }
}`,
  markdown: `# Brand refresh — working notes

The new mark reads at 16px, which was the whole problem with the old one.

## Decisions

- **Wordmark stays.** It is the thing people recognise.
- Accent is switchable; the mark is not.
- Two weights only. A third was never used.

## Open

1. Favicon at 16px still muddies — test the simplified path.
2. Ask Northline whether they need an EPS.

> Keep the palette to what a screen can actually show.`,
  text: `Kickoff — 14 March

Present: Alex, Sam, Priya, Northline (Dana)

Dana walked through what they have now: three drives, no shared naming, and
nobody sure which deck is current. That is the actual problem, not storage.

Actions
  - Alex: audit the existing structure before we propose anything
  - Sam: rough the migration path
  - Priya: draft the naming convention

Next: Thursday, same time.`,
};

/**
 * @param {object} item
 * @returns {Promise<object>} a descriptor whose `kind` decides the renderer
 */
export async function getPreview(item) {
  // Slower than a listing — a preview is a second request for the object
  // itself, and pretending otherwise hides every loading state.
  await wait(280);

  switch (item.kind) {
    case "image":
      return { kind: "image", url: mockImage(item), width: 1200, height: 800 };

    case "pdf":
      return {
        kind: "pdf",
        pages: 1 + (seed(item.id) % 18),
        // Real pages arrive as rendered images; these stand in for them.
        pageUrls: Array.from({ length: 3 }, (_, page) =>
          mockImage({ id: `${item.id}-${page}`, name: item.name }),
        ),
      };

    case "video":
      return {
        kind: "video",
        poster: mockImage(item),
        duration: 120 + (seed(item.id) % 2400),
      };

    case "audio":
      return {
        kind: "audio",
        duration: 60 + (seed(item.id) % 400),
        // A real waveform is precomputed on upload and cached; this is the
        // same shape, so the renderer will not change.
        peaks: Array.from({ length: 96 }, (_, index) =>
          0.2 + 0.8 * Math.abs(Math.sin(index * 0.4 + seed(item.id))),
        ),
      };

    case "code":
      return { kind: "code", language: item.name.split(".").pop(), content: SAMPLE.code };

    case "doc": {
      if (item.name.endsWith(".md")) return { kind: "markdown", content: SAMPLE.markdown };
      if (item.name.endsWith(".txt")) return { kind: "text", content: SAMPLE.text };
      return { kind: "unsupported", reason: "Documents open in their own editor." };
    }

    default:
      return {
        kind: "unsupported",
        reason: "There is no preview for this kind of file yet.",
      };
  }
}
