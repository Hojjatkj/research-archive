import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Old and commonly-guessed URLs never 404 — they land on the real pages.
   */
  async redirects() {
    return [
      { source: "/admin", destination: "/dashboard", permanent: false },
      { source: "/admin/login", destination: "/login", permanent: false },
      { source: "/admin/profile", destination: "/dashboard/profile", permanent: false },
      { source: "/admin/edit", destination: "/dashboard/edit", permanent: false },
      { source: "/admin/edit/:id", destination: "/dashboard/edit/:id", permanent: false },
      { source: "/register", destination: "/signup", permanent: false },
      { source: "/sign-up", destination: "/signup", permanent: false },
      { source: "/signin", destination: "/login", permanent: false },
      { source: "/sign-in", destination: "/login", permanent: false },
      { source: "/profile", destination: "/dashboard/profile", permanent: false },
      { source: "/about", destination: "/students", permanent: false },
    ];
  },
};

export default nextConfig;
