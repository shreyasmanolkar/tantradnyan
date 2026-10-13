import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import {
  isValidElement,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';

type PageActions = {
  pageTitle: string;
  markdownUrl: string;
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
  pageActions?: PageActions,
): MDXComponents {
  const resolved: MDXComponents = {
    ...defaultMdxComponents,
    ...components,
  };

  if (!pageActions) return resolved;

  const DefaultHeading = (resolved.h1 ?? 'h1') as ComponentType<
    ComponentProps<'h1'>
  >;
  const DefaultParagraph = (resolved.p ?? 'p') as ComponentType<
    ComponentProps<'p'>
  >;
  let pageHeadingSeen = false;
  let pageActionsInserted = false;

  return {
    ...resolved,
    h1: (props) => {
      if (textContent(props.children).trim() === pageActions.pageTitle) {
        pageHeadingSeen = true;
        pageActionsInserted = false;
      }

      return <DefaultHeading {...props} />;
    },
    p: (props) => {
      const insertActions = pageHeadingSeen && !pageActionsInserted;
      if (insertActions) pageActionsInserted = true;

      return (
        <>
          <DefaultParagraph {...props} />
          {insertActions && (
            <div className="not-prose flex flex-row items-center gap-2 border-b pt-2 pb-6">
              <MarkdownCopyButton markdownUrl={pageActions.markdownUrl} />
              <ViewOptionsPopover markdownUrl={pageActions.markdownUrl} />
            </div>
          )}
        </>
      );
    },
  };
}

export const useMDXComponents = getMDXComponents;
