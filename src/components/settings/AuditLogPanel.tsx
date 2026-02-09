import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/hooks';
import { Button } from '../ui/button';

interface AuditLogEntry {
  id: string;
  section: string;
  changeType: string;
  actorEmail: string;
  diff: Record<string, unknown> | null;
  createdAt: string;
}



export function AuditLogPanel() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [section, setSection] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (section !== 'all') {
        params.set('section', section);
      }
      params.set('limit', '100');
      const response = await fetch(`/api/settings/audit?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? body.message ?? 'Audit-Logs konnten nicht geladen werden.');
      }
      setEntries(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  const renderedEntries = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">{t('settings.audit.loading')}</p>;
    }
    if (entries.length === 0) {
      return <p className="text-sm text-muted-foreground">{t('settings.audit.empty')}</p>;
    }
    return (
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-border bg-background/60 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium text-foreground">
                {t(`settings.audit.sections.${entry.section}` as any) || entry.section}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t(`settings.audit.actions.${entry.changeType}` as any) || entry.changeType} durch {entry.actorEmail}
            </div>
            {entry.diff ? (
              <pre className="mt-2 max-h-48 overflow-auto rounded bg-card/80 p-3 text-xs text-muted-foreground">
                {JSON.stringify(entry.diff, null, 2)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }, [entries, loading]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="audit-section">{t('settings.audit.section')}</label>
          <select
            id="audit-section"
            value={section}
            onChange={(event) => setSection(event.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="all">{t('settings.audit.all')}</option>
            <option value="business_profile">{t('settings.audit.sections.business_profile')}</option>
            <option value="operational">{t('settings.audit.sections.operational')}</option>
            <option value="notifications">{t('settings.audit.sections.notifications')}</option>
            <option value="staff">{t('settings.audit.sections.staff')}</option>
          </select>
        </div>
        <Button size="sm" variant="outline" onClick={() => setRefreshToken((value) => value + 1)}>
          {t('settings.audit.refresh')}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {renderedEntries}
    </div>
  );
}
