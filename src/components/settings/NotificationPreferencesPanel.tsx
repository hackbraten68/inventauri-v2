import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface NotificationPreferenceState {
  id: string;
  category: string;
  channel: string;
  isEnabled: boolean;
  throttleMinutes: number | null;
  version: number;
  recipients: Array<{ id: string; userShopId: string | null; email: string | null }>;
}

interface RecipientDraft {
  email?: string;
  userShopId?: string;
}

export function NotificationPreferencesPanel() {
  const [preferences, setPreferences] = useState<NotificationPreferenceState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, RecipientDraft>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/settings/notifications');
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? body.message ?? 'Benachrichtigungen konnten nicht geladen werden.');
      }
      setPreferences(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePreference = useCallback(
    async (preference: NotificationPreferenceState, nextEnabled: boolean) => {
      try {
        setSavingId(preference.id);
        const response = await fetch('/api/settings/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([
            {
              id: preference.id,
              isEnabled: nextEnabled,
              throttleMinutes: preference.throttleMinutes,
              version: preference.version
            }
          ])
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? body.message ?? 'Aktualisierung fehlgeschlagen.');
        }
        setPreferences(body);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler beim Speichern.');
      } finally {
        setSavingId(null);
      }
    },
    []
  );

  const updateDraft = useCallback(
    (id: string, field: keyof RecipientDraft, value: string) => {
      setDrafts((current) => ({
        ...current,
        [id]: {
          ...current[id],
          [field]: value
        }
      }));
    },
    []
  );

  const addRecipient = useCallback(
    async (preference: NotificationPreferenceState) => {
      const draft = drafts[preference.id];
      if (!draft?.email && !draft?.userShopId) {
        setError('Bitte E-Mail oder Nutzer-ID angeben.');
        return;
      }
      try {
        setSavingId(preference.id);
        await fetch(`/api/settings/notifications/${preference.id}/recipients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: draft?.email ?? null,
            userShopId: draft?.userShopId ?? null
          })
        });
        await load();
        setDrafts((current) => ({ ...current, [preference.id]: {} }));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Empfänger konnte nicht hinzugefügt werden.');
      } finally {
        setSavingId(null);
      }
    },
    [drafts, load]
  );

  const removeRecipient = useCallback(
    async (preference: NotificationPreferenceState, recipientId: string) => {
      const recipient = preference.recipients.find((entry) => entry.id === recipientId);
      if (!recipient) return;
      try {
        setSavingId(preference.id);
        await fetch(`/api/settings/notifications/${preference.id}/recipients`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userShopId: recipient.userShopId,
            email: recipient.email
          })
        });
        await load();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Empfänger konnte nicht entfernt werden.');
      } finally {
        setSavingId(null);
      }
    },
    [load]
  );

  const content = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">Lade Benachrichtigungen …</p>;
    }
    if (preferences.length === 0) {
      return <p className="text-sm text-muted-foreground">Keine Benachrichtigungen konfiguriert.</p>;
    }
    return preferences.map((preference) => {
      const draft = drafts[preference.id] ?? {};
      return (
        <div key={preference.id} className="space-y-3 rounded-lg border border-border bg-background/60 p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {preference.category.replace(/_/g, ' ').toUpperCase()}
              </h3>
              <p className="text-xs text-muted-foreground">Kanal: {preference.channel}</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`toggle-${preference.id}`} className="text-sm">
                Aktiv
              </Label>
              <input
                id={`toggle-${preference.id}`}
                type="checkbox"
                className="h-4 w-4"
                checked={preference.isEnabled}
                disabled={savingId === preference.id}
                onChange={(event) => togglePreference(preference, event.target.checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Empfänger</p>
            <div className="flex flex-wrap gap-2">
              {preference.recipients.length === 0 ? (
                <span className="text-xs text-muted-foreground">Noch keine Empfänger zugeordnet.</span>
              ) : (
                preference.recipients.map((recipient) => (
                  <span
                    key={recipient.id}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                  >
                    {recipient.email ?? recipient.userShopId ?? 'Empfänger'}
                    <button
                      type="button"
                      className="text-xs text-destructive"
                      onClick={() => removeRecipient(preference, recipient.id)}
                      disabled={savingId === preference.id}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="E-Mail"
                value={draft.email ?? ''}
                onChange={(event) => updateDraft(preference.id, 'email', event.target.value)}
              />
              <Input
                placeholder="UserShop-ID"
                value={draft.userShopId ?? ''}
                onChange={(event) => updateDraft(preference.id, 'userShopId', event.target.value)}
              />
            </div>
            <Button type="button" onClick={() => addRecipient(preference)} disabled={savingId === preference.id}>
              Empfänger hinzufügen
            </Button>
          </div>
        </div>
      );
    });
  }, [addRecipient, drafts, loading, preferences, removeRecipient, savingId, togglePreference, updateDraft]);

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {content}
    </div>
  );
}
