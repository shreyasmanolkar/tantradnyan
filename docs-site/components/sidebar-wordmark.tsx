import wordmark from './tantradnya-wordmark';

export function SidebarWordmark() {
  return (
    <span
      className="inline-flex max-w-full items-center justify-center text-inherit [&_svg]:block [&_svg]:h-10 [&_svg]:w-auto [&_svg]:max-w-[8.5rem] [&_svg]:shrink-0 md:[&_svg]:h-11"
      dangerouslySetInnerHTML={{ __html: wordmark }}
    />
  );
}
