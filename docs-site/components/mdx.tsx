import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import {
  isValidElement,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  hasNoteMetadata,
  NoteMetadata,
  type NoteMetadataValues,
} from '@/components/note-metadata';
import {
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';

type PageOptions = {
  pageTitle?: string;
  markdownUrl?: string;
  noteMetadata?: NoteMetadataValues;
};

function textContent(value: ReactNode): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (isValidElement<{ children?: ReactNode }>(value)) {
    return textContent(value.props.children);
  }
  return '';
}

export function getMDXComponents(
  components?: MDXComponents,
  pageOptions?: PageOptions,
): MDXComponents {
  const resolved: MDXComponents = {
    ...defaultMdxComponents,
    ...components,
  };

  const pageTitle = pageOptions?.pageTitle ?? '';
  const markdownUrl = pageOptions?.markdownUrl;
  const noteMetadata = pageOptions?.noteMetadata;
  const showPageActions = Boolean(markdownUrl);
  const showNoteMetadata =
    noteMetadata !== undefined && hasNoteMetadata(noteMetadata);
  if (!showPageActions && !showNoteMetadata) return resolved;

  const DefaultHeading = (resolved.h1 ?? 'h1') as ComponentType<
    ComponentProps<'h1'>
  >;
  const DefaultParagraph = (resolved.p ?? 'p') as ComponentType<
    ComponentProps<'p'>
  >;
  let pageHeadingSeen = false;
  let pageActionsInserted = false;
  let noteMetadataInserted = false;

  return {
    ...resolved,
    h1: (props) => {
      const matchesPageTitle = textContent(props.children).trim() === pageTitle;
      const isPageTitle = matchesPageTitle || !pageHeadingSeen;
      if (isPageTitle) {
        pageHeadingSeen = true;
        pageActionsInserted = false;
      }

      const insertMetadata =
        isPageTitle && showNoteMetadata && !noteMetadataInserted;
      if (insertMetadata) noteMetadataInserted = true;

      return (
        <>
          <DefaultHeading {...props} />
          {insertMetadata && noteMetadata && <NoteMetadata {...noteMetadata} />}
        </>
      );
    },
    p: (props) => {
      const insertActions =
        showPageActions && pageHeadingSeen && !pageActionsInserted;
      if (insertActions) pageActionsInserted = true;

      return (
        <>
          <DefaultParagraph {...props} />
          {insertActions && (
            <div className="not-prose flex flex-row items-center gap-2 border-b pt-2 pb-6">
              <MarkdownCopyButton markdownUrl={markdownUrl!} />
              <ViewOptionsPopover markdownUrl={markdownUrl!} />
            </div>
          )}
        </>
      );
    },
  };
}

export const useMDXComponents = getMDXComponents;
