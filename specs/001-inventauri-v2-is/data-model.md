# Data Model (Phase 1)

## Entities

### Shop (Tenant)
- id (uuid, pk)
- name (text)
- slug (text, unique)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints
- slug unique

### User
- id (uuid, pk)
- email (text, unique)
- name (text)
- role (enum: owner, manager, staff)
- last_login (timestamptz)
- shop_id (uuid, fk → Shop.id)

Constraints
- (shop_id, email) unique recommended if multi-tenant auth breaks global uniqueness
- Role authorizes capabilities (see AuthZ policies)

### Category
- id (uuid, pk)
- shop_id (uuid, fk → Shop.id)
- name (text)
- description (text)

Constraints
- (shop_id, name) unique

### Product (Parent)
- id (uuid, pk)
- shop_id (uuid, fk → Shop.id)
- name (text)
- sku_root (text, optional, unique within shop) — optional parent SKU
- description (text)
- barcode (text, optional)
- category_id (uuid, fk → Category.id, nullable)

Constraints
- (shop_id, name) unique recommended
- barcode optional; if present, (shop_id, barcode) unique

### ProductVariant
- id (uuid, pk)
- product_id (uuid, fk → Product.id)
- shop_id (uuid, fk → Shop.id)
- sku (text, unique within shop)
- attributes (jsonb) — e.g., {"size":"M","color":"Blue"}
- unit (enum: piece, kg, liter, …) — immutable after first transaction
- price (numeric)
- cost (numeric, optional)
- reorder_level (numeric, optional)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints
- (shop_id, sku) unique
- unit immutable after first transaction (enforced by policy/trigger)

### Inventory
- id (uuid, pk)
- variant_id (uuid, fk → ProductVariant.id)
- shop_id (uuid, fk → Shop.id)
- location (text, optional; default "default")
- quantity (numeric) — current on-hand
- last_updated (timestamptz)

Constraints
- (shop_id, variant_id, location) unique
- quantity >= 0 unless negative stock explicitly allowed (policy)

### Transaction
- id (uuid, pk)
- shop_id (uuid, fk → Shop.id)
- type (enum: sale, adjustment, inbound, return, transfer, writeoff, donation)
- date (timestamptz)
- user_id (uuid, fk → User.id, nullable for system)
- total_amount (numeric)
- notes (text, optional)

### TransactionItem
- id (uuid, pk)
- transaction_id (uuid, fk → Transaction.id)
- variant_id (uuid, fk → ProductVariant.id)
- quantity (numeric)
- unit_price (numeric)
- line_total (numeric)

Constraints
- quantity > 0 for outbound/inbound as appropriate

## Relationships
- Shop 1—N User, Category, Product, ProductVariant, Inventory, Transaction
- Product 1—N ProductVariant
- Transaction 1—N TransactionItem

## Identity & Uniqueness Rules
- All data scoped by shop_id for multi-tenancy
- SKU uniqueness within a shop
- Variant attributes are advisory and not unique by themselves

## Lifecycle & State
- ProductVariant.unit immutable post-first-transaction
- Inventory.quantity adjusted via Transaction records (source of truth)

## Validation Rules
- Reorder alerts when Inventory.quantity < ProductVariant.reorder_level
- Prohibit checkout while offline

## Notes
- Barcodes may exist at product or variant level depending on operational needs; prefer variant-level for POS.
