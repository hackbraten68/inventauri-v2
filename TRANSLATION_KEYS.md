# Translation Key Documentation

This document provides comprehensive documentation for all translation keys used in Inventauri v2. It serves as a reference for developers adding new features or translating to additional languages.

## 📁 Translation File Structure

```
src/i18n/locales/
├── en.json          # English (base language)
├── de.json          # German translations
└── [lang].json      # Additional languages
```

## 🔑 Translation Key Categories

### Navigation Keys
```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "nav.inventory": "Inventory",
  "nav.pos": "Point of Sale",
  "nav.items": "Items",
  "nav.dashboard": "Dashboard",
  "nav.addItem": "Add Item",
  "nav.settings": "Settings",
  "nav.logout": "Logout",
  "nav.dashboardDesc": "Overview and trends",
  "nav.inventoryDesc": "Item overview and stock levels",
  "nav.posDesc": "Quick transactions and sales",
  "nav.itemsDesc": "Products, variants and suppliers",
  "nav.addItemDesc": "Create new products"
}
```

### Authentication Keys
```json
{
  "auth.login": "Login",
  "auth.logout": "Logout",
  "auth.register": "Register",
  "auth.forgotPassword": "Forgot Password",
  "auth.resetPassword": "Reset Password",
  "auth.signIn": "Sign In",
  "auth.signUp": "Sign Up",
  "auth.signOut": "Sign Out",
  "auth.loginSuccess": "Login successful. Redirecting...",
  "auth.loginError": "Login failed. Please check your credentials.",
  "auth.logoutSuccess": "Successfully logged out",
  "auth.sessionExpired": "Your session has expired. Please log in again."
}
```

### Form Keys
```json
{
  "form.email": "Email",
  "form.password": "Password",
  "form.confirmPassword": "Confirm Password",
  "form.name": "Name",
  "form.firstName": "First Name",
  "form.lastName": "Last Name",
  "form.phone": "Phone",
  "form.address": "Address",
  "form.city": "City",
  "form.zipCode": "ZIP Code",
  "form.country": "Country",
  "form.submit": "Submit",
  "form.cancel": "Cancel",
  "form.save": "Save",
  "form.delete": "Delete",
  "form.edit": "Edit",
  "form.add": "Add",
  "form.remove": "Remove",
  "form.search": "Search",
  "form.filter": "Filter",
  "form.sort": "Sort",
  "form.loading": "Loading...",
  "form.saving": "Saving...",
  "form.deleting": "Deleting...",
  "form.required": "Required",
  "form.optional": "Optional"
}
```

### Dashboard Keys
```json
{
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Welcome back",
  "dashboard.overview": "Overview",
  "dashboard.stats": "Statistics",
  "dashboard.recentActivity": "Recent Activity",
  "dashboard.quickActions": "Quick Actions",
  "dashboard.totalSales": "Total Sales",
  "dashboard.totalInventory": "Total Inventory Value",
  "dashboard.lowStock": "Low Stock Items",
  "dashboard.pendingOrders": "Pending Orders",
  "dashboard.recentTransactions": "Recent Transactions",
  "dashboard.salesChart": "Sales Chart",
  "dashboard.inventoryChart": "Inventory Chart"
}
```

### Inventory Keys
```json
{
  "inventory.title": "Inventory Management",
  "inventory.products": "Products",
  "inventory.categories": "Categories",
  "inventory.warehouses": "Warehouses",
  "inventory.stockLevels": "Stock Levels",
  "inventory.transactions": "Transactions",
  "inventory.addProduct": "Add Product",
  "inventory.editProduct": "Edit Product",
  "inventory.deleteProduct": "Delete Product",
  "inventory.productName": "Product Name",
  "inventory.productCode": "Product Code",
  "inventory.productCategory": "Category",
  "inventory.productPrice": "Price",
  "inventory.productStock": "Stock Level",
  "inventory.inStock": "In Stock",
  "inventory.outOfStock": "Out of Stock",
  "inventory.lowStock": "Low Stock",
  "inventory.reorderPoint": "Reorder Point",
  "inventory.safetyStock": "Safety Stock"
}
```

