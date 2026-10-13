# Guide docs reader

This Next.js app renders the Markdown and MDX files directly from `../guides`. Guide files stay in the repository's existing content tree, and their folder paths become `/docs/...` URLs. Repository agent instructions, the authoring template, and generated experiment results are excluded. Links to the template, runnable projects, and non-Markdown evidence files open the corresponding files in this repository on GitHub.

## Run the site

Use Node.js 22 or newer.

```sh
cd docs-site
npm ci
npm run dev
```

Open `http://localhost:3000`. The app opens `/docs/README`, the guide index. The sidebar, search, Copy Markdown actions, and pane reader are available from there. `npm run build` creates a production build; `npm run start` serves it.

## Styling

Tailwind CSS v4 is configured in `postcss.config.mjs` and imported with the Fumadocs presets in `app/globals.css`. Use utility classes in JSX for layout, typography, responsive behavior, and state. Fumadocs color utilities such as `bg-fd-card` follow the site theme. The `reader-theme` utility scopes pane colors and provides matching light and dark palettes. Runtime pane offsets remain inline because they depend on the open page index.

See [Tailwind's utility class guide](https://tailwindcss.com/docs/styling-with-utility-classes).

## Add an interactive React component

1. Put the component in `components/`. Add `'use client';` when it uses state, event handlers, or browser APIs.
2. Register it in `components/mdx.tsx` inside `getMDXComponents`.
3. Create or edit an `.mdx` file in `../guides/` and use the registered component as a JSX tag.

The component map is passed to the compiled MDX body by the server route. Fumadocs keeps document rendering on the server and hydrates client components. Plain `.md` files work for prose and code; use `.mdx` when a page needs JSX.

Pages with a title and opening paragraph get Fumadocs' **Copy Markdown** and **Open** actions below that introduction. `/docs/<page>.md` is rewritten to a route backed by `llms()` and processed MDX, so copied source retains JSX rather than trying to serialize the live component.

## Read linked pages in panes

Choose **Pane reader** in the docs navigation or open `/reader`. It starts from the guide index and renders each linked page beside the pages already open. Internal links in a pane append a column; following a link from an earlier pane replaces the columns to its right. Each page stays mounted in a horizontal track. Desktop pages are 750px wide and stick at successive 40px offsets. Scrolling right makes later pages cover earlier pages, leaving clickable vertical title strips; selecting a strip scrolls its page back into view. The number of visible pages follows the viewport width. On narrow screens, pages scroll horizontally without sticky overlays. Each open column has its own vertical scroll position, while the whole reader scrolls horizontally. The `pane` query parameters preserve the open sequence, so a reader view can be bookmarked or shared. The usual Fumadocs sidebar remains available for browsing and search.

## Source references

Implementation follows the Fumadocs documentation checked 2026-10-11:

- [Next.js manual installation](https://www.fumadocs.dev/docs/manual-installation/next) — Next.js, Tailwind CSS, root provider, styles, routes, and MDX component registration.
- [Fumadocs MDX with Next.js](https://www.fumadocs.dev/docs/mdx/next) — MDX compiler setup, `loader()` source integration, and server-rendered page bodies.
- [Fumadocs MDX collections](https://www.fumadocs.dev/docs/mdx/collections) — Markdown/MDX collection filters and frontmatter schema.
- [Fumadocs UI components](https://www.fumadocs.dev/docs/ui/components) — default MDX components and relative source links.
- [Fumadocs Docs Layout](https://www.fumadocs.dev/docs/ui/layouts/docs) and [layout links](https://www.fumadocs.dev/docs/ui/layouts/links) — docs layout and navigation.
- [Fumadocs AI & LLMs](https://www.fumadocs.dev/docs/integrations/llms) — processed Markdown routes and page actions.

Dependency versions are recorded in `package.json` and `package-lock.json`.
