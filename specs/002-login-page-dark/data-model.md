# Data Model: Login Page Dark Mode

## Entity Definitions

### ThemePreference
**Description**: Represents a user's theme choice for the login page interface

**Attributes**:
- `theme` (enum: 'light' | 'dark') - The selected theme
- `source` (enum: 'system' | 'user') - Whether theme was set by system detection or user choice
- `timestamp` (datetime) - When the preference was last updated

**Validation Rules**:
- `theme` must be either 'light' or 'dark'
- `source` must be either 'system' or 'user'
- `timestamp` must be a valid ISO datetime

**State Transitions**:
- `system` → `user`: When user explicitly chooses a theme
- `user` → `system`: When user preference is cleared (no persistence per clarification)

**Relationships**:
- No persistent relationships (theme preference is session/browser-scoped)

## Data Flow

### Theme Detection Flow
```
User visits login page
    ↓
System detects prefers-color-scheme
    ↓
Set initial theme (system source)
    ↓
User clicks theme toggle
    ↓
Update theme preference (user source)
    ↓
Apply theme to login page
```

### Theme Persistence Flow
```
Page load
    ↓
Check for existing theme preference
    ↓
If none exists: Use system preference
    ↓
If exists: Apply stored preference
    ↓
User changes theme
    ↓
Update preference (browser storage)
    ↓
Apply new theme immediately
```

## API Contracts

### Theme Management Endpoints

#### GET /api/theme/preference
**Purpose**: Retrieve current theme preference
**Response**:
```json
{
  "theme": "light" | "dark",
  "source": "system" | "user"
}
```

#### POST /api/theme/preference
**Purpose**: Update theme preference
**Request Body**:
```json
{
  "theme": "light" | "dark"
}
```
**Response**:
```json
{
  "theme": "light" | "dark",
  "source": "user",
  "timestamp": "2025-09-25T20:57:03Z"
}
```

#### DELETE /api/theme/preference
**Purpose**: Clear user theme preference (revert to system)
**Response**:
```json
{
  "theme": "light" | "dark", // system detected
  "source": "system",
  "timestamp": "2025-09-25T20:57:03Z"
}
```

## Component Data Flow

### ThemeToggle Component
**Props**:
- `currentTheme` (string): Current theme ('light' | 'dark')
- `onThemeChange` (function): Callback when theme changes
- `disabled` (boolean, optional): Whether toggle is disabled during login

**State**:
- `isLoading` (boolean): Whether theme change is in progress
- `showConfirmation` (boolean): Whether to show confirmation dialog

### LoginForm Component
**Props**:
- `theme` (string): Current theme for styling
- `onThemeChange` (function): Theme change handler

**State**:
- `isLoggingIn` (boolean): Whether login process is active
- `showThemeConfirmation` (boolean): Whether theme confirmation is needed

## Browser Storage Schema

### Local Storage
```json
{
  "inventauri_theme": {
    "theme": "dark",
    "source": "user",
    "timestamp": "2025-09-25T20:57:03Z"
  }
}
```

**Cleanup**: No cleanup needed (no persistence per clarification)

## Validation Rules

### Theme Validation
- Must be exactly 'light' or 'dark'
- Case-sensitive validation
- Reject invalid values with error message

### Source Validation
- Must be exactly 'system' or 'user'
- Auto-set to 'user' when preference is explicitly changed
- Auto-set to 'system' when preference is cleared

### Timestamp Validation
- Must be valid ISO 8601 datetime format
- Must not be in the future
- Auto-generated on updates
