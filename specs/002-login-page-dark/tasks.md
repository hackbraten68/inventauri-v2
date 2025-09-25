# Tasks: Login Page Dark Mode

**Input**: Design documents from `/specs/002-login-page-dark/`
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

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [x] T001 Create theme utility functions in src/lib/theme.ts
- [x] T002 [P] Configure Tailwind CSS dark mode classes in existing config
- [x] T003 [P] Set up theme context provider for component access

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test GET /api/theme/preference in tests/contract/test_theme_get.ts
- [x] T005 [P] Contract test POST /api/theme/preference in tests/contract/test_theme_post.ts
- [x] T006 [P] Contract test DELETE /api/theme/preference in tests/contract/test_theme_delete.ts
- [x] T007 [P] Integration test system theme detection in tests/integration/test_system_theme.ts
- [x] T008 [P] Integration test theme toggle functionality in tests/integration/test_theme_toggle.ts
- [x] T009 [P] Integration test mobile responsiveness in tests/integration/test_mobile_theme.ts
- [x] T010 [P] Integration test accessibility compliance in tests/integration/test_accessibility.ts
- [x] T011 [P] Integration test login process interaction in tests/integration/test_login_flow.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T012 [P] ThemePreference model in src/lib/theme-preference.ts
- [x] T013 [P] ThemeService for state management in src/lib/theme-service.ts
- [x] T014 [P] ThemeToggle component in src/components/ui/ThemeToggle.tsx
- [x] T015 Update login page to support dark mode in src/pages/login.astro
- [x] T016 Implement system theme detection logic in src/lib/theme-detection.ts
- [x] T017 Add theme confirmation dialog for login process in src/components/auth/LoginDialog.tsx
- [x] T018 Update AppLayout with theme provider in src/layouts/AppLayout.astro

## Phase 3.4: Integration
- [x] T019 Connect theme system to existing authentication flow
- [x] T020 Ensure theme persistence across page navigation
- [x] T021 Add theme toggle to login card layout
- [x] T022 Implement mobile-specific theme toggle positioning
- [x] T023 Add keyboard navigation support for theme toggle

## Phase 3.5: Polish
- [x] T024 [P] Unit tests for theme utilities in tests/unit/test_theme_utils.ts
- [x] T025 [P] Unit tests for theme service in tests/unit/test_theme_service.ts
- [x] T026 [P] Unit tests for theme toggle component in tests/unit/test_theme_toggle.ts
- [x] T027 Performance test theme switching (<100ms) in tests/performance/test_theme_performance.ts
- [x] T028 [P] Accessibility audit for WCAG AA compliance
- [x] T029 [P] Update component documentation
- [x] T030 Remove any unused theme-related code

## Dependencies
- Setup (T001-T003) before everything
- Tests (T004-T011) before implementation (T012-T018)
- T012 blocks T013, T019
- T014 blocks T021, T022
- T015 blocks T019, T020
- T018 blocks T019
- Implementation (T012-T023) before polish (T024-T030)

## Parallel Example
```
# Launch T004-T006 together (contract tests):
Task: "Contract test GET /api/theme/preference in tests/contract/test_theme_get.ts"
Task: "Contract test POST /api/theme/preference in tests/contract/test_theme_post.ts"
Task: "Contract test DELETE /api/theme/preference in tests/contract/test_theme_delete.ts"

# Launch T007-T011 together (integration tests):
Task: "Integration test system theme detection in tests/integration/test_system_theme.ts"
Task: "Integration test theme toggle functionality in tests/integration/test_theme_toggle.ts"
Task: "Integration test mobile responsiveness in tests/integration/test_mobile_theme.ts"
Task: "Integration test accessibility compliance in tests/integration/test_accessibility.ts"
Task: "Integration test login process interaction in tests/integration/test_login_flow.ts"

# Launch T024-T026 together (unit tests):
Task: "Unit tests for theme utilities in tests/unit/test_theme_utils.ts"
Task: "Unit tests for theme service in tests/unit/test_theme_service.ts"
Task: "Unit tests for theme toggle component in tests/unit/test_theme_toggle.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task

2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks

3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
