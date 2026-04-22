/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  serverExternalPackages: [
    "@google/gemini-cli-core",
    "tree-sitter-bash",
    "web-tree-sitter",
    "node-pty",
  ],
}

export default nextConfig
