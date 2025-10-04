import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: ["@polymart/backend"],
	outputFileTracingRoot: require("path").join(__dirname, "../../"),
};

export default nextConfig;
