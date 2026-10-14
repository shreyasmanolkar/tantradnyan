import {
  CircleDashed,
  Hash,
  Link2,
  List,
  ListChecks,
  SquareCheck,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type NoteMetadataValues = {
  read_time?: number | string;
  source_type?: string;
  topics?: string[] | string;
  resource_link?: string;
  status?: string;
  consumed?: boolean;
};

function MetadataRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-8 grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)] items-center gap-x-4 max-sm:grid-cols-[7.5rem_minmax(0,1fr)]">
      <dt className="inline-flex items-center gap-2.5 text-sm text-fd-muted-foreground">
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {label}
      </dt>
      <dd className="m-0 min-w-0 text-sm text-fd-foreground">{children}</dd>
    </div>
  );
}

function safeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function hasNoteMetadata(metadata: NoteMetadataValues): boolean {
  const hasTopics = Array.isArray(metadata.topics)
    ? metadata.topics.length > 0
    : Boolean(metadata.topics?.trim());

  return (
    metadata.read_time !== undefined ||
    Boolean(metadata.source_type) ||
    hasTopics ||
    Boolean(metadata.resource_link) ||
    metadata.consumed !== undefined
  );
}

export function NoteMetadata({
  read_time: readTime,
  source_type: sourceType,
  topics,
  resource_link: resourceLink,
  status,
  consumed,
}: NoteMetadataValues) {
  const topicList = Array.isArray(topics)
    ? topics
    : topics?.split(',').map((topic) => topic.trim()).filter(Boolean) ?? [];

  if (
    readTime === undefined &&
    !sourceType &&
    topicList.length === 0 &&
    !resourceLink &&
    !status &&
    consumed === undefined
  ) {
    return null;
  }

  return (
    <section className="not-prose mb-6 mt-3 w-full rounded-xl border border-fd-border bg-fd-card/50 px-5 py-4">
      <dl className="m-0 flex flex-col gap-1.5">
        {readTime !== undefined && (
          <MetadataRow icon={Hash} label="Read Time">
            {readTime}
          </MetadataRow>
        )}
        {sourceType && (
          <MetadataRow icon={List} label="Source Type">
            <span className="inline-flex rounded bg-fd-secondary px-2 py-0.5 text-xs text-fd-secondary-foreground">
              {sourceType}
            </span>
          </MetadataRow>
        )}
        {topicList.length > 0 && (
          <MetadataRow icon={ListChecks} label="Topics">
            <span className="flex flex-wrap gap-1.5">
              {topicList.map((topic, index) => (
                <span
                  key={`${topic}-${index}`}
                  className={
                    index % 2 === 0
                      ? 'inline-flex rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'inline-flex rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                  }
                >
                  {topic}
                </span>
              ))}
            </span>
          </MetadataRow>
        )}
        {resourceLink && (
          <MetadataRow icon={Link2} label="Resource Link">
            {safeHttpUrl(resourceLink) ? (
              <a
                className="break-all text-blue-600 underline underline-offset-2 dark:text-blue-400"
                href={resourceLink}
                target="_blank"
                rel="noreferrer"
              >
                {resourceLink}
              </a>
            ) : (
              resourceLink
            )}
          </MetadataRow>
        )}
        {status && (
          <MetadataRow icon={CircleDashed} label="Status">
            <span className="inline-flex items-center gap-1.5 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
              {status}
            </span>
          </MetadataRow>
        )}
        {consumed !== undefined && (
          <MetadataRow icon={SquareCheck} label="Consumed">
            <input
              aria-label="Consumed"
              checked={consumed}
              className="size-4 accent-fd-primary"
              disabled
              type="checkbox"
            />
          </MetadataRow>
        )}
      </dl>
    </section>
  );
}
