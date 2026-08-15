/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Machines allowed to reach the dev server from another origin.
   *
   * Next 16 refuses cross-origin requests to `/_next/*` in development unless
   * the origin is listed here. Opening the site on a LAN address therefore
   * loads the HTML but gets blocked fetching its chunks and its HMR socket —
   * which is why the page arrives without its entrance animation and the
   * console fills with failed WebSocket retries.
   *
   * The wildcard covers a home network's whole range, so a DHCP lease moving
   * from .101 to .103 does not break it again. This applies to `next dev`
   * only; production is unaffected.
   */
  allowedDevOrigins: ["192.168.0.*", "192.168.1.*", "localhost", "127.0.0.1"],
};

export default nextConfig;
