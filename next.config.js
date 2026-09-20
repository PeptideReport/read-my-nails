/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  optimizeFonts: false,
  // Fonts, the resvg wasm and the buyer's guide are read from disk at runtime: make sure Vercel ships them with every function.
  experimental: { outputFileTracingIncludes: { '/**': ['./assets/**', './data/**', './node_modules/harfbuzzjs/**', './node_modules/satori/**', './node_modules/@resvg/resvg-wasm/**'] }, serverComponentsExternalPackages: ['satori', '@resvg/resvg-wasm', 'sharp'] },
  async rewrites() {
    return [
      // Each salon's kiosk app lives at /k/<salon-slug>. Same app.html, tenant read from the URL.
      { source: '/k/:tenant', destination: '/app.html' },
    ];
  },
};
