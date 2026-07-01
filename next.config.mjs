/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `output: 'export'` — Keystatic's admin needs a server runtime (Vercel).
  typescript: {
    // The big interactive shell is plain .jsx and isn't type-checked.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
