import { ThemeToggle } from '../ui/theme-toggle';
import { Button } from '../ui/button';
import { LogoutButton } from '../auth/LogoutButton';
import { LanguageSwitcher } from '../ui/language-switcher';
import { useOptionalI18n } from '../../i18n/react-integration';

interface SidebarSettingsProps {
  currentLanguage?: string;
}

export function SidebarSettings({ currentLanguage }: SidebarSettingsProps) {
  const i18n = useOptionalI18n();
  const language = i18n?.language ?? currentLanguage ?? 'de';

  return (
    <div className="space-y-4">
      <ThemeToggle />

      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="px-2">
          <LanguageSwitcher
            currentLanguage={language}
            variant="sidebar"
          />
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
          Profile settings (coming soon)
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
          Admin area (coming soon)
        </Button>
      </div>

      <LogoutButton />
    </div>
  );
}
