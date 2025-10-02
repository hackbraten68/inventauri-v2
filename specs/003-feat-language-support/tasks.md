# Tasks: Language Support (Internationalization)

**Input**: Design documents from `/specs/003-feat-language-support/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup
- [x] T001 Create i18n project structure in src/i18n/ with locales/, utils.ts, types.ts
- [x] T002 Install astro-i18n and react-i18next dependencies with proper TypeScript configuration
- [x] T003 [P] Configure astro-i18n middleware for SSR language detection and routing
- [x] T004 [P] Set up shadcn/ui Dialog component for language selection modals

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] Contract test GET /api/language/detect in tests/contracts/test-language-detect.ts
- [x] T006 [P] Contract test POST /api/language/switch in tests/contracts/test-language-switch.ts
- [x] T007 [P] Contract test GET /api/translations/{lang} in tests/contracts/test-translations-load.ts
- [x] T008 [P] Integration test language detection on page load in tests/integration/test-language-detection.ts
- [x] T009 [P] Integration test language switcher modal interactions in tests/integration/test-language-switcher.ts
- [x] T010 [P] Integration test missing translation fallback in tests/integration/test-translation-fallback.ts
- [x] T011 [P] Integration test mobile responsiveness in tests/integration/test-mobile-language-switching.ts
- [x] T012 [P] Integration test URL sharing and bookmarking in tests/integration/test-url-language-persistence.ts
- [x] T013 [P] Integration test accessibility features in tests/integration/test-accessibility-language-controls.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T014 [P] Language entity configuration in src/i18n/types.ts with validation rules
- [x] T015 [P] TranslationKey and TranslationValue interfaces in src/i18n/types.ts
- [x] T016 [P] Language detection utility functions in src/i18n/utils.ts
- [x] T017 [P] URL parameter management utilities in src/i18n/utils.ts
- [x] T018 [P] Translation loading and caching system in src/i18n/utils.ts
- [x] T019 [P] English translation file in src/i18n/locales/en.json
- [x] T020 [P] German translation file in src/i18n/locales/de.json
- [x] T021 [P] Language switcher UI component in src/components/ui/language-switcher.tsx
- [x] T022 [P] Language selection modal component in src/components/ui/language-modal.tsx
- [x] T023 GET /api/language/detect endpoint implementation
- [x] T024 POST /api/language/switch endpoint implementation
- [x] T025 GET /api/translations/{lang} endpoint implementation
- [x] T026 Update AppLayout.astro to include language switcher for logged-in users
- [x] T027 Update login form components to include language switcher
- [x] T028 Astro middleware integration for language detection and routing

## Phase 3.4: Integration
- [x] T029 Connect language detection to Astro routing system
- [x] T030 Integrate react-i18next with existing React components
- [x] T031 Update existing auth components to use translation system
- [x] T032 Update navigation components to use translation system
- [x] T033 Implement browser language detection fallback logic
- [x] T034 Add console logging for missing translations
- [x] T035 Implement translation caching for performance

## Phase 3.5: Polish
- [x] T036 [P] Unit tests for language detection utilities in tests/unit/i18n/test-language-detection.ts
- [x] T037 [P] Unit tests for URL parameter management in tests/unit/i18n/test-url-parameters.ts
- [x] T038 [P] Unit tests for translation loading in tests/unit/i18n/test-translation-loading.ts
- [x] T039 [P] Unit tests for language switcher components in tests/unit/components/test-language-switcher.ts
- [x] T040 [P] Unit tests for language modal components in tests/unit/components/test-language-modal.ts
- [ ] T046 Redesign language switcher modal UI/UX for better user experience
- [ ] T047 Fix language switching functionality (modal not updating language state)
- [ ] T048 Add visual feedback for language switching (loading states, animations)
- [ ] T049 Improve language modal responsiveness and mobile experience

## Dependencies
- Setup (T001-T004) before everything
- Contract tests (T005-T007) before API implementation (T023-T025)
- Integration tests (T008-T013) before UI implementation (T021-T022, T026-T027)
- Core utilities (T014-T020) before endpoints (T023-T025)
- T016 (URL utils) blocks T023 (detect endpoint)
- T017 (URL utils) blocks T024 (switch endpoint)
- T018 (translation utils) blocks T025 (translations endpoint)
- T021 (switcher component) blocks T026 (layout integration)
- T028 (middleware) blocks T029 (routing integration)
- Implementation before polish (T036-T045)

## Parallel Example
```
# Launch setup tasks together:
Task: "Create i18n project structure in src/i18n/ with locales/, utils.ts, types.ts"
Task: "Configure astro-i18n middleware for SSR language detection and routing"
Task: "Set up shadcn/ui Dialog component for language selection modals"

# Launch contract tests together:
Task: "Contract test GET /api/language/detect in tests/contracts/test-language-detect.ts"
Task: "Contract test POST /api/language/switch in tests/contracts/test-language-switch.ts"
Task: "Contract test GET /api/translations/{lang} in tests/contracts/test-translations-load.ts"

# Launch unit tests together:
Task: "Unit tests for language detection utilities in tests/unit/i18n/test-language-detection.ts"
Task: "Unit tests for URL parameter management in tests/unit/i18n/test-url-parameters.ts"
Task: "Unit tests for translation loading in tests/unit/i18n/test-translation-loading.ts"
Task: "Unit tests for language switcher components in tests/unit/components/test-language-switcher.ts"
Task: "Unit tests for language modal components in tests/unit/components/test-language-modal.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- All tasks must be specific enough for LLM implementation without additional context
- Follow existing code patterns and TypeScript interfaces
- Ensure shadcn/ui components follow existing design system
- Test mobile responsiveness and accessibility throughout implementation

## Task Generation Rules
- Each contract → dedicated test task [P]
- Each entity → model/interface task [P]
- Each endpoint → implementation task (sequential if shared dependencies)
- Each test scenario → integration test task [P]
- TDD approach: Tests before implementation
- Parallel execution for independent files only
- Clear file paths and specific requirements in each task
