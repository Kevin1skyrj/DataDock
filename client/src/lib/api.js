/**
 * Where the backend lives.
 *
 * Read from the environment rather than written here, because the value changes
 * per machine and per deployment: `192.168.0.101` is a DHCP lease that the
 * router can reassign, and production is a different host entirely. Keeping it
 * in `.env.local` means those are config changes, not commits.
 *
 * The `NEXT_PUBLIC_` prefix is required. Without it Next treats the variable as
 * server-only and it arrives as `undefined` in anything that runs in the
 * browser — which is the most common way this breaks.
 *
 * Note that Next inlines these at build time, so changing `.env.local` needs a
 * dev-server restart to take effect.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
