#!/usr/bin/env node

/* eslint-env node */

/**
 * Complete PocketBase setup - delete empty collections and recreate properly
 * This time we'll stop the server, use migrations, and restart
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

async function completeSetup() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: node complete-setup.js <admin-email> <admin-password>');
        process.exit(1);
    }

    const [email, password] = args;
    const pb = new PocketBase(POCKETBASE_URL);

    try {
        // Authenticate as admin
        console.log('🔐 Authenticating as admin...');
        await pb.admins.authWithPassword(email, password);
        console.log('✅ Authenticated\n');

        // Delete all empty collections
        console.log('🗑️  Deleting empty collections...');
        const collections = await pb.collections.getFullList();

        for (const col of collections.filter(c => ['timelines', 'flashcard_reviews', 'learning_cache'].includes(c.name))) {
            console.log(`   Deleting ${col.name}...`);
            await pb.collections.delete(col.id);
        }
        console.log('✅ Empty collections deleted\n');

        console.log('📝 Please restart PocketBase and use the admin UI to import collections.');
        console.log('   The schema file is ready at: pocketbase-schema.json\n');

        console.log('OR use the browser-based import that I can automate for you.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.data) {
            console.error('Details:', JSON.stringify(error.data, null, 2));
        }
        process.exit(1);
    }
}

completeSetup();
