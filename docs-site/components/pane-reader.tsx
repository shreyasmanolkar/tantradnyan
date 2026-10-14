'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { paneReaderUrl } from '@/lib/reader-url';

export type ReaderPane = {
  key: string;
  title: string;
  hash: string;
  content: ReactNode;
};

const spineWidth = 40;

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
}

export function PaneReader({ panes }: { panes: ReaderPane[] }) {
  const router = useRouter();
  const viewport = useRef<HTMLDivElement>(null);
  const stackKey = useMemo(() => panes.map((pane) => pane.key).join('\n'), [panes]);
  const [obscured, setObscured] = useState<number[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState<string | undefined>();
  const [fullscreenError, setFullscreenError] = useState('');

  useEffect(() => {
    const update = () => setFullscreenIndex((document.fullscreenElement as HTMLElement | null)?.dataset.paneIndex);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  useEffect(() => {
    const layout = document.getElementById('nd-docs-layout');
    if (!layout) return;

    function openSidebarGuide(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest<HTMLAnchorElement>('a[href]');
      if (
        !link ||
        !link.hasAttribute('data-active') ||
        !link.closest('#nd-sidebar, #nd-sidebar-mobile') ||
        link.hasAttribute('download') ||
        (link.target && link.target !== '_self')
      ) {
        return;
      }

      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        !destination.pathname.startsWith('/reader/')
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const docsUrl = [
        `/docs${destination.pathname.slice('/reader'.length)}`,
        destination.hash,
      ].join('');
      router.push(paneReaderUrl([...panes.map((pane) => pane.key), docsUrl]), {
        scroll: false,
      });
    }

    layout.addEventListener('click', openSidebarGuide, true);
    return () => layout.removeEventListener('click', openSidebarGuide, true);
  }, [panes, router]);

  async function toggleFullscreen(pane: HTMLElement) {
    setFullscreenError('');
    try {
      if (document.fullscreenElement === pane) await document.exitFullscreen();
      else await pane.requestFullscreen();
    } catch {
      setFullscreenError('Fullscreen is unavailable in this browser.');
    }
  }

  async function closePane(index: number) {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Closing the pane should still proceed if fullscreen exit is denied.
      }
    }
    const remaining = panes.flatMap((pane, paneIndex) => paneIndex === index ? [] : [pane.key]);
    router.push(remaining.length === 0 ? '/reader/README' : paneReaderUrl(remaining), { scroll: false });
  }

  useEffect(() => {
    const container = viewport.current;
    if (!container) return;
    let frame = 0;
    const measure = () => {
      const columns = [...container.querySelectorAll<HTMLElement>('[data-reader-pane]')];
      const hidden = columns.flatMap((column, index) => {
        const next = columns[index + 1];
        return next && next.getBoundingClientRect().left <= column.getBoundingClientRect().left + spineWidth + 1
          ? [index]
          : [];
      });
      setObscured((previous) => previous.join(',') === hidden.join(',') ? previous : hidden);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    container.addEventListener('scroll', schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('scroll', schedule);
      observer.disconnect();
    };
  }, [stackKey]);

  useEffect(() => {
    const container = viewport.current;
    if (!container) return;
    container.scrollTo({ left: container.scrollWidth - container.clientWidth, behavior: 'instant' });

    for (const pane of container.querySelectorAll<HTMLElement>('[data-reader-hash]')) {
      const hash = pane.dataset.readerHash;
      if (!hash) continue;
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        id = hash.slice(1);
      }
      const target = pane.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!target) continue;
      pane.scrollTop += target.getBoundingClientRect().top - pane.getBoundingClientRect().top;
    }
  }, [stackKey]);

  function reveal(index: number) {
    const container = viewport.current;
    const pane = container?.querySelector<HTMLElement>('[data-reader-pane]');
    if (!container || !pane) return;
    const offset = window.matchMedia('(max-width: 767px)').matches ? 0 : spineWidth;
    const content = container.querySelectorAll<HTMLElement>('[data-reader-hash]')[index];
    // Move keyboard focus once the page is no longer covered.
    container.addEventListener('scrollend', () => content?.focus({ preventScroll: true }), { once: true });
    container.scrollTo({ left: index * (pane.offsetWidth - offset), behavior: scrollBehavior() });
  }

  const paneOccurrences = new Map<string, number>();
  const paneKeys = panes.map((pane) => {
    const occurrence = paneOccurrences.get(pane.key) ?? 0;
    paneOccurrences.set(pane.key, occurrence + 1);
    return `${pane.key}-${occurrence}`;
  });

  return (
    <main className="reader-theme flex min-h-0 min-w-0 flex-col overflow-hidden bg-fd-background text-fd-foreground scheme-light dark:scheme-dark [grid-area:main]">
      {fullscreenError && <p role="status" className="px-4 py-2">{fullscreenError}</p>}
      {panes.length === 0 && <div className="m-auto p-8 text-center"><p className="mb-4">No open panes.</p><Link className="text-[#0787f9] hover:underline" href="/reader/README">Open the guide index</Link></div>}
      <div ref={viewport} className="flex-auto min-h-0 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-color:#999_transparent] [scrollbar-width:thin]" role="region"
        aria-label="Open documentation panes; scroll horizontally to stack or reveal pages" tabIndex={0}>
        <div className="flex h-full w-max min-w-full">
          {panes.map((pane, index) => (
            <section className="group/pane relative top-0 flex flex-col h-full w-[calc(100vw-40px)] shrink-0 basis-[calc(100vw-40px)] overflow-hidden border-l border-[var(--reader-pane-border)] bg-[var(--reader-pane-background)] shadow-[-3px_0_12px_rgb(0_0_0/8%)] max-md:left-0! md:sticky md:w-[750px] md:basis-[750px] [&:fullscreen]:left-0! [&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:text-fd-foreground" data-reader-pane data-pane-index={index} data-fullscreen={fullscreenIndex === String(index)} data-obscured={obscured.includes(index) && fullscreenIndex !== String(index)}
              key={paneKeys[index]} style={{ left: index * spineWidth, zIndex: index + 1 }}
              aria-label={pane.title}>
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--reader-pane-border)] px-3 py-2 group-data-[obscured=true]/pane:invisible">
                <button type="button" className="cursor-pointer rounded p-2 hover:bg-[var(--reader-pane-hover)] focus-visible:outline-2 focus-visible:outline-[#0787f9]" title={fullscreenIndex === String(index) ? 'Exit fullscreen' : 'Enter fullscreen'} aria-label={`${fullscreenIndex === String(index) ? 'Exit fullscreen for' : 'Fullscreen'} ${pane.title}`} onClick={(event) => void toggleFullscreen(event.currentTarget.closest('section')!)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={fullscreenIndex === String(index) ? 'M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5' : 'M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5'} /></svg>
                </button>
                <button type="button" className="cursor-pointer rounded p-2 hover:bg-[var(--reader-pane-hover)] focus-visible:outline-2 focus-visible:outline-[#0787f9]" title={`Close ${pane.title}`} aria-label={`Close ${pane.title}`} onClick={() => void closePane(index)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-8 [scrollbar-color:#999_transparent] [scrollbar-width:thin] max-md:p-6 group-data-[obscured=true]/pane:invisible group-data-[fullscreen=true]/pane:mx-auto group-data-[fullscreen=true]/pane:w-1/2 max-md:group-data-[fullscreen=true]/pane:w-[calc(100%-48px)] [&_.prose]:text-fd-foreground [&_.prose]:text-base [&_.prose]:leading-[1.5] [&_.prose]:max-w-none [&_.prose_a]:text-[#0787f9] [&_.prose_a]:no-underline [&_.prose_a:hover]:underline [&_.prose_h1]:text-[28px] [&_.prose_h1]:leading-[1.2] [&_.prose_h1]:[margin:0_0_16px] [&_.prose_p]:[margin-block:0_16px] [&_.prose_:is(ul,ol)]:[margin-block:0_16px] [&_.prose_:is(h1,h2,h3,h4)]:text-[var(--reader-pane-heading)] [&_.prose_:is(h1,h2,h3,h4,h5,h6)_a]:text-inherit" data-reader-hash={pane.hash} tabIndex={0}>
                {pane.content}
              </div>
              <button className="items-start appearance-none bg-[var(--reader-pane-background)] border-0 text-[var(--reader-pane-heading)] cursor-pointer flex h-full justify-center left-0 overflow-hidden px-2 py-9 absolute top-0 invisible whitespace-nowrap w-10 group-data-[obscured=true]/pane:visible hover:text-[#0787f9] hover:bg-[var(--reader-pane-hover)] focus-visible:outline-2 focus-visible:outline-[#0787f9] focus-visible:outline-offset-[-3px]" type="button" title={`Open ${pane.title}`}
                aria-label={`Open ${pane.title}`} tabIndex={obscured.includes(index) ? 0 : -1}
                onClick={() => reveal(index)}>
                <span className="max-h-full rotate-180 overflow-hidden text-ellipsis [writing-mode:vertical-rl]">{pane.title}</span>
              </button>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
