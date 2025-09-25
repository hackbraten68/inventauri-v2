/**
 * TypeScript declarations for i18n system
 * This file contains ambient module declarations that must be at the top level
 */

// TypeScript declaration merging for i18next resources
// Only apply when react-i18next is available
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      en: Record<string, string>;
      de: Record<string, string>;
    };
  }
}
