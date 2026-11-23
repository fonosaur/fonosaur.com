// RELEASE DAY: set to false to let search engines index the Pockets EP page.
// Also delete the matching <meta name="robots"> line in
// public/pockets-ep/index.html (search for POCKETS_EP_UNLISTED).
const POCKETS_EP_UNLISTED = true;

const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `output: 'export'` — Keystatic's admin needs a server runtime (Vercel).
  typescript: {
    // The big interactive shell is plain .jsx and isn't type-checked.
    ignoreBuildErrors: false,
  },
  // Pockets EP player: a static page in public/pockets-ep (like
  // public/create.html), served at the clean /pockets-ep URL. Its assets use
  // absolute /pockets-ep/... paths, so they resolve with or without a
  // trailing slash.
  async rewrites() {
    return [{ source: "/pockets-ep", destination: "/pockets-ep/index.html" }];
  },
  async headers() {
    if (!POCKETS_EP_UNLISTED) return [];
    return [
      { source: "/pockets-ep", headers: NOINDEX },
      // The underlying file and its assets are reachable directly too.
      { source: "/pockets-ep/:path*", headers: NOINDEX },
    ];
  },
};

export default nextConfig;
