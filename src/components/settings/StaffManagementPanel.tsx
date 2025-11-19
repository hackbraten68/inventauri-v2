import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

interface StaffMember {
  userShopId: string;
  userId: string;
  email: string;
  role: string;
  status: string;
  deactivatedAt?: string | null;
}

const roles = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Mitarbeiter' }
];

interface InvitationDraft {
  email: string;
  role: string;
}

const defaultInvitation: InvitationDraft = {
  email: '',
  role: 'manager'
};

export function StaffManagementPanel() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitation, setInvitation] = useState(defaultInvitation);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/settings/staff');
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? body.message ?? 'Team konnte nicht geladen werden.');
      }
      setStaff(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onInviteChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setInvitation((current) => ({ ...current, [name]: value }));
  }, []);

  const submitInvitation = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        setSavingId('invite');
        const response = await fetch('/api/settings/staff/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invitation)
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? body.message ?? 'Einladung fehlgeschlagen.');
        }
        setSuccess('Einladung versendet.');
        setInvitation(defaultInvitation);
        await load();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler bei Einladung.');
      } finally {
        setSavingId(null);
      }
    },
    [invitation, load]
  );

  const updateStaff = useCallback(
    async (member: StaffMember, updates: Partial<Pick<StaffMember, 'role' | 'status'>>) => {
      try {
        setSavingId(member.userShopId);
        const response = await fetch(`/api/settings/staff/${member.userShopId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? body.message ?? 'Aktualisierung fehlgeschlagen.');
        }
        await load();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler beim Aktualisieren.');
      } finally {
        setSavingId(null);
      }
    },
    [load]
  );

  const roster = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">Lade Team …</p>;
    }
    if (staff.length === 0) {
      return <p className="text-sm text-muted-foreground">Noch keine Teammitglieder verfügbar.</p>;
    }
    return (
      <div className="space-y-3">
        {staff.map((member) => (
          <div key={member.userShopId} className="grid gap-2 rounded-lg border border-border bg-background/60 p-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-foreground">{member.email}</p>
              <p className="text-xs text-muted-foreground">Status: {member.status}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SelectControl
                label="Rolle"
                value={member.role}
                onChange={(event) => updateStaff(member, { role: event.target.value })}
                disabled={savingId === member.userShopId}
              />
              <Button
                type="button"
                variant={member.status === 'deactivated' ? 'secondary' : 'destructive'}
                size="sm"
                disabled={savingId === member.userShopId}
                onClick={() =>
                  updateStaff(member, { status: member.status === 'deactivated' ? 'active' : 'deactivated' })
                }
              >
                {member.status === 'deactivated' ? 'Reaktivieren' : 'Deaktivieren'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }, [loading, staff, savingId, updateStaff]);

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <form className="space-y-4 rounded-lg border border-border bg-background/60 p-4" onSubmit={submitInvitation}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="invite-email">E-Mail</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              value={invitation.email}
              onChange={onInviteChange}
            />
          </div>
          <div>
            <Label htmlFor="invite-role">Rolle</Label>
            <select
              id="invite-role"
              name="role"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={invitation.role}
              onChange={onInviteChange}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={savingId === 'invite'}>
            Einladung senden
          </Button>
        </div>
      </form>

      {roster}
    </div>
  );
}

interface SelectControlProps {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

function SelectControl({ label, value, disabled, onChange }: SelectControlProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{label}</span>
      <select
        className="rounded-md border border-input bg-background px-2 py-1"
        value={value}
        disabled={disabled}
        onChange={onChange}
      >
        {roles.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
    </label>
  );
}
