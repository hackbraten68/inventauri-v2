import { useState, type ReactNode, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../i18n/hooks';
import { LocaleProvider } from '../../i18n/context';
import type { Locale } from '../../i18n/constants';
import { BusinessProfileForm } from './BusinessProfileForm';
import { OperationalPreferencesForm } from './OperationalPreferencesForm';
import { NotificationPreferencesPanel } from './NotificationPreferencesPanel';
import { StaffManagementPanel } from './StaffManagementPanel';
import { AuditLogPanel } from './AuditLogPanel';
import { WarehouseManagementPanel } from './WarehouseManagementPanel';

interface TabConfig {
  id: string;
  label: string;
  caption: string;
  heading: string;
  description: string;
  render: () => ReactNode;
}

// Tabs configuration moved inside component to access translation


interface SettingsWorkspaceProps {
  locale: Locale;
}

export function SettingsWorkspace({ locale }: SettingsWorkspaceProps) {
  return (
    <LocaleProvider locale={locale}>
      <SettingsWorkspaceContent />
    </LocaleProvider>
  );
}

function SettingsWorkspaceContent() {
  const { t } = useTranslation();

  const tabs: TabConfig[] = useMemo(() => [
    {
      id: 'business-profile',
      label: t('settings.tabs.businessProfile.label'),
      caption: t('settings.tabs.businessProfile.caption'),
      heading: t('settings.tabs.businessProfile.heading'),
      description: t('settings.tabs.businessProfile.description'),
      render: () => <BusinessProfileForm />
    },
    {
      id: 'operational-preferences',
      label: t('settings.tabs.operationalPreferences.label'),
      caption: t('settings.tabs.operationalPreferences.caption'),
      heading: t('settings.tabs.operationalPreferences.heading'),
      description: t('settings.tabs.operationalPreferences.description'),
      render: () => <OperationalPreferencesForm />
    },
    {
      id: 'notifications',
      label: t('settings.tabs.notifications.label'),
      caption: t('settings.tabs.notifications.caption'),
      heading: t('settings.tabs.notifications.heading'),
      description: t('settings.tabs.notifications.description'),
      render: () => <NotificationPreferencesPanel />
    },
    {
      id: 'staff-access',
      label: t('settings.tabs.staffAccess.label'),
      caption: t('settings.tabs.staffAccess.caption'),
      heading: t('settings.tabs.staffAccess.heading'),
      description: t('settings.tabs.staffAccess.description'),
      render: () => <StaffManagementPanel />
    },
    {
      id: 'audit-log',
      label: t('settings.tabs.auditLog.label'),
      caption: t('settings.tabs.auditLog.caption'),
      heading: t('settings.tabs.auditLog.heading'),
      description: t('settings.tabs.auditLog.description'),
      render: () => <AuditLogPanel />
    },
    {
      id: 'locations',
      label: t('settings.tabs.locations.label'),
      caption: t('settings.tabs.locations.caption'),
      heading: t('settings.tabs.locations.heading'),
      description: t('settings.tabs.locations.description'),
      render: () => <WarehouseManagementPanel />
    }
  ], [t]);

  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ?? 'business-profile');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabId = params.get('tab');
    if (tabId && tabs.some(t => t.id === tabId)) {
      setActiveTab(tabId);
    }
  }, []);

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
