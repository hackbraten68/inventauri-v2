# Tasks (Phase 2)

Strategy: TDD-first. Generate tests and contracts before implementation. Parallelize [P]-marked tasks where independent.

## 0. Environment & Bootstrap
1. Verify dev env runs: `docker compose up -d` and app at http://localhost:4321
2. Seed script scaffold [P]: create minimal seed for one Shop, Owner user

## 1. Data Model & Database
3. Define DB schema draft from `data-model.md` (Shop, User, Category, Product, ProductVariant, Inventory, Transaction, TransactionItem)
4. Multi-tenant scoping [P]: add `shop_id` to all tenant-scoped tables and uniqueness constraints (e.g., (shop_id, sku))
5. Integrity constraints [P]: triggers/policies for immutable `unit` post-transaction; non-negative inventory unless policy allows
6. Migrations: create initial migration and apply in Supabase

## 2. Security & RLS
7. Auth roles and mapping: Owner/Manager/Staff; document permissions in README
8. RLS policies draft: per-table tenant isolation and role capabilities
9. RLS tests [P]: contract tests that a user from Shop A cannot access Shop B data

## 3. API Contracts and Tests
10. Validate `contracts/openapi.yaml` structure [P]
11. Contract tests: items endpoints (list/create/get) per OpenAPI
12. Contract tests: inventory endpoints (inbound/adjust)
13. Contract tests: POS sale endpoint
14. Contract tests: reports sales totals endpoint

## 4. Backend API Implementation
15. Items API implementation [P]:
    - POST /items create product + variants
    - GET /items list with search/category filters
    - GET /items/{id}
16. Inventory API implementation [P]:
    - POST /inventory/inbound (increase stock)
    - POST /inventory/adjust (add/remove with reason)
17. POS API: POST /pos/sale (online-only)
18. Reports API: GET /reports/sales (daily/weekly/monthly totals)
19. Audit log [P]: record all inventory changes linked to Transaction

## 5. Business Rules & Validations
20. Low-stock alerts: compute when `Inventory.quantity < ProductVariant.reorder_level`
21. Prevent checkout when offline: backend/guard + frontend UX message
22. Variant unit immutability: enforce at DB and service layer

## 6. Frontend Screens (Astro + TS)
23. Catalog [P]: list/search products and variants; category filter
24. Item detail [P]: product + variants view; edit/archive
25. Inventory [P]: inbound and adjust flows; show current quantity and locations
26. POS: basic cart and checkout; disable checkout offline; show errors clearly
27. Dashboard: current stock overview + low-stock list
28. Reports: sales totals and trends by day/week/month

## 7. Authentication & Authorization
29. Email/password auth flow (signup for Owner, login, reset password)
30. Role-based UI gating [P]: Owner vs Manager vs Staff capabilities

## 8. Testing & QA
31. Integration tests: primary user story (add item, stock inbound, sale updates stock)
32. Edge-case tests [P]: zero stock sale blocked; negative inventory handling per policy
33. Performance smoke tests: POS path < 250ms local; dashboard hydrate < 1s with mock summarized data

## 9. Documentation & Quickstart
34. Update `quickstart.md` with steps validated during QA
35. Admin guide [P]: how to manage shops, users, roles; backup/restore pointers

## 10. Readiness Gate
36. Constitution conformance check: code quality, tests, UX consistency, performance metrics
37. Handover: summarize release notes and known deferrals (offline sales, advanced reports)

## 11. Follow-ups and Enhancements
38. Contract test harness setup [P]
    - Install and configure test runner (e.g., Vitest) and API test utilities
    - Wire scripts in `package.json` (e.g., `test`, `test:contracts`)
    - Base helper to auth and call endpoints with tenant scoping
39. Contract tests [P]: prioritize items and inventory first
    - Items: list/create/get per `contracts/openapi.yaml`
    - Inventory: inbound/adjust per `contracts/openapi.yaml`
40. Reports API: implement and test
    - Implement `GET /reports/sales` with tenant scoping (daily/weekly/monthly totals)
    - Add contract test ensuring tenant isolation
41. Tenant scoping audit [P]
    - Scan and scope remaining read paths (e.g., `src/lib/data/dashboard.ts`)
    - Add tests to ensure only the user’s shop data is returned
42. Variant model planning and staged migration
    - Introduce `Product` and `ProductVariant` (backward-compatible)
    - Stage migration scripts and compatibility layer for current `Item` API
    - Prepare cutover plan and tests
