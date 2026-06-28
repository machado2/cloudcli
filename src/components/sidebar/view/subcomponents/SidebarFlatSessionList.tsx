import { Folder, Trash2 } from 'lucide-react';

import { cn } from '../../../../lib/utils';
import type { Project } from '../../../../types/app';
import { Button } from '../../../../shared/view/ui';
import { createSessionViewModel, getSessionDate } from '../../utils/utils';
import type { SessionWithProvider } from '../../types/types';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';

import type { SidebarProjectListProps } from './SidebarProjectList';
import SessionStatusIndicator from './SessionStatusIndicator';
import SidebarProjectsState from './SidebarProjectsState';

type FlatRow = {
  project: Project;
  session: SessionWithProvider;
};

/**
 * Compact relative time for flat rows: <1m, Xm, Xhr, Xd.
 */
const formatCompactSessionAge = (date: Date, currentTime: Date): string => {
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffInMinutes = Math.floor(Math.max(0, currentTime.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) {
    return '<1m';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}hr`;
  }

  return `${Math.floor(diffInHours / 24)}d`;
};

/**
 * Ungrouped sidebar view: every conversation across all (filtered) projects on
 * its own row, newest first, with the owning project shown as a muted label.
 */
export default function SidebarFlatSessionList({
  projects,
  filteredProjects,
  selectedSession,
  isLoading,
  loadingProgress,
  currentTime,
  getProjectSessions,
  activeSessions,
  onProjectSelect,
  onSessionSelect,
  onDeleteSession,
  t,
}: SidebarProjectListProps) {
  const showProjects = !isLoading && projects.length > 0 && filteredProjects.length > 0;

  if (!showProjects) {
    return (
      <div className="pb-safe-area-inset-bottom md:space-y-1">
        <SidebarProjectsState
          isLoading={isLoading}
          loadingProgress={loadingProgress}
          projectsCount={projects.length}
          filteredProjectsCount={filteredProjects.length}
          t={t}
        />
      </div>
    );
  }

  const rows: FlatRow[] = filteredProjects
    .flatMap((project) => getProjectSessions(project).map((session) => ({ project, session })))
    .sort((a, b) => getSessionDate(b.session).getTime() - getSessionDate(a.session).getTime());

  if (rows.length === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <p className="text-xs text-muted-foreground">{t('sessions.noSessions')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 px-1.5 py-1 pb-safe-area-inset-bottom">
      {rows.map(({ project, session }) => {
        const sessionView = createSessionViewModel(session, currentTime, t);
        const activity = activeSessions.get(session.id) ?? null;
        const isProcessing = activeSessions.has(session.id);
        const isSelected = selectedSession?.id === session.id;
        const compactAge = formatCompactSessionAge(getSessionDate(session), currentTime);
        const openSession = () => {
          onProjectSelect(project);
          onSessionSelect(session, project.projectId);
        };

        return (
          <div key={session.id} className="group relative">
            <Button
              variant="ghost"
              className={cn(
                'h-auto w-full justify-start rounded-md border p-2 text-left font-normal transition-all duration-150',
                isSelected
                  ? 'border-primary/20 bg-primary/5'
                  : isProcessing
                    ? 'border-border/60 bg-muted/20 hover:bg-muted/25'
                    : sessionView.isActive
                      ? 'border-green-500/30 bg-green-50/5 hover:bg-green-50/10 dark:bg-green-900/5 dark:hover:bg-green-900/10'
                      : 'border-transparent hover:bg-accent/50',
              )}
              onClick={openSession}
            >
              <div className="flex w-full min-w-0 items-center gap-2">
                <div
                  className={cn(
                    'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md',
                    isSelected ? 'bg-primary/10' : 'bg-muted/50',
                  )}
                >
                  <SessionProviderLogo provider={session.__provider} className="h-3 w-3" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-foreground">{sessionView.sessionName}</div>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Folder className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground/60" />
                    <span className="truncate text-[10px] text-muted-foreground/70">
                      {project.displayName || project.projectId}
                    </span>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <SessionStatusIndicator
                    activity={activity}
                    isRecentlyActive={!isProcessing && sessionView.isActive}
                    t={t}
                    className="h-3 w-3"
                  />
                  {compactAge && (
                    <span className="text-[11px] text-muted-foreground group-hover:opacity-0">{compactAge}</span>
                  )}
                </div>
              </div>
            </Button>

            {!isProcessing && (
              <button
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded bg-red-50 opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteSession(project.projectId, session.id, sessionView.sessionName, session.__provider);
                }}
                title={t('tooltips.deleteSessionOptions', 'Archive or permanently delete this session')}
              >
                <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
