import { cn } from '../../lib/utils';
import { I18nProviderWrapper } from '../providers/I18nProviderWrapper';
import { LoginForm } from './LoginForm';
import { LanguageSwitcher } from '../ui/language-switcher';
import { ThemeToggle } from '../ui/theme-toggle';

interface LoginInteractiveSectionProps {
  initialLanguage: string;
  redirectTo?: string;
  className?: string;
}

export function LoginInteractiveSection({
  initialLanguage,
  redirectTo = '/dashboard',
  className
}: LoginInteractiveSectionProps) {
  return (
    <I18nProviderWrapper initialLanguage={initialLanguage}>
      <div className={cn('space-y-8', className)}>
        <LoginForm redirectTo={redirectTo} />
        <div className="relative flex items-center justify-between sm:justify-center">
          <LanguageSwitcher currentLanguage={initialLanguage} variant="login" />
          <ThemeToggle className="sm:absolute sm:top-4 sm:right-4" disabled={false} />
        </div>
      </div>
    </I18nProviderWrapper>
  );
}
