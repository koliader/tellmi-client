import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /**
   * Serves the Go gateway on this origin under `/api`, so the site and its API
   * answer on a single hostname.
   *
   * `resolveApiUrl` in `src/share/api/index.ts` otherwise builds
   * `${protocol}//${hostname}:8080`, and that fallback is unreachable behind a
   * Cloudflare tunnel: the tunnel terminates TLS on 443 and forwards only the
   * one port it was pointed at, so an explicit `:8080` never reaches the
   * gateway. Pointing `NEXT_PUBLIC_API_URL` at `/api` keeps every call
   * same-origin, which also means the gateway's permissive CORS setting stops
   * mattering here.
   *
   * This holds on localhost and on the LAN too, so the client behaves the same
   * in all three places rather than only behind the tunnel.
   *
   * `GATEWAY_ORIGIN` exists so a deployed build can point at a gateway on
   * another host; in development it is the local one.
   */
  async rewrites() {
    const origin = process.env.GATEWAY_ORIGIN ?? "http://localhost:8080";

    return [
      {
        source: "/api/:path*",
        destination: `${origin}/:path*`,
      },
    ];
  },
  /**
   * Next.js infers the workspace root by walking up for a lockfile. An unrelated
   * `/home/khole/pnpm-lock.yaml` made it pick the home directory instead of this
   * package, so Turbopack watched the wrong tree. Pin the root explicitly.
   */
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    /**
     * The dev server otherwise preloads every route's server modules at startup
     * instead of on first request, trading a larger initial footprint for faster
     * first hits. There are 11 routes here, so that preload is mostly startup
     * cost for pages a given session may never open.
     *
     * Measured over three interleaved restarts loading all routes, this is worth
     * roughly 15 MB resident and 30 MB at peak -- consistently lower, but small.
     * The much larger effect is restarting the server itself: a dev server left
     * up for 14 hours sat at ~1.7 GB against ~1.1 GB cold, because Turbopack
     * retains invalidated module versions for HMR. Neither the V8 heap cap
     * (`--max-old-space-size`) nor `turbopackMemoryLimit` moved the resident set
     * at all here, so neither is set; the memory is not in either budget.
     */
    preloadEntriesOnStart: false,
  },
  /**
   * Next.js blocks cross-origin requests to dev-only assets and endpoints by
   * default, which breaks reaching the dev server from another device on the
   * LAN (for example opening http://192.168.1.101:3000 on a phone) or through a
   * Cloudflare tunnel.
   *
   * The dot is a wildcard matching any single label, as documented for this
   * option, so these cover the usual private ranges.
   *
   * `*.trycloudflare.com` is the one that is easy to miss. A quick tunnel
   * hands out a different hostname on every start, and a hostname that is not
   * listed here does not fail loudly: the page's HTML still returns 200, but
   * every dev asset and the HMR endpoint come back 403 "Unauthorized", leaving
   * a rendered page that never hydrates. Matching the whole zone is the only
   * way to cover a name that is not known in advance.
   *
   * Development only: it has no effect on a production build.
   */
  allowedDevOrigins: [
    "192.168.1.*",
    "192.168.0.*",
    "10.*",
    "172.16.*",
    "localhost",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
