import {
  BookOpen,
  CalendarDays,
  CircleAlert,
  CircleDashed,
  Hash,
  Link2,
  List,
  ListChecks,
  SquareCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

type MetadataListValue = string[] | string;

export type NoteMetadataValues = {
  description?: string;
  read_time?: number | string;
  source_type?: string;
  topics?: string[] | string;
  resource_link?: string;
  status?: string;
  consumed?: boolean;
  topic?: string;
  audience?: string;
  prerequisites?: MetadataListValue;
  last_reviewed?: string;
  technical_scope_as_of?: string;
  asd_ste_reference?: string;
  reviewer?: string;
  review_date?: string;
  open_issues?: MetadataListValue;
  release_scope?: string;
};

function MetadataList({ value }: { value: MetadataListValue }) {
  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0) return <>None</>;
  if (values.length === 1) return <>{values[0]}</>;

  return (
    <ul className="my-0 list-disc space-y-1 pl-4">
      {values.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
    </ul>
  );
}

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
    <div className="grid min-h-10 grid-cols-[12rem_minmax(0,1fr)] items-center gap-x-2 max-sm:grid-cols-[8rem_minmax(0,1fr)]">
      <dt className="inline-flex min-w-0 items-center gap-2.5 text-sm text-fd-muted-foreground">
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
    Boolean(metadata.description) ||
    metadata.read_time !== undefined ||
    Boolean(metadata.source_type) ||
    hasTopics ||
    Boolean(metadata.resource_link) ||
    Boolean(metadata.status) ||
    metadata.consumed !== undefined ||
    Boolean(metadata.topic) ||
    Boolean(metadata.audience) ||
    Boolean(metadata.prerequisites) ||
    Boolean(metadata.last_reviewed) ||
    Boolean(metadata.technical_scope_as_of) ||
    Boolean(metadata.asd_ste_reference) ||
    Boolean(metadata.reviewer) ||
    Boolean(metadata.review_date) ||
    metadata.open_issues !== undefined ||
    Boolean(metadata.release_scope)
  );
}

export function NoteMetadata({
  description,
  read_time: readTime,
  source_type: sourceType,
  topics,
  resource_link: resourceLink,
  status,
  consumed,
  topic,
  audience,
  prerequisites,
  last_reviewed: lastReviewed,
  technical_scope_as_of: technicalScopeAsOf,
  asd_ste_reference: asdSteReference,
  reviewer,
  review_date: reviewDate,
  open_issues: openIssues,
  release_scope: releaseScope,
}: NoteMetadataValues) {
  const topicList = Array.isArray(topics)
    ? topics
    : topics?.split(',').map((topic) => topic.trim()).filter(Boolean) ?? [];

  if (
    !description &&
    readTime === undefined &&
    !sourceType &&
    topicList.length === 0 &&
    !resourceLink &&
    !status &&
    consumed === undefined &&
    !topic &&
    !audience &&
    !prerequisites &&
    !lastReviewed &&
    !technicalScopeAsOf &&
    !asdSteReference &&
    !reviewer &&
    !reviewDate &&
    openIssues === undefined &&
    !releaseScope
  ) {
    return null;
  }

  return (
    <section className="not-prose mb-6 mt-3 w-full border-b border-fd-border px-8 pb-4 pt-3 max-sm:px-2">
      <dl className="m-0 flex flex-col">
        {description && (
          <MetadataRow icon={BookOpen} label="Description">
            {description}
          </MetadataRow>
        )}
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
        {topic && (
          <MetadataRow icon={List} label="Topic">{topic}</MetadataRow>
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
            <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs ${
              status.trim().toLowerCase() === 'ready'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              <span
                className={`size-2 rounded-full ${
                  status.trim().toLowerCase() === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                aria-hidden="true"
              />
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
        {audience && (
          <MetadataRow icon={Users} label="Audience">{audience}</MetadataRow>
        )}
        {prerequisites && (
          <MetadataRow icon={ListChecks} label="Prerequisites">
            <MetadataList value={prerequisites} />
          </MetadataRow>
        )}
        {lastReviewed && (
          <MetadataRow icon={CalendarDays} label="Last Reviewed">{lastReviewed}</MetadataRow>
        )}
        {technicalScopeAsOf && (
          <MetadataRow icon={BookOpen} label="Technical Scope">{technicalScopeAsOf}</MetadataRow>
        )}
        {asdSteReference && (
          <MetadataRow icon={BookOpen} label="ASD-STE Reference">{asdSteReference}</MetadataRow>
        )}
        {reviewer && (
          <MetadataRow icon={UserRound} label="Reviewer">{reviewer}</MetadataRow>
        )}
        {reviewDate && (
          <MetadataRow icon={CalendarDays} label="Review Date">{reviewDate}</MetadataRow>
        )}
        {openIssues !== undefined && (
          <MetadataRow icon={CircleAlert} label="Open Issues">
            <MetadataList value={openIssues} />
          </MetadataRow>
        )}
        {releaseScope && (
          <MetadataRow icon={BookOpen} label="Release Scope">{releaseScope}</MetadataRow>
        )}
      </dl>
    </section>
  );
}
