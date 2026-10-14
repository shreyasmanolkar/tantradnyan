'use client';

import { useEffect, useId, useState } from 'react';

type MermaidProps = {
  chart: string;
};

type MermaidModule = typeof import('mermaid').default;

let mermaidPromise: Promise<MermaidModule> | undefined;

function loadMermaid(): Promise<MermaidModule> {
  mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'neutral',
    });

    return mermaid;
  });

  return mermaidPromise;
}

export function Mermaid({ chart }: MermaidProps) {
  const reactId = useId();
  const [svg, setSvg] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setSvg(undefined);
    setFailed(false);

    void loadMermaid()
      .then(async (mermaid) => {
        const parsed = await mermaid.parse(chart);
        if (!parsed) throw new Error('Invalid Mermaid diagram');

        return mermaid.render(
          `mermaid-${reactId.replaceAll(/[^a-zA-Z0-9_-]/g, '')}`,
          chart,
        );
      })
      .then(({ svg: renderedSvg }) => {
        if (active) setSvg(renderedSvg);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [chart, reactId]);

  return (
    <div className="not-prose my-6 overflow-x-auto rounded-xl border border-fd-border bg-fd-card p-4">
      {svg ? (
        <div
          role="img"
          aria-label="Mermaid diagram"
          className="[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div>
          {failed && (
            <p className="mb-3 text-sm text-fd-muted-foreground" role="alert">
              This Mermaid diagram could not be rendered. The source is shown below.
            </p>
          )}
          <pre className="overflow-x-auto rounded-lg bg-fd-muted p-4 text-sm">
            <code>{chart}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
