#!/usr/bin/env node

/* eslint-env node */

/**
 * Check and display PocketBase collection schemas
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

async function checkSchema() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: node check-schema.js <admin-email> <admin-password>');
        process.exit(1);
    }

    const [email, password] = args;
    const pb = new PocketBase(POCKETBASE_URL);

    try {
        // Authenticate as admin
        await pb.admins.authWithPassword(email, password);

        // Get all collections
        const collections = await pb.collections.getFullList();

        const targetCollections = collections.filter(c =>
            ['timelines', 'flashcard_reviews', 'learning_cache'].includes(c.name)
        );

        console.log('\n📊 Collection Schemas:\n');

        for (const col of targetCollections) {
            console.log(`\n📁 ${col.name} (ID: ${col.id})`);
            console.log(`   Type: ${col.type}`);
            const fields = col.fields || col.schema || [];
            console.log(`   Fields: ${fields.length}`);

            if (fields.length > 0) {
                fields.forEach(field => {
                    console.log(`     - ${field.name} (${field.type})${field.required ? ' *required' : ''}`);
                });
            } else {
                console.log('     ⚠️  NO FIELDS DEFINED!');
            }

            console.log(`   Rules:`);
            console.log(`     List: ${col.listRule || 'null'}`);
            console.log(`     View: ${col.viewRule || 'null'}`);
            console.log(`     Create: ${col.createRule || 'null'}`);
            console.log(`     Update: ${col.updateRule || 'null'}`);
            console.log(`     Delete: ${col.deleteRule || 'null'}`);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

checkSchema();
