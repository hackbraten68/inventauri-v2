import { ThemeToggle } from '../ui/theme-toggle';
import { Button } from '../ui/button';
import { LogoutButton } from '../auth/LogoutButton';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Settings, LogOut, User, Palette } from 'lucide-react';
import { useTranslation } from '../../i18n/hooks';
import { LocaleProvider } from '../../i18n/context';
import type { Locale } from '../../i18n/constants';

interface SidebarSettingsProps {
  locale: Locale;
}

export function SidebarSettings({ locale }: SidebarSettingsProps) {
  return (
    <LocaleProvider locale={locale}>
      <SidebarSettingsContent locale={locale} />
    </LocaleProvider>
  );
}

function SidebarSettingsContent({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-3 px-2 h-12">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User size={16} />
            </div>
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-medium leading-none">Demo Benutzer</span>
              <span className="text-xs text-muted-foreground truncate w-full">demo@inventauri.app</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="right" align="end" sideOffset={12}>
          <DropdownMenuLabel>{t('layout.myAccount')}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href={`/${locale}/settings`} className="flex w-full items-center gap-2 cursor-pointer">
              <Settings size={14} />
              <span>{t('navigation.settings')}</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem disabled className="gap-2">
            <User size={14} />
            <span>{t('layout.profile')} (coming soon)</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-1.5 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Palette size={14} />
              <span>{t('layout.appearance')}</span>
            </div>
            <ThemeToggle variant="button" className="h-7 w-7" />
          </div>

          <DropdownMenuSeparator />

          <LogoutButton variant="dropdown-item" />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

}
