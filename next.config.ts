import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Keep old bookmarks useful while permanently closing public registration. */
  async redirects() {
    return [
      { source: "/admin", destination: "/dashboard", permanent: false },
      { source: "/admin/login", destination: "/login", permanent: false },
      { source: "/admin/profile", destination: "/dashboard", permanent: false },
      { source: "/admin/edit", destination: "/dashboard/edit", permanent: false },
      { source: "/admin/edit/:id", destination: "/dashboard/edit/:id", permanent: false },
      { source: "/signup", destination: "/", permanent: false },
      { source: "/register", destination: "/", permanent: false },
      { source: "/sign-up", destination: "/", permanent: false },
      { source: "/signin", destination: "/login", permanent: false },
      { source: "/sign-in", destination: "/login", permanent: false },
      { source: "/profile", destination: "/dashboard", permanent: false },
      { source: "/dashboard/accounts", destination: "/dashboard", permanent: false },
      { source: "/dashboard/profile", destination: "/dashboard", permanent: false },
      { source: "/about", destination: "/students", permanent: false },
    ];
  },
};

export default nextConfig;