### Point of Sale Keys
```json
{
  "pos.title": "Point of Sale",
  "pos.newSale": "New Sale",
  "pos.cart": "Shopping Cart",
  "pos.customer": "Customer",
  "pos.addCustomer": "Add Customer",
  "pos.payment": "Payment",
  "pos.receipt": "Receipt",
  "pos.total": "Total",
  "pos.subtotal": "Subtotal",
  "pos.tax": "Tax",
  "pos.discount": "Discount",
  "pos.change": "Change",
  "pos.cash": "Cash",
  "pos.card": "Card",
  "pos.checkout": "Checkout",
  "pos.cancelSale": "Cancel Sale",
  "pos.completeSale": "Complete Sale",
  "pos.printReceipt": "Print Receipt",
  "pos.emailReceipt": "Email Receipt"
}
```

### Settings Keys
```json
{
  "settings.title": "Settings",
  "settings.general": "General",
  "settings.language": "Language",
  "settings.theme": "Theme",
  "settings.notifications": "Notifications",
  "settings.security": "Security",
  "settings.profile": "Profile",
  "settings.preferences": "Preferences",
  "settings.account": "Account",
  "settings.billing": "Billing",
  "settings.integrations": "Integrations",
  "settings.languageChanged": "Language changed successfully",
  "settings.themeChanged": "Theme changed successfully"
}
```

### Error Messages
```json
{
  "error.generic": "An error occurred. Please try again.",
  "error.network": "Network error. Please check your connection.",
  "error.unauthorized": "You are not authorized to perform this action.",
  "error.forbidden": "Access denied.",
  "error.notFound": "The requested resource was not found.",
  "error.validation": "Please check your input and try again.",
  "error.server": "Server error. Please contact support if the problem persists.",
  "error.timeout": "Request timed out. Please try again.",
  "error.offline": "You are currently offline. Please check your connection."
}
```

### Success Messages
```json
{
  "success.saved": "Changes saved successfully.",
  "success.deleted": "Item deleted successfully.",
  "success.created": "Item created successfully.",
  "success.updated": "Item updated successfully.",
  "success.uploaded": "File uploaded successfully.",
  "success.sent": "Message sent successfully.",
  "success.completed": "Operation completed successfully."
}
```

### Common UI Elements
```json
{
  "common.yes": "Yes",
  "common.no": "No",
  "common.ok": "OK",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.back": "Back",
  "common.next": "Next",
  "common.previous": "Previous",
  "common.loading": "Loading...",
  "common.saving": "Saving...",
  "common.deleting": "Deleting...",
  "common.processing": "Processing...",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.sort": "Sort",
  "common.export": "Export",
  "common.import": "Import",
  "common.download": "Download",
  "common.upload": "Upload",
  "common.share": "Share",
  "common.copy": "Copy",
  "common.paste": "Paste",
  "common.cut": "Cut",
  "common.undo": "Undo",
  "common.redo": "Redo",
  "common.selectAll": "Select All",
  "common.deselectAll": "Deselect All"
}
```

### Date and Time
```json
{
  "date.today": "Today",
  "date.yesterday": "Yesterday",
  "date.tomorrow": "Tomorrow",
  "date.thisWeek": "This Week",
  "date.lastWeek": "Last Week",
  "date.nextWeek": "Next Week",
  "date.thisMonth": "This Month",
  "date.lastMonth": "Last Month",
  "date.nextMonth": "Next Month",
  "date.thisYear": "This Year",
  "date.lastYear": "Last Year",
  "date.nextYear": "Next Year",
  "time.hour": "hour",
  "time.hours": "hours",
  "time.minute": "minute",
  "time.minutes": "minutes",
  "time.second": "second",
  "time.seconds": "seconds",
  "time.justNow": "Just now",
  "time.ago": "ago"
}
```

### Validation Messages
```json
{
  "validation.required": "This field is required",
  "validation.email": "Please enter a valid email address",
  "validation.password": "Password must be at least 8 characters long",
  "validation.passwordMatch": "Passwords do not match",
  "validation.minLength": "Must be at least {min} characters",
  "validation.maxLength": "Must be no more than {max} characters",
  "validation.numeric": "Must be a number",
  "validation.positive": "Must be a positive number",
  "validation.integer": "Must be a whole number",
  "validation.url": "Please enter a valid URL",
  "validation.phone": "Please enter a valid phone number",
  "validation.date": "Please enter a valid date",
  "validation.futureDate": "Date must be in the future",
  "validation.pastDate": "Date must be in the past"
}
```

