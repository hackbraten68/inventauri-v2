/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = new Collection({
      id: 'profiles',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      name: 'profiles',
      type: 'base',
      system: false,
      schema: [
        {
          system: false,
          id: 'shopId',
          name: 'shopId',
          type: 'text',
          required: true
        },
        {
          system: false,
          id: 'userShopId',
          name: 'userShopId',
          type: 'text',
          required: true
        },
        {
          system: false,
          id: 'role',
          name: 'role',
          type: 'select',
          options: {
            maxSelect: 1,
            values: ['owner', 'manager', 'staff']
          },
          required: true
        }
      ],
      indexes: ['CREATE UNIQUE INDEX `idx_shop_user` ON `profiles` (`userShopId`)']
    });

    dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId('profiles');
    if (collection) {
      dao.deleteCollection(collection);
    }
  }
);
