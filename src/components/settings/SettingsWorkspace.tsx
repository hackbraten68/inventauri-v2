import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { BusinessProfileForm } from './BusinessProfileForm';
import { OperationalPreferencesForm } from './OperationalPreferencesForm';
import { NotificationPreferencesPanel } from './NotificationPreferencesPanel';
import { StaffManagementPanel } from './StaffManagementPanel';
import { AuditLogPanel } from './AuditLogPanel';

interface TabConfig {
  id: string;
  label: string;
  caption: string;
  heading: string;
  description: string;
  render: () => ReactNode;
}

const tabs: TabConfig[] = [
  {
    id: 'business-profile',
    label: 'Geschäftsprofil',
    caption: 'Firmendaten & Kontakte',
    heading: 'Geschäftsprofil',
    description: 'Verwalte Stammdaten, Kontakte und Dokumentenangaben für dein Unternehmen.',
    render: () => <BusinessProfileForm />
  },
  {
    id: 'operational-preferences',
    label: 'Betriebliche Vorgaben',
    caption: 'Währung, Zeitzone, Einheiten',
    heading: 'Betriebliche Einstellungen',
    description: 'Definiere Standardwerte für Preise, Zeitzonen und Maßeinheiten, damit Berichte konsistent bleiben.',
    render: () => <OperationalPreferencesForm />
  },
  {
    id: 'notifications',
    label: 'Benachrichtigungen',
    caption: 'Alerts & Empfänger',
    heading: 'Benachrichtigungen & Empfänger',
    description: 'Steuere, welche Warnungen aktiv sind und wer sie erhält.',
    render: () => <NotificationPreferencesPanel />
  },
  {
    id: 'staff-access',
    label: 'Team & Zugriff',
    caption: 'Einladungen & Rollen',
    heading: 'Teamverwaltung & Zugriffsrechte',
    description: 'Verwalte Einladungen, Rollen und Deaktivierungen für dein Team.',
    render: () => <StaffManagementPanel />
  },
  {
    id: 'audit-log',
    label: 'Protokolle',
    caption: 'Änderungsverlauf',
    heading: 'Audit Log',
    description: 'Überwache Änderungen an Einstellungen für volle Nachvollziehbarkeit.',
    render: () => <AuditLogPanel />
  }
];

export function SettingsWorkspace() {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? 'business-profile');
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                'flex h-full flex-col rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card/60 text-foreground hover:border-primary/40 hover:bg-card/80'
              )}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
            >
              <span className="text-sm font-medium">{tab.label}</span>
              <span
                className={cn(
                  'text-xs',
                  isActive ? 'text-primary/80' : 'text-muted-foreground'
                )}
              >
                {tab.caption}
              </span>
            </button>
          );
        })}
      </div>

      <section
        key={active.id}
        className="rounded-lg border border-border bg-card/40 p-6 shadow-sm"
        aria-live="polite"
      >
        <h2 className="text-xl font-semibold text-foreground">{active.heading}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{active.description}</p>
        <div
          className={cn(
            'mt-4 rounded-md border border-dashed border-border p-4',
            active.id === 'business-profile'
              ? 'bg-background text-foreground'
              : 'bg-background/60 text-sm text-muted-foreground'
          )}
        >
          {active.render()}
        </div>
      </section>
    </div>
  );
}
