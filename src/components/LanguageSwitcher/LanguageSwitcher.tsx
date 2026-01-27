import { useTranslation } from '../../hooks/useTranslation';
import { LOCALE_NAMES, type Locale } from '../../i18n/constants';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
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
    <div className={`flex items-center space-x-2 ${className}`}>
      {Object.entries(LOCALE_NAMES).map(([localeCode, localeName]) => (
        <button
          key={localeCode}
          onClick={() => handleLanguageChange(localeCode as Locale)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            locale === localeCode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {localeName}
        </button>
      ))}
    </div>
  );
}