import { Cloud } from "lucide-react";

/**
 * A provider's mark.
 *
 * Google's is theirs and has to be drawn unaltered, which makes this the second
 * place in the product where fixed hex values are correct — the accent system
 * deliberately does not reach a third party's logo. Everything without a mark
 * of its own falls back to a neutral cloud rather than to an invented one.
 */
export function ProviderMark({ id, className = "size-4" }) {
  if (id === "google-drive") {
    return (
      <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#0066da" d="M6.6 39.4 2.8 32.8a4 4 0 0 1 0-4l11.1-19.2 7.6 4.4L10.4 33h12l-4 6.4Z" />
        <path fill="#00ac47" d="M24 4.6a4 4 0 0 1 3.5 2l13.7 23.7a4 4 0 0 1 0 4l-3.8 6.6-4-6.4L22 8.9a4 4 0 0 1 2-4.3Z" />
        <path fill="#ea4335" d="M14.9 39.4h22.5l-3.8 6.6a4 4 0 0 1-3.5 2H18.6a4 4 0 0 1-3.5-2Z" />
        <path fill="#00832d" d="M13.9 9.6 22 8.9l-7.5 13-7.9-.2Z" opacity=".25" />
      </svg>
    );
  }

  return <Cloud className={className} aria-hidden="true" />;
}
