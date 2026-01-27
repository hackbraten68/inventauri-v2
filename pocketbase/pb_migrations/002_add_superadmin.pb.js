/// <reference path="../pb_data/types.d.ts" />
migrate(
    (db) => {
        const dao = new Dao(db);
        const collection = dao.findCollectionByNameOrId('profiles');

        // Find the role field and add 'superadmin'
        const roleField = collection.schema.fields.find(f => f.name === 'role');
        if (roleField) {
            // Note: we're using the existing field but extending its allowed values
            roleField.options.values = ['superadmin', 'owner', 'manager', 'staff'];
        }

        return dao.saveCollection(collection);
    },
    (db) => {
        // Reverse is not strictly needed for this minor change but good practice
        const dao = new Dao(db);
        const collection = dao.findCollectionByNameOrId('profiles');
        const roleField = collection.schema.fields.find(f => f.name === 'role');
        if (roleField) {
            roleField.options.values = ['owner', 'manager', 'staff'];
        }
        return dao.saveCollection(collection);
    }
);
