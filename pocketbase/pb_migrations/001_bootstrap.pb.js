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
          id: 'role',
          name: 'role',
          type: 'select',
          options: {
            maxSelect: 1,
            values: ['owner', 'manager', 'staff']
          },
          required: true
        },
        {
          system: false,
          id: 'user',
          name: 'user',
          type: 'relation',
          options: {
            maxSelect: 1,
            minSelect: 1,
            cascadeDelete: true,
            displayFields: [],
            collectionId: '_pb_users_auth_'
          },
          required: true
        }
      ],
      indexes: [
        'CREATE UNIQUE INDEX `idx_profiles_user` ON `profiles` (`user`)'
      ]
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
