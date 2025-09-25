# Data Model: Language Support (Internationalization)

## Overview
This document defines the data structures and relationships needed for internationalization support in the Inventauri application. The design focuses on simplicity, extensibility, and performance.

## Core Entities

### Language
**Purpose**: Represents a supported language configuration

**Attributes**:
- `code`: string (ISO 639-1 language code, e.g., "en", "de")
- `name`: string (Display name, e.g., "English", "Deutsch")
- `nativeName`: string (Native language name, e.g., "English", "Deutsch")
- `flagIcon`: string (Lucide icon name or custom flag representation)
- `isDefault`: boolean (Whether this is the fallback language)
- `isActive`: boolean (Whether this language is currently available)
- `textDirection`: enum ("ltr" | "rtl") (Text direction for layout)

**Validation Rules**:
- `code`: Must be valid ISO 639-1 code, unique, required
- `name`: Required, 2-50 characters
- `nativeName`: Required, 2-50 characters
- `flagIcon`: Required, valid icon reference
- `isDefault`: Only one language can be default at a time
- `textDirection`: Required, defaults to "ltr"

**Indexes**: `code` (unique), `isDefault`, `isActive`

### TranslationKey
**Purpose**: Represents a translatable text string

**Attributes**:
- `key`: string (Unique identifier, e.g., "nav.home", "auth.login")
- `description`: string (Optional description for translators)
- `category`: string (Organizational category, e.g., "navigation", "auth")
- `parameters`: string[] (Optional parameters for interpolation)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Validation Rules**:
- `key`: Required, unique, follows dot notation pattern
- `description`: Optional, max 500 characters
- `category`: Required, used for organization
- `parameters`: Optional array of parameter names

**Indexes**: `key` (unique), `category`, `updatedAt`

### TranslationValue
**Purpose**: Stores the actual translated text for a specific language

**Attributes**:
- `languageCode`: string (Foreign key to Language.code)
- `translationKey`: string (Foreign key to TranslationKey.key)
- `value`: string (The translated text)
- `isTranslated`: boolean (Whether this has been translated or is using fallback)
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Validation Rules**:
- `languageCode`: Required, must reference existing Language
- `translationKey`: Required, must reference existing TranslationKey
- `value`: Required, max 2000 characters
- `isTranslated`: Defaults to false

**Indexes**: `(languageCode, translationKey)` (unique), `isTranslated`, `updatedAt`

## Relationships

### Language ↔ TranslationValue
- One-to-many: Each Language has many TranslationValues
- Cascade delete: If Language is removed, all its TranslationValues are deleted

### TranslationKey ↔ TranslationValue
- One-to-many: Each TranslationKey has many TranslationValues (one per language)
- Cascade delete: If TranslationKey is removed, all its TranslationValues are deleted

## Data Flow & State Management

### Language Detection Flow
```
1. Check URL parameter (?lang=de)
2. If not found, check browser Accept-Language header
3. If not supported, fall back to default language (English)
4. Update URL parameter for persistence
```

### Translation Loading Flow
```
1. Load all TranslationKeys for the current language
2. For missing translations, fall back to default language
3. Cache translations in memory for performance
4. Log missing translations to console for debugging
```

### Language Switching Flow
```
1. User selects new language from modal
2. Update URL parameter (?lang=newLang)
3. Reload translations for new language
4. Update all UI components with new translations
5. Maintain scroll position and form state
```

## Storage Strategy

### Runtime Storage
- **Translation Cache**: In-memory Map for fast lookups
- **Language Config**: Static configuration loaded at build time
- **User Preference**: URL parameter (no persistent storage needed)

### Build-time Storage
- **Translation Files**: JSON files per language in `/src/i18n/locales/`
- **Language Config**: TypeScript constants for available languages
- **Key Registry**: Generated type definitions for translation keys

## Performance Considerations

### Caching Strategy
- Translation values cached in memory after first load
- Language configuration cached at application startup
- Cache invalidation on language change

### Memory Usage
- Estimated memory per language: ~50KB (keys + values)
- Total for 2 languages: ~100KB
- Cache hit ratio target: >95%

### Loading Strategy
- Lazy load non-default language translations
- Preload default language (English) translations
- Background loading for other languages

## Extensibility Design

### Adding New Languages
1. Add language configuration to `languages.ts`
2. Create translation JSON file in `/src/i18n/locales/`
3. Add flag icon or use existing Lucide icon
4. Update type definitions
5. Deploy without code changes

### Adding New Translation Keys
1. Add key to appropriate JSON file
2. Update TypeScript definitions
3. Use new key in components
4. Fallback to English if translation missing

## Validation Rules Implementation

### Language Validation
```typescript
interface LanguageValidation {
  code: (value: string) => boolean; // ISO 639-1 format
  name: (value: string) => boolean; // 2-50 characters
  flagIcon: (value: string) => boolean; // Valid icon reference
}
```

### Translation Validation
```typescript
interface TranslationValidation {
  key: (value: string) => boolean; // Dot notation pattern
  value: (value: string) => boolean; // Max 2000 characters
  parameters: (value: string[]) => boolean; // Valid parameter names
}
```

## Error Handling

### Missing Translations
- Fallback to English text
- Log to console with warning
- Mark as `isTranslated: false` in database (if implemented)

### Invalid Language Codes
- Default to English
- Log error to console
- Continue with fallback language

### Corrupted Translation Files
- Graceful degradation to English
- Error logging for debugging
- Application continues to function

---
*Data model defined for internationalization system*
