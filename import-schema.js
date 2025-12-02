/* eslint-env node */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

async function importSchema() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: node import-schema.js <admin-email> <admin-password>');
        process.exit(1);
    }

    const [email, password] = args;

    try {
        // 1. Authenticate
        console.log('🔐 Authenticating as admin...');
        const authResponse = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: email, password: password })
        });

        if (!authResponse.ok) {
            throw new Error(`Authentication failed: ${authResponse.statusText}`);
        }

        const authData = await authResponse.json();
        const token = authData.token;
        console.log('✅ Authenticated\n');

        // 1.5 Get actual users collection ID
        console.log('🔍 Fetching users collection ID...');
        let usersCollectionId = '_pb_users_auth_';
        try {
            const usersRes = await fetch(`${POCKETBASE_URL}/api/collections/users`, {
                headers: { 'Authorization': token }
            });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                usersCollectionId = usersData.id;
                console.log(`✅ Found users collection ID: ${usersCollectionId}`);
            } else {
                console.log('⚠️  Could not fetch users collection ID, using alias.');
            }
        } catch (e) {
            console.log('⚠️  Error fetching users collection ID:', e.message);
        }

        // 2. Read schema file
        const schemaPath = path.join(__dirname, 'pocketbase-schema.json');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        const collections = JSON.parse(schemaContent);

        console.log(`📖 Read schema for ${collections.length} collections`);

        // 3. Create collections one by one
        for (const collection of collections) {
            console.log(`🚀 Creating collection: ${collection.name}...`);

            // We need to remove 'id', 'created', 'updated' system fields if they exist
            const { id: _id, created: _created, updated: _updated, system: _system, ...data } = collection;

            // Separate rules from data
            const rules = {
                listRule: data.listRule,
                viewRule: data.viewRule,
                createRule: data.createRule,
                updateRule: data.updateRule,
                deleteRule: data.deleteRule,
            };

            // Prepare initial creation data (no rules yet)
            const initialData = {
                name: data.name,
                type: data.type,
                system: false,
                // Use 'fields' property as confirmed by test
                fields: []
            };

            // Process fields from 'schema' in JSON to 'fields' for API
            if (data.schema && Array.isArray(data.schema)) {
                initialData.fields = data.schema.map(field => {
                    const { id: _fieldId, ...fieldData } = field;

                    // Fix relation fields
                    if (field.type === 'relation' && field.options && field.options.collectionId) {
                        // Ensure collectionId is correct
                        if (field.options.collectionId === '_pb_users_auth_') {
                            fieldData.options = { ...field.options, collectionId: usersCollectionId };
                        }
                    }
                    return fieldData;
                });
            }

            // Check if collection exists
            let collectionId;
            try {
                const checkRes = await fetch(`${POCKETBASE_URL}/api/collections/${collection.name}`, {
                    headers: { 'Authorization': token }
                });
                if (checkRes.ok) {
                    console.log(`⚠️  Collection ${collection.name} already exists. Updating schema...`);
                    const existing = await checkRes.json();
                    collectionId = existing.id;
                }
            } catch (e) {
                console.warn(`⚠️  Could not check existing ${collection.name}:`, e.message);
            }

            if (!collectionId) {
                // Create new collection
                if (collection.name === 'timelines') {
                    console.log('DEBUG: Timelines payload:', JSON.stringify(initialData, null, 2));
                }

                const createResponse = await fetch(`${POCKETBASE_URL}/api/collections`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(initialData)
                });

                if (!createResponse.ok) {
                    const err = await createResponse.json();
                    console.error(`❌ Failed to create ${collection.name}:`, JSON.stringify(err, null, 2));
                    continue;
                }

                const createdCol = await createResponse.json();
                collectionId = createdCol.id;
                console.log(`✅ Created ${collection.name} (without rules)`);
            } else {
                // Update existing collection schema
                // For update, we also use 'fields'
                const updateData = { fields: initialData.fields };

                const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/${collectionId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(updateData)
                });

                if (!updateResponse.ok) {
                    const err = await updateResponse.json();
                    console.error(`❌ Failed to update schema for ${collection.name}:`, JSON.stringify(err, null, 2));
                } else {
                    console.log(`✅ Updated schema for ${collection.name}`);
                }
            }

            // Now update with rules
            console.log(`🔄 Updating rules for ${collection.name}...`);
            const rulesResponse = await fetch(`${POCKETBASE_URL}/api/collections/${collectionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(rules)
            });

            if (!rulesResponse.ok) {
                const err = await rulesResponse.json();
                console.error(`❌ Failed to update rules for ${collection.name}:`, JSON.stringify(err, null, 2));
            } else {
                console.log(`✅ Updated rules for ${collection.name}`);
            }
        }

        console.log('\n✅ Import process finished!');

    } catch (error) {
        console.error('\n❌ Error importing schema:', error);
        process.exit(1);
    }
}

importSchema();
