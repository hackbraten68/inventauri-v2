import { ThemeToggle } from '../ui/theme-toggle';
import { Button } from '../ui/button';
import { LogoutButton } from '../auth/LogoutButton';

export function SidebarSettings() {
  return (
    <div className="space-y-4">
      <ThemeToggle />

      <div className="space-y-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start text-left items-start"
        >
          <a href="/settings" className="flex w-full flex-col gap-0.5 text-left">
            <span className="text-sm font-medium">Admin Einstellungen</span>
            <span className="text-xs text-muted-foreground">
              Profil, Betrieb &amp; Zugriffsrechte verwalten
            </span>
          </a>
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-left" disabled>
          Sprache (bald verfügbar)
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-left" disabled>
          Persönliches Profil (bald verfügbar)
        </Button>
      </div>

      <LogoutButton />
    </div>
  );
}
