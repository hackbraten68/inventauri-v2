import { ThemeToggle } from '../ui/theme-toggle';
import { Button } from '../ui/button';
import { LogoutButton } from '../auth/LogoutButton';

export function SidebarSettings() {
  return (
    <div className="space-y-4">
      <ThemeToggle />

      <div className="space-y-2 text-xs text-muted-foreground">
        <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
          Language (coming soon)
        </Button>
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
