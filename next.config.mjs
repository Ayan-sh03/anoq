export default function nextConfig() {
  return {
    allowedDevOrigins: ["127.0.0.1", "*.localhost", ...(process.env.WEB_BIND_ADDRESS ? [process.env.WEB_BIND_ADDRESS] : [])],
    turbopack: { root: import.meta.dirname },
    async rewrites() {
      if (process.env.VERCEL) return [];
      const origin = process.env.GO_API_ORIGIN || "http://127.0.0.1:8000";
      return [{ source: "/api/:path*", destination: `${origin}/api/:path*` }];
    },
  };
}
