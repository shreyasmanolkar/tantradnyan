import { pageSchema } from 'fumadocs-core/source/schema';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { z } from 'zod';

function inferTitle(path: string, source: string): string {
  const heading = source.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1]?.trim();
  if (heading) return heading;

  const parts = path.replaceAll('\\', '/').split('/');
  const file = parts.at(-1)?.replace(/\.(md|mdx)$/i, '') ?? 'Untitled';
  const name = /^readme$/i.test(file) ? parts.at(-2) ?? 'Untitled' : file;

  return name
    .replaceAll(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const { docs, meta } = defineDocs({
  // Keep the guide tree in its existing location and preserve topic prefixes.
  dir: '../guides',
  docs: {
    files: [
      '**/*.md',
      '**/*.mdx',
      '!**/AGENTS.md',
      '!TEMPLATE.md',
      '!**/node_modules/**',
      '!**/experiments/results/**',
    ],
    // Existing repository docs use H1 headings instead of frontmatter titles.
    // Infer the required Fumadocs title while honoring any authored title.
    schema: (context) =>
      pageSchema.extend({
        title: z.string().default(inferTitle(context.path, context.source)),
      }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    files: ['**/meta.json'],
  },
});

export default defineConfig({});
