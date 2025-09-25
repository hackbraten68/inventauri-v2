# Implementation Plan: Language Support (Internationalization)

**Branch**: `003-feat-language-support` | **Date**: 2025-09-25 | **Spec**: /specs/003-feat-language-support/spec.md
**Input**: Feature specification from `/specs/003-feat-language-support/spec.md`

## Summary
Add comprehensive internationalization support to the Inventauri application with automatic language detection, user-friendly language switchers, and extensible architecture for English and German languages. The implementation will use URL parameters for language storage and shadcn/ui components for consistent, accessible UI controls.

## Technical Context
**Language/Version**: TypeScript 5.x, Astro 5.13.10, React 18.x
**Primary Dependencies**: astro-i18n, react-i18next, shadcn/ui components, lucide-react
**Storage**: URL parameters (no database storage needed)
**Testing**: Vitest with React Testing Library
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (frontend-focused with server-side rendering)
**Performance Goals**: Language switching <100ms response time, minimal bundle size impact
**Constraints**: Must maintain existing design system consistency, responsive on mobile devices
**Scale/Scope**: 2 languages initially, extensible to 10+ languages, 50-100 translatable strings

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on `/memory/constitution.md` requirements:

**Code Quality**: Will use strict TypeScript types with proper interfaces for translation keys and language configurations. No unsafe casts or `any` types.

**Testing Standards**: Will add comprehensive unit tests for language detection, URL parameter handling, and component interactions. Integration tests for language switching workflows.

**User Experience Consistency**: Language switchers will follow existing design patterns (theme toggler placement, modal interactions). Will use shared design tokens and maintain consistency across login/logged-in states.

**Performance Requirements**: Language switching will be client-side with minimal re-renders. Bundle impact will be monitored and kept under 50KB for i18n libraries.

## Project Structure

### Documentation (this feature)
```
specs/003-feat-language-support/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (when "frontend" + "backend" detected)
src/
├── i18n/                    # NEW: Internationalization utilities
│   ├── locales/            # Translation files (JSON)
│   ├── utils.ts            # Language detection and URL handling
│   └── types.ts            # TypeScript interfaces
├── components/
│   ├── ui/                 # shadcn/ui components for language switcher
│   │   ├── language-switcher.tsx
│   │   └── language-modal.tsx
│   └── auth/               # Update existing auth components
│       ├── login-form.tsx  # Add language switcher
│       └── ...
└── layouts/                # Update layout components
    └── AppLayout.astro     # Add logged-in language switcher

tests/
├── unit/
│   └── i18n/              # NEW: Unit tests for i18n utilities
└── integration/
    └── language-switching.test.ts  # Integration tests
```

**Structure Decision**: Option 2 (Web application) - This is a frontend-focused feature with some utility functions, fitting the existing Astro + React structure.

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Research best astro-i18n integration patterns for Astro 5.x
   - Evaluate i18next vs @astrojs/i18n vs custom solution trade-offs
   - Research URL parameter-based language persistence patterns
   - Find optimal flag icon solutions (country-flag-icons vs lucide-react)

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research astro-i18n integration for Astro 5.x with SSR"
     Task: "Compare i18next vs @astrojs/i18n for React components"
     Task: "Best practices for URL-based language switching"
     Task: "Flag icon solutions compatible with shadcn/ui"
   For each technology choice:
     Task: "Find best practices for shadcn/ui modal components"
     Task: "Performance impact analysis of i18n libraries"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Language entity: code, name, flag, translations
   - User preference: language code, URL persistence
   - Translation key management system

2. **Generate API contracts** from functional requirements:
   - Language detection endpoint (GET /api/language/detect)
   - Language switching endpoint (POST /api/language/switch)
   - Translation loading (GET /api/translations/{lang})

3. **Generate contract tests** from contracts:
   - Language detection contract tests
   - Language switching contract tests
   - Translation loading contract tests

4. **Extract test scenarios** from user stories:
   - Language detection on page load
   - Language switcher modal interactions
   - URL parameter updates on language change
   - Fallback to English for missing translations

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh windsurf`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Utilities → Components → Integration
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

No constitution violations identified. Implementation follows established patterns:
- Uses existing React + TypeScript stack
- Leverages existing Radix UI/shadcn ecosystem
- Maintains performance requirements with client-side language switching
- Follows existing component architecture patterns

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
