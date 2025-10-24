# Feature Specification: Basic Admin Settings

**Feature Branch**: `004-add-admin-settings`  
**Created**: 2025-10-23  
**Status**: Draft  
**Input**: User description: "i want to implement basic admin settings, basic stuff"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Maintain Business Profile (Priority: P1)

As the account owner, I want to keep our business identity and contact details accurate so that invoices, receipts, and customer communications reflect the right information.

**Why this priority**: Compliance issues and customer confusion emerge immediately when business details are wrong, so correcting them delivers the fastest risk reduction.

**Independent Test**: Update the legal name and primary contact information, save, and verify the confirmation without touching other settings areas.

**Acceptance Scenarios**:

1. **Given** I am signed in with owner rights and on the settings screen, **When** I edit legal name, tax ID, and primary email then confirm, **Then** the system shows a success message and displays the new values everywhere the data appears.
2. **Given** required business profile fields are empty or invalid, **When** I attempt to save, **Then** the system blocks the update and highlights each field that needs attention with corrective guidance.

---

### User Story 2 - Configure Operational Preferences (Priority: P2)

As the operations manager, I want to adjust default currency, timezone, and measurement units so that pricing, timestamps, and inventory align with our business standards.

**Why this priority**: Consistent defaults prevent reporting errors and reduce manual corrections across the organization.

**Independent Test**: Change each preference individually, reload an affected report or listing, and confirm the new default applies without needing engineering support.

**Acceptance Scenarios**:

1. **Given** I have access to operational preferences, **When** I select a new default currency and save, **Then** all default pricing and reporting views display the chosen currency.
2. **Given** the organization spans multiple timezones, **When** I set a different timezone, **Then** newly loaded dashboards and exports show timestamps converted to the selected zone without requiring manual refresh instructions.

---

### User Story 3 - Control Staff Access (Priority: P3)

As the account owner, I want to invite staff, assign appropriate roles, and deactivate access when needed so that only trusted people can manage inventory and sales.

**Why this priority**: Access control protects sensitive data and ensures accountability, but it can land after core profile and operations settings.

**Independent Test**: Invite a staff member, confirm role assignment, then deactivate the user and ensure they can no longer sign in or perform restricted actions.

**Acceptance Scenarios**:

1. **Given** I am on the staff management tab, **When** I invite a teammate with a specific role, **Then** the system sends an invitation and the pending account appears with the selected role.
2. **Given** an active staff account exists, **When** I deactivate the user, **Then** the account status updates immediately and any new sign-in attempts are rejected with an explanation that access was revoked.

---

### Edge Cases

- Attempting to leave the settings area with unsaved changes prompts the admin to save or discard to prevent accidental data loss.
- Concurrent edits by two admins are detected so that the second editor is warned and can refresh before overwriting prior changes.
- Imported or pre-existing data that does not meet current validation rules must surface clear remediation guidance instead of silently failing saves.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST present an admin settings area accessible only to users with Owner or Admin level permissions.
- **FR-002**: System MUST let authorized users edit business profile details including legal name, display name, tax identifiers, registered address, primary phone, and primary email, with validation for required and formatted fields.
- **FR-003**: System MUST require explicit save confirmation before persisting business profile updates and display a success or error message after each attempt.
- **FR-004**: System MUST allow admins to discard unsaved changes and restore the last saved business profile state.
- **FR-005**: System MUST enable configuration of default operational preferences for currency, timezone, inventory units of measure, and fiscal week start, applying those defaults across reports, exports, and new transactions.
- **FR-006**: System MUST provide notification preference controls for key alert categories (e.g., low stock, failed syncs, role invitations) including enable/disable toggles and recipient selection for each category.
- **FR-007**: System MUST support inviting new staff by email, assigning an available role, and tracking pending invitations until accepted or revoked.
- **FR-008**: System MUST allow role reassignment and account deactivation for existing staff, blocking access immediately upon deactivation while preserving historical records.
- **FR-009**: System MUST log every settings change with timestamp, user, affected section, and previous vs. new values for audit review by admins.
- **FR-010**: System MUST apply updated settings to downstream experiences (e.g., documents, dashboards, outbound notifications) within one minute of a successful save.

### Key Entities *(include if feature involves data)*

- **BusinessProfile**: Represents organization identity, tax details, and primary contact channels displayed on documents and communications.
- **OperationalPreference**: Stores organization-wide defaults for currency, timezone, measurement units, and scheduling conventions that shape calculations and presentation.
- **NotificationPreference**: Captures alert categories, delivery status, and designated recipients so admins can tailor which messages are sent.
- **StaffAccount**: Describes team members invited to the platform, including role, status (active, pending, deactivated), and audit trail for access changes.

## Assumptions

- Owner and Admin roles already exist in the system and carry full access to settings; additional roles (Manager, Staff) have restricted access by design.
- Each account represents a single business entity, so one shared settings set applies to all locations; multi-entity management is out of scope for this feature.
- Outbound notification delivery for this release is limited to email; SMS or push notifications can be considered in future iterations.
- Downstream modules (invoicing, dashboards, reports) are capable of reading updated settings without requiring migrations beyond real-time refresh.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In moderated usability tests, 100% of admin participants update and save the business profile correctly within 2 minutes.
- **SC-002**: Operational and notification preference changes appear in affected interfaces and documents within 60 seconds in at least 95% of observed saves.
- **SC-003**: Post-launch survey shows at least 85% of responding admins rate the settings experience as easy or very easy.
- **SC-004**: Support tickets related to incorrect business details or misconfigured access drop by 40% within the first full month after release.
