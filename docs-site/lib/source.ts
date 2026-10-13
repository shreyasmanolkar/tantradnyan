import { llms, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/plugins/lucide-icons';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';
import { docs, meta } from 'collections/server';

export const source = loader({
  baseUrl: '/docs',
  source: toFumadocsSource(docs, meta),
  plugins: [lucideIconsPlugin()],
});

export const docsLlms = llms(source, {
  renderPage: async (page) =>
    `# ${page.data.title} (${page.url})\n\n${await page.data.getText('processed')}`,
});
