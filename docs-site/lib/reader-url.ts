export function readerPathForDocsUrl(docsUrl: string): string {
  const pathname = docsUrl.split('#')[0] ?? docsUrl;
  if (pathname === '/docs') return '/reader/README';
  if (pathname.startsWith('/docs/')) return `/reader${pathname.slice('/docs'.length)}`;
  return '/reader/README';
}

export function paneReaderUrl(stack: string[]): string {
  const last = stack.at(-1) ?? '/docs/README';
  const query = new URLSearchParams();
  for (const page of stack) query.append('pane', page);
  const path = readerPathForDocsUrl(last);
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}
