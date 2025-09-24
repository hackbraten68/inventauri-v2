# Quickstart (Phase 2)

This guide helps operators and administrators set up and use the multi-tenant inventory system.

## Prerequisites
- Docker and Docker Compose installed
- `.env` file configured (see `.env.example`)
- Node.js 18+ for local development

## Initial Setup

### Start Services
```bash
# From repository root
docker compose up -d

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev
```

## First-Time Setup

### 1. Initialize Admin Account
1. Open the application: http://localhost:4321
2. Click "Register" and create an Owner account
3. Complete your shop setup with name and unique slug

### 2. Configure Shop Settings
1. Navigate to Settings → Shop
2. Configure:
   - Business hours
   - Tax settings
   - Default units of measure
   - Currency and locale

## Core Workflows

### Managing Products
1. **Create a Category**
   - Go to Catalog → Categories
   - Click "Add Category"
   - Enter category name and description

2. **Add Products with Variants**
   - Go to Catalog → Products
   - Click "Add Product"
   - Enter product details (name, description, category)
   - Add variants with unique SKUs, prices, and units
   - Set reorder levels for inventory management

### Inventory Management
1. **Receive Stock**
   - Go to Inventory → Receiving
   - Select a product variant
   - Enter quantity and location
   - Add any notes or reference numbers

2. **Adjust Inventory**
   - Go to Inventory → Adjustments
   - Select a reason (damage, loss, etc.)
   - Enter positive or negative quantities
   - Add notes for auditing

### Point of Sale
1. **Process a Sale**
   - Go to POS
   - Search and add items by SKU or name
   - Apply discounts if needed
   - Select payment method
   - Complete the sale

2. **Handle Returns**
   - Go to POS → Returns
   - Look up the original transaction
   - Select items to return
   - Process the refund

## Reporting

### Sales Reports
- View daily, weekly, and monthly sales totals
- Filter by date range, product, or category
- Export to CSV/Excel

### Inventory Reports
- Current stock levels
- Low stock alerts
- Inventory valuation
- Stock movement history

## User Management
1. **Add Team Members**
   - Go to Settings → Users
   - Click "Invite User"
   - Enter email and assign role (Owner/Manager/Staff)
   - User will receive an invitation email

2. **Manage Permissions**
   - Edit user roles as needed
   - Deactivate/reactivate users
   - View login history

## Troubleshooting

### Common Issues
- **Can't log in**
  - Check email and password
  - Verify account is active in admin settings
  - Check email for verification link if required

- **Inventory discrepancies**
  - Review transaction history
  - Check for unprocessed adjustments
  - Verify user permissions

- **Performance issues**
  - Check server resources
  - Clear browser cache
  - Optimize database queries if needed

## Support
For additional help:
- Check the [Admin Guide](./admin-guide.md) for detailed instructions
- Contact support@inventauri.example.com
- Visit our [documentation site](https://docs.inventauri.example.com)
