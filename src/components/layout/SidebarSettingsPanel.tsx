import { SidebarSettings } from './SidebarSettings';
import { I18nProviderWrapper } from '../providers/I18nProviderWrapper';

interface SidebarSettingsPanelProps {
  initialLanguage: string;
}

export function SidebarSettingsPanel({ initialLanguage }: SidebarSettingsPanelProps) {
  return (
    <I18nProviderWrapper initialLanguage={initialLanguage}>
      <SidebarSettings currentLanguage={initialLanguage} />
    </I18nProviderWrapper>
  );
}
