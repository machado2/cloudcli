import { CircleCheck, CircleHelp, Loader2 } from 'lucide-react';
import type { TFunction } from 'i18next';

import { Tooltip } from '../../../../shared/view/ui';
import type { SessionActivity } from '../../../../hooks/useSessionProtection';

type SessionStatus = 'waiting' | 'working' | 'done' | 'idle';

/**
 * Derives a single, user-facing status for a session row from the raw activity
 * signals available in the sidebar:
 * - `waiting`: the run parked on a pending tool-approval prompt.
 * - `working`: the run is actively processing.
 * - `done`: not processing, but active within the recent-activity window
 *   (i.e. it just finished).
 * - `idle`: nothing notable to show.
 */
function deriveSessionStatus(
  activity: SessionActivity | null | undefined,
  isRecentlyActive: boolean,
): SessionStatus {
  if (activity?.waitingForInput) {
    return 'waiting';
  }
  if (activity) {
    return 'working';
  }
  if (isRecentlyActive) {
    return 'done';
  }
  return 'idle';
}

type SessionStatusIndicatorProps = {
  activity: SessionActivity | null | undefined;
  isRecentlyActive: boolean;
  t: TFunction;
  className?: string;
};

/**
 * Compact status glyph shown next to a conversation row. Renders nothing for
 * idle sessions so quiet rows stay clean.
 */
export default function SessionStatusIndicator({
  activity,
  isRecentlyActive,
  t,
  className = 'h-3.5 w-3.5',
}: SessionStatusIndicatorProps) {
  const status = deriveSessionStatus(activity, isRecentlyActive);

  if (status === 'idle') {
    return null;
  }

  if (status === 'waiting') {
    const label = t('tooltips.waitingForInputIndicator', 'Waiting for your input');
    return (
      <Tooltip content={activity?.statusText || label} position="top">
        <span role="status" aria-label={label} className="flex flex-shrink-0 items-center justify-center">
          <CircleHelp className={`${className} animate-pulse text-amber-500`} />
        </span>
      </Tooltip>
    );
  }

  if (status === 'working') {
    const label = t('tooltips.processingSessionIndicator', 'Processing session');
    return (
      <Tooltip content={activity?.statusText || label} position="top">
        <span role="status" aria-label={label} className="flex flex-shrink-0 items-center justify-center text-muted-foreground">
          <Loader2 className={`${className} animate-spin`} />
        </span>
      </Tooltip>
    );
  }

  const label = t('tooltips.completedSessionIndicator', 'Recently completed');
  return (
    <Tooltip content={label} position="top">
      <span role="status" aria-label={label} className="flex flex-shrink-0 items-center justify-center">
        <CircleCheck className={`${className} text-green-500`} />
      </span>
    </Tooltip>
  );
}
