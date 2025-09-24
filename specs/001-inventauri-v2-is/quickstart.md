# Quickstart (Phase 1)

This guide helps a non-technical operator self-host and validate core flows.

## Prerequisites
- Docker and Docker Compose installed
- .env configured (see `.env.example`)

## Start Services
```bash
# From repository root
docker compose up -d
```

## Initialize Admin Account
1. Open the app in your browser: http://localhost:4321
2. Register an Owner user with email/password.
3. Create your Shop (name and slug).

## Create Catalog
1. Create a Category (e.g., "Beverages").
2. Create a Product (e.g., "Cola").
3. Add Variants with SKUs (e.g., size: 330ml / 500ml) and set unit per variant.

## Stock Inbound
1. Go to Inventory → Inbound.
2. Add stock for each variant and location.

## Make a Sale (online only)
1. Go to POS.
2. Add items to cart.
3. Checkout.

Expected: Inventory decreases per variant; transaction recorded; dashboard reflects sale.

## Low-Stock Alerts
- Set `reorder_level` on variants.
- View dashboard to see low-stock items.

## Reporting (v1)
- View sales totals by day/week/month.

## Troubleshooting
- If offline, checkout is disabled; try again when online.
- Ensure SKUs are unique per shop.
