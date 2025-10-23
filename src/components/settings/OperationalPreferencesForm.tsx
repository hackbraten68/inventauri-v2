import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import type { SelectHTMLAttributes } from 'react';

interface OperationalPreferenceState {
  currencyCode: string;
  timezone: string;
  unitSystem: 'metric' | 'imperial';
  defaultUnitPrecision: number;
  fiscalWeekStart: number;
  autoApplyTaxes: boolean;
  version: number;
}

const defaultState: OperationalPreferenceState = {
  currencyCode: 'EUR',
  timezone: 'Europe/Berlin',
  unitSystem: 'metric',
  defaultUnitPrecision: 2,
  fiscalWeekStart: 1,
  autoApplyTaxes: false,
  version: 0
};

const weekDayOptions = [
  { value: 1, label: 'Montag' },
  { value: 0, label: 'Sonntag' },
  { value: 2, label: 'Dienstag' },
  { value: 3, label: 'Mittwoch' },
  { value: 4, label: 'Donnerstag' },
  { value: 5, label: 'Freitag' },
  { value: 6, label: 'Samstag' }
];

export function OperationalPreferencesForm() {
  const [state, setState] = useState(defaultState);
  const [baseline, setBaseline] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(baseline), [state, baseline]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/settings/operational');
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? body.message ?? 'Einstellungen konnten nicht geladen werden.');
        }
        if (active) {
          setState(body);
          setBaseline(body);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const onChange = useCallback(
    (key: keyof OperationalPreferenceState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.type === 'checkbox'
        ? (event.target as HTMLInputElement).checked
        : event.target.value;

      setState((current) => ({
        ...current,
        [key]:
          key === 'defaultUnitPrecision' ? Number(value) : key === 'fiscalWeekStart' ? Number(value) : (value as any)
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch('/api/settings/operational', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? body.message ?? 'Speichern fehlgeschlagen.');
        }
        setState(body);
        setBaseline(body);
        setSuccess('Betriebliche Vorgaben aktualisiert.');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unbekannter Fehler beim Speichern.');
      } finally {
        setSaving(false);
      }
    },
    [state]
  );

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <fieldset className="space-y-4" disabled={loading || saving}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Standardwährung" id="currency" value={state.currencyCode} onChange={onChange('currencyCode')} />
          <FormField label="Zeitzone" id="timezone" value={state.timezone} onChange={onChange('timezone')} />
          <SelectField
            label="Einheitensystem"
            id="unitSystem"
            value={state.unitSystem}
            onChange={onChange('unitSystem')}
            options={[
              { value: 'metric', label: 'Metrisch (kg, m, °C)' },
              { value: 'imperial', label: 'Imperial (lb, ft, °F)' }
            ]}
          />
          <FormField
            label="Standard Genauigkeit"
            id="precision"
            type="number"
            min={0}
            max={4}
            value={state.defaultUnitPrecision.toString()}
            onChange={onChange('defaultUnitPrecision')}
          />
          <SelectField
            label="Wochenbeginn"
            id="weekStart"
            value={state.fiscalWeekStart.toString()}
            onChange={onChange('fiscalWeekStart')}
            options={weekDayOptions.map((option) => ({ value: option.value.toString(), label: option.label }))}
          />
          <div className="flex items-center gap-2">
            <input
              id="autoTaxes"
              type="checkbox"
              className="h-4 w-4"
              checked={state.autoApplyTaxes}
              onChange={onChange('autoApplyTaxes')}
            />
            <Label htmlFor="autoTaxes">Steuern automatisch anwenden</Label>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm">
          {error ? <p className="text-destructive">{error}</p> : null}
          {success && !error ? <p className="text-emerald-600">{success}</p> : null}
          {isDirty ? <p className="text-muted-foreground">Ungespeicherte Änderungen vorhanden.</p> : null}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || saving}
            onClick={() => {
              setState(baseline);
              setError(null);
              setSuccess(null);
            }}
          >
            Änderungen verwerfen
          </Button>
          <Button type="submit" disabled={!isDirty || saving}>
            {saving ? 'Speichert …' : 'Speichern'}
          </Button>
        </div>
      </div>
    </form>
  );
}

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function FormField({ label, id, className, ...rest }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className={className} {...rest} />
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
}

function SelectField({ label, id, options, className, ...rest }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className={`rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className ?? ''}`}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
