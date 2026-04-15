import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

type Placement = 'top' | 'bottom';

type Props = {
  text: string;
};

const TOOLTIP_ARROW_LEFT_VAR = '--imggen-tooltip-arrow-left' as const;

function resolveTeleportTarget(trigger: HTMLElement | null): HTMLElement | null {
  if (!trigger) {
    return null;
  }

  return (
    trigger.closest('dialog[open]:not([closing])') ??
    trigger.closest('[role="dialog"]') ??
    trigger.closest('[data-imggen-host]') ??
    trigger.ownerDocument?.body ??
    null
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function HelpMarker({ text }: Props) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState<Placement>('top');
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [teleportTarget, setTeleportTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTeleportTarget(resolveTeleportTarget(triggerRef.current));
  }, []);

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    const hostWindow = trigger?.ownerDocument?.defaultView ?? null;
    if (!trigger || !tooltip || !hostWindow) {
      return;
    }

    const updateTooltipPosition = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 10;
      const fitsTop = triggerRect.top >= tooltipRect.height + gap + viewportPadding;
      const canFitBottom = triggerRect.bottom + tooltipRect.height + gap + viewportPadding <= hostWindow.innerHeight;
      const nextPlacement: Placement = fitsTop || !canFitBottom ? 'top' : 'bottom';
      const left = clamp(
        triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
        viewportPadding,
        Math.max(viewportPadding, hostWindow.innerWidth - tooltipRect.width - viewportPadding),
      );
      const preferredTop =
        nextPlacement === 'top' ? triggerRect.top - tooltipRect.height - gap : triggerRect.bottom + gap;
      const top = clamp(
        preferredTop,
        viewportPadding,
        Math.max(viewportPadding, hostWindow.innerHeight - tooltipRect.height - viewportPadding),
      );
      const arrowLeft = clamp(triggerRect.left + triggerRect.width / 2 - left, 12, tooltipRect.width - 12);

      setPlacement(nextPlacement);
      setTooltipStyle({
        top: `${top}px`,
        left: `${left}px`,
        [TOOLTIP_ARROW_LEFT_VAR]: `${arrowLeft}px`,
      });
      setTeleportTarget(resolveTeleportTarget(trigger));
    };

    updateTooltipPosition();
    hostWindow.addEventListener('resize', updateTooltipPosition, { passive: true });
    hostWindow.addEventListener('scroll', updateTooltipPosition, true);

    return () => {
      hostWindow.removeEventListener('resize', updateTooltipPosition);
      hostWindow.removeEventListener('scroll', updateTooltipPosition, true);
    };
  }, [visible]);

  return (
    <>
      <span
        ref={triggerRef}
        aria-label={text}
        className="imggen-help-marker"
        role="note"
        tabIndex={0}
        onBlur={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <i className="fa-solid fa-circle-question"></i>
      </span>

      {visible && teleportTarget
        ? createPortal(
            <span ref={tooltipRef} className={`imggen-help-tooltip is-${placement}`} style={tooltipStyle}>
              {text}
            </span>,
            teleportTarget,
          )
        : null}
    </>
  );
}