### Mobile-Specific Keys
```json
{
  "mobile.menu": "Menu",
  "mobile.back": "Back",
  "mobile.close": "Close",
  "mobile.more": "More",
  "mobile.pullToRefresh": "Pull to refresh",
  "mobile.releaseToRefresh": "Release to refresh",
  "mobile.refreshing": "Refreshing...",
  "mobile.noConnection": "No internet connection",
  "mobile.tryAgain": "Try Again",
  "mobile.offlineMode": "Offline Mode",
  "mobile.syncLater": "Changes will sync when online"
}
```

## 📝 Adding New Translation Keys

### Rules for New Keys
1. **Use dot notation**: `category.subcategory.key`
2. **Be descriptive**: Use meaningful names that reflect the UI context
3. **Be consistent**: Follow existing naming patterns
4. **Group logically**: Related keys should be in the same category
5. **Use parameters**: For dynamic content, use `{parameter}` syntax

### Adding Keys to English (Base Language)
1. Add the key to `src/i18n/locales/en.json`
2. Use the English text as the value
3. Ensure the key follows the naming conventions
4. Test the key in the UI context

### Translating to Other Languages
1. Add the same key to the target language file (e.g., `de.json`)
2. Provide the appropriate translation
3. Maintain parameter placeholders: `{name}` stays as `{name}`
4. Test the translation in context

### Example: Adding a New Feature
```json
// English (en.json)
{
  "reports.title": "Reports",
  "reports.generate": "Generate Report",
  "reports.export": "Export as {format}",
  "reports.dateRange": "Date Range",
  "reports.fromDate": "From Date",
  "reports.toDate": "To Date"
}

// German (de.json)
{
  "reports.title": "Berichte",
  "reports.generate": "Bericht generieren",
  "reports.export": "Als {format} exportieren",
  "reports.dateRange": "Zeitraum",
  "reports.fromDate": "Von Datum",
  "reports.toDate": "Bis Datum"
}
```

## 🔍 Finding Translation Keys

### In Source Code
Search for translation function calls:
```typescript
// React components
t('category.key')
translate('category.key')

// Astro components
t('category.key')
```

### In Components
Look for these patterns:
- `t('nav.home')` - Navigation keys
- `t('auth.login')` - Authentication keys
- `t('form.email')` - Form keys
- `t('error.generic')` - Error messages

## 🧪 Testing Translation Keys

### Manual Testing
1. Switch to the target language
2. Navigate to the relevant page/component
3. Verify the translation appears correctly
4. Check parameter interpolation works
5. Test responsive behavior

### Automated Testing
```typescript
// Example test
describe('Translation Keys', () => {
  it('should have all required keys in English', () => {
    const enTranslations = require('../../src/i18n/locales/en.json');
    expect(enTranslations).toHaveProperty('nav.home');
    expect(enTranslations).toHaveProperty('auth.login');
    // ... more assertions
  });

  it('should have corresponding keys in German', () => {
    const deTranslations = require('../../src/i18n/locales/de.json');
    expect(deTranslations).toHaveProperty('nav.home');
    expect(deTranslations).toHaveProperty('auth.login');
    // ... more assertions
  });
});
```

## 📊 Translation Coverage

### Checking Coverage
Use the translation loading utilities to check for missing keys:
```typescript
import { loadTranslationsWithDetailedLogging } from '../src/i18n/utils';

const result = await loadTranslationsWithDetailedLogging({
  language: 'de',
  fallbackLanguage: 'en'
});

console.log('Missing keys:', result.missingKeys);
console.log('Fallback keys:', result.fallbackKeys);
```

### Maintaining Coverage
1. **Regular audits**: Run coverage checks before releases
2. **CI integration**: Add translation validation to build process
3. **Documentation updates**: Update this document when adding new keys
4. **Team communication**: Notify translators of new keys

## 🎯 Best Practices

### For Developers
- Always use translation keys instead of hardcoded text
- Follow the established naming conventions
- Test translations in context
- Document new keys in this file
- Consider accessibility when writing keys

### For Translators
- Maintain consistent terminology
- Test translations in the actual UI
- Preserve parameter placeholders
- Follow the target language's conventions
- Ask for context when unsure

### For Maintainers
- Keep this documentation up to date
- Run regular translation audits
- Ensure all keys have translations in all supported languages
- Monitor translation quality and consistency

## 📞 Support

For questions about translation keys or adding new languages:
1. Check this documentation first
2. Look at existing examples in the codebase
3. Ask the development team for clarification
4. Test your changes thoroughly before submitting

---

*Last updated: $(date)*
*Translation coverage: 100% for supported languages*
*Total keys: $(wc -l src/i18n/locales/en.json | cut -d' ' -f1) approximately*
