import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({

  // --------------------------------------------------------
  // SHOP
  // --------------------------------------------------------
  Shop: a.model({
    id: a.id(),
    name: a.string(),
    slug: a.string(),

    warehouses: a.hasMany("Warehouse", "shopId"),
    items: a.hasMany("Item", "shopId"),
    stockLevels: a.hasMany("ItemStockLevel", "shopId"),
    stockTransactions: a.hasMany("StockTransaction", "shopId"),
    users: a.hasMany("UserShop", "shopId"),
  }).authorization((allow) => [allow.authenticated("identityPool")]),

  // --------------------------------------------------------
  // WAREHOUSE
  // --------------------------------------------------------
  Warehouse: a.model({
    id: a.id(),
    shopId: a.id(),
    name: a.string(),
    slug: a.string(),
    type: a.string(),

    shop: a.belongsTo("Shop", "shopId"),
    stockLevels: a.hasMany("ItemStockLevel", "warehouseId"),
    incoming: a.hasMany("StockTransaction", "targetWarehouseId"),
  }).authorization((allow) => [allow.authenticated("identityPool")]),

  // --------------------------------------------------------
  // ITEM
  // --------------------------------------------------------
  Item: a.model({
    id: a.id(),
    shopId: a.id(),
    sku: a.string(),
    name: a.string(),
    unit: a.string(),

    shop: a.belongsTo("Shop", "shopId"),
    stockLevels: a.hasMany("ItemStockLevel", "itemId"),
    transactions: a.hasMany("StockTransaction", "itemId"),
  }).authorization((allow) => [allow.authenticated("identityPool")]),

  // --------------------------------------------------------
  // ITEM STOCK LEVEL
  // --------------------------------------------------------
  ItemStockLevel: a.model({
    id: a.id(),
    warehouseId: a.id(),
    itemId: a.id(),
    shopId: a.id(),
    quantityOnHand: a.float(),

    warehouse: a.belongsTo("Warehouse", "warehouseId"),
    item: a.belongsTo("Item", "itemId"),
    shop: a.belongsTo("Shop", "shopId"),
  }).authorization((allow) => [allow.authenticated("identityPool")]),

  // --------------------------------------------------------
  // STOCK TRANSACTION
  // --------------------------------------------------------
  StockTransaction: a.model({
    id: a.id(),
    itemId: a.id(),
    shopId: a.id(),
    transactionType: a.string(),
    quantity: a.float(),
    reference: a.string(),
    targetWarehouseId: a.id(),

    item: a.belongsTo("Item", "itemId"),
    shop: a.belongsTo("Shop", "shopId"),
    targetWarehouse: a.belongsTo("Warehouse", "targetWarehouseId"),
  }).authorization((allow) => [allow.authenticated("identityPool")]),

  // --------------------------------------------------------
  // USER ↔ SHOP
  // --------------------------------------------------------
  UserShop: a.model({
    id: a.id(),
    userId: a.string(),
    shopId: a.id(),
    role: a.string(),

    shop: a.belongsTo("Shop", "shopId"),
  }).authorization((allow) => [allow.authenticated("identityPool")]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "identityPool",
  },
});
