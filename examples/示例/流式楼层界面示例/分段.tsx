import { useMemo, useState } from 'react';
import './分段.scss';
import Highlighter from './高亮';

type Props = {
  query: string;
  html: string;
};

type HtmlSegment = { key: number; html: string };

function splitHtmlByNewline(html: string): HtmlSegment[] {
  const segments: HtmlSegment[] = [];
  const lines = html.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]?.trim();
    if (!line) {
      continue;
    }
    segments.push({ key: index, html: line });
  }
  return segments;
}

export default function Segment({ query, html }: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const segments = useMemo(() => splitHtmlByNewline(html), [html]);

  const reveal = (key: number) => {
    setRevealed(old => {
      if (old.has(key)) {
        return old;
      }
      const next = new Set(old);
      next.add(key);
      return next;
    });
  };

  const isRevealed = (key: number) => revealed.has(key);

  return (
    <div className="StreamingMessage__segments">
      {segments.map(segment => (
        <div
          key={segment.key}
          className={`StreamingMessage__segment ${isRevealed(segment.key) ? '' : 'is-hidden'}`.trim()}
          onClick={event => {
            event.stopPropagation();
            reveal(segment.key);
          }}
        >
          <div className={`StreamingMessage__segmentContent ${isRevealed(segment.key) ? '' : 'is-blurred'}`.trim()}>
            <Highlighter query={query} html={segment.html} />
          </div>
          {!isRevealed(segment.key) ? <div className="StreamingMessage__segmentHint">点击显示</div> : null}
        </div>
      ))}
    </div>
  );
}
