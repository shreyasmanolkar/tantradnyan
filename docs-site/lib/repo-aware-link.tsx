import type { ComponentProps, ComponentType } from 'react';

const repositoryFileUrl = 'https://github.com/shreyasmanolkar/tantradnyan-v2/blob/main';
const localOrigin = 'https://tantradnyan.invalid';

export function createRepoAwareLink(
  pageUrl: string,
  fallback: ComponentType<ComponentProps<'a'>>,
): ComponentType<ComponentProps<'a'>> {
  return function RepoAwareLink(props) {
    if (props.href) {
      const target = new URL(props.href, new URL(pageUrl, localOrigin));
      let repositoryPath: string | undefined;

      if (target.origin === localOrigin && target.pathname.startsWith('/playground/')) {
        repositoryPath = target.pathname.slice(1);
      } else if (target.origin === localOrigin && target.pathname === '/docs/AGENTS.md') {
        repositoryPath = 'AGENTS.md';
      } else if (target.origin === localOrigin && target.pathname === '/docs/TEMPLATE.md') {
        repositoryPath = 'guides/TEMPLATE.md';
      } else if (
        target.origin === localOrigin &&
        target.pathname.startsWith('/docs/') &&
        /\.(?:json|png|jpe?g|svg|webp|pdf)$/i.test(target.pathname)
      ) {
        repositoryPath = `guides/${target.pathname.slice('/docs/'.length)}`;
      }

      if (repositoryPath) {
        const href = `${repositoryFileUrl}/${repositoryPath}${target.search}${target.hash}`;
        return (
          <a
            {...props}
            href={href}
            target={props.target ?? '_blank'}
            rel={props.rel ?? 'noreferrer'}
          />
        );
      }
    }

    const Fallback = fallback;
    return <Fallback {...props} />;
  };
}
