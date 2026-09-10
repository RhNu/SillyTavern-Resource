import type { ReactNode } from 'react';

type CollapsibleSectionProps = {
  title: ReactNode;
  hint?: ReactNode;
  contentId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  children: ReactNode;
};

/** Keep every expandable settings group on the same native details/summary interaction. */
export default function CollapsibleSection(props: CollapsibleSectionProps) {
  return (
    <details
      className={['nai-settings__collapsible', props.className].filter(Boolean).join(' ')}
      open={props.open}
      onToggle={event => props.onOpenChange(event.currentTarget.open)}
    >
      <summary className="nai-settings__collapsible-bar" aria-controls={props.contentId} aria-expanded={props.open}>
        <span className="nai-settings__collapsible-copy">
          <span className="nai-settings__collapsible-title">{props.title}</span>
          {props.hint && <span className="nai-settings__collapsible-hint">{props.hint}</span>}
        </span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </summary>
      <div id={props.contentId} className="nai-settings__collapsible-body">
        {props.children}
      </div>
    </details>
  );
}
