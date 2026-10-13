import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  outputFileTracingRoot: repoRoot,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/docs/:slug*.md',
        destination: '/llms.mdx/docs/:slug*/content.md',
      },
    ];
  },
};

export default withMDX(config);
