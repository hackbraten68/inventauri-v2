# Quickstart: Allow Version Zero Creates

1. **Prepare environment**
   ```bash
   npm install
   npm run db:generate
   npm run db:seed
   ```
   Ensure a clean tenant exists without business profile or operational preferences.

2. **Run focused tests**
   ```bash
   npm test tests/unit/settings-version.test.ts
   npm test tests/integration/settings-business-profile.test.ts
   npm test tests/integration/settings-operational-preferences.test.ts
   ```
   Verify optimistic locking and version-zero behavior across both settings flows.

3. **Manual validation**
   - Call `PUT /api/settings/business-profile` with `{ "version": 0, ... }` and confirm HTTP 200 with `version = 1` in the response.
   - Call `PUT /api/settings/business-profile` again with the stale payload (`version: 0`) and confirm HTTP 409 with conflict messaging.
   - Repeat both steps for `PUT /api/settings/operational`.

4. **Regression sweep**
   ```bash
   npm test
   ```
   (If the full suite fails due to unrelated tests, run the focused commands above and file follow-up tickets before release.)
