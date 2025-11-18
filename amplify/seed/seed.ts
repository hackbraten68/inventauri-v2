// amplify/seed/seed.ts
import { readFile } from "node:fs/promises";
import { Amplify } from "aws-amplify";
import { createAndSignUpUser, getSecret } from "@aws-amplify/seed";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../data/resource";

// ⚠️ Pfad zu deinen Sandbox-Outputs (du nutzt --outputs-out-dir ./amplify-outputs)
const outputs = JSON.parse(
  await readFile(
    new URL("../../amplify-outputs/amplify_outputs.json", import.meta.url),
    "utf8"
  )
);

Amplify.configure(outputs);

const client = generateClient<Schema>();

async function createOnce(model: any, filter: any, data: any) {
  const existing = await model.list({ filter, limit: 1 });
  if (existing.data.length > 0) return existing.data[0];

  const created = await model.create(data);
  if (created.errors?.length) {
    console.error(created.errors);
    throw new Error("Creation failed");
  }
  return created.data;
}

export const seed = async () => {
  // 1) Cognito-User aus Secrets holen
  const username = await getSecret("username");
  const password = await getSecret("password");

  await createAndSignUpUser({
    username,
    password,
    signInAfterCreation: true,
    signInFlow: "Password",
  });

  console.log("✔ Seed Cognito user created:", username);

  // 2) Shop
  const shop = await createOnce(
    client.models.Shop,
    { slug: { eq: "dev-shop" } },
    {
      name: "Inventauri Dev Shop",
      slug: "dev-shop",
    }
  );

  // 3) Warehouses
  const central = await createOnce(
    client.models.Warehouse,
    { slug: { eq: "central" } },
    {
      name: "Central Warehouse",
      slug: "central",
      type: "central",
      shopId: shop.id,
    }
  );

  const pos = await createOnce(
    client.models.Warehouse,
    { slug: { eq: "pos-main" } },
    {
      name: "POS Main",
      slug: "pos-main",
      type: "pos",
      shopId: shop.id,
    }
  );

  // 4) Item
  const cola = await createOnce(
    client.models.Item,
    { sku: { eq: "COLA-330" } },
    {
      sku: "COLA-330",
      name: "Cola 0.33L",
      unit: "bottle",
      shopId: shop.id,
    }
  );

  // 5) Stock Level
  await createOnce(
    client.models.ItemStockLevel,
    {
      warehouseId: { eq: central.id },
      itemId: { eq: cola.id },
    },
    {
      warehouseId: central.id,
      itemId: cola.id,
      shopId: shop.id,
      quantityOnHand: 24,
    }
  );

  // 6) Stock Transaction
  await createOnce(
    client.models.StockTransaction,
    { reference: { eq: "seed-cola-inbound" } },
    {
      itemId: cola.id,
      shopId: shop.id,
      transactionType: "inbound",
      quantity: 24,
      reference: "seed-cola-inbound",
      targetWarehouseId: central.id,
    }
  );

  // 7) User ↔ Shop Mapping (hier: userId = username, kannst du später ändern)
  await createOnce(
    client.models.UserShop,
    {
      userId: { eq: username },
      shopId: { eq: shop.id },
    },
    {
      userId: username,
      shopId: shop.id,
      role: "owner",
    }
  );

  console.log("🎉 Seed completed");
};
