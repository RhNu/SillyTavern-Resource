import type { ReactNode } from 'react';
import './高亮.scss';

type Props = {
  query: string;
  html?: string;
  children?: ReactNode;
};

function escapeRegExp(source: string) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightHtml(html: string, query: string) {
  if (!query.trim()) {
    return html;
  }

  const pattern = new RegExp(escapeRegExp(query.trim()), 'gi');
  return html.replace(pattern, matched => `<mark class="StreamingMessage--mark">${matched}</mark>`);
}

export default function Highlighter({ query, html, children }: Props) {
  if (html !== undefined) {
    return <span dangerouslySetInnerHTML={{ __html: highlightHtml(html, query) }}></span>;
  }

  return <>{children}</>;
}
