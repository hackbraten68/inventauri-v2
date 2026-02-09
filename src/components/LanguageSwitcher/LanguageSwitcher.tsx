import { Languages } from 'lucide-react';
import { useTranslation } from '../../i18n/hooks';
import { LOCALE_NAMES, type Locale } from '../../i18n/constants';
import { LocaleProvider } from '../../i18n/context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

interface LanguageSwitcherProps {
  className?: string;
  locale: Locale;
}

export function LanguageSwitcher({ className = '', locale }: LanguageSwitcherProps) {
  return (
    <LocaleProvider locale={locale}>
      <LanguageSwitcherContent className={className} />
    </LocaleProvider>
  );
}

function LanguageSwitcherContent({ className }: { className: string }) {
  const { locale } = useTranslation();

  const handleLanguageChange = (newLocale: Locale) => {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    // Remove current locale from path and add new one
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}/, '');
    const newPath = `/${newLocale}${pathWithoutLocale}${currentSearch}`;

    window.location.href = newPath;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(LOCALE_NAMES).map(([localeCode, localeName]) => (
          <DropdownMenuItem
            key={localeCode}
            onClick={() => handleLanguageChange(localeCode as Locale)}
            className={locale === localeCode ? 'bg-accent' : ''}
          >
            {localeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}