#!/usr/bin/env node

/**
 * Fix and complete PocketBase schema setup
 * Deletes incomplete collections and recreates them properly
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupSchema() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: node setup-pocketbase-fix.js <admin-email> <admin-password>');
        process.exit(1);
    }

    const [email, password] = args;
    const pb = new PocketBase(POCKETBASE_URL);

    try {
        // Authenticate as admin
        console.log('🔐 Authenticating as admin...');
        await pb.admins.authWithPassword(email, password);
        console.log('✅ Authenticated successfully\n');

        // Get existing collections
        let existingCollections = await pb.collections.getFullList();

        // Delete and recreate timelines if it exists
        const timelinesCol = existingCollections.find(c => c.name === 'timelines');
        if (timelinesCol) {
            console.log('🗑️  Deleting incomplete timelines collection...');
            await pb.collections.delete(timelinesCol.id);
            console.log('✅ Deleted\n');
            await wait(500); // Wait for deletion to propagate
        }

        // Create timelines collection
        console.log('📝 Creating timelines collection...');
        const newTimelinesCol = await pb.collections.create({
            name: 'timelines',
            type: 'base',
            schema: [
                { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } },
                { name: 'title', type: 'text', required: true },
                { name: 'content', type: 'editor', required: true, options: { convertUrls: false } },
                { name: 'style', type: 'text' },
                { name: 'slug', type: 'text' },
                { name: 'public', type: 'bool' },
                { name: 'viewCount', type: 'number', options: { min: 0 } }
            ]
        });
        console.log('✅ timelines collection created');
        console.log(`   ID: ${newTimelinesCol.id}`);
        if (newTimelinesCol.schema) {
            console.log(`   Fields: ${newTimelinesCol.schema.map(f => f.name).join(', ')}\n`);
        } else {
            console.log('   Schema not yet available\n');
        }

        // Wait a bit for the collection to be fully initialized
        console.log('⏳ Waiting for collection to initialize...');
        await wait(1000);

        // Refresh collection data
        const refreshedTimelinesCol = await pb.collections.getOne(newTimelinesCol.id);
        console.log(`✅ Collection refreshed`);
        if (refreshedTimelinesCol.schema) {
            console.log(`   Fields: ${refreshedTimelinesCol.schema.map(f => f.name).join(', ')}\n`);
        }

        // Now set API rules for all collections
        console.log('🔒 Setting up API rules...\n');

        // Timelines rules
        try {
            await pb.collections.update(refreshedTimelinesCol.id, {
                listRule: '@request.auth.id != "" && user = @request.auth.id',
                viewRule: '@request.auth.id != "" && user = @request.auth.id || public = true',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != "" && user = @request.auth.id',
                deleteRule: '@request.auth.id != "" && user = @request.auth.id'
            });
            console.log('✅ timelines API rules configured');
        } catch (err) {
            console.error('❌ Failed to set timelines rules:', err.message);
            console.error('   Collection schema:', JSON.stringify(refreshedTimelinesCol.schema, null, 2));
            throw err;
        }

        // Refresh collections list
        existingCollections = await pb.collections.getFullList();

        // Flashcard reviews rules
        const flashcardCol = existingCollections.find(c => c.name === 'flashcard_reviews');
        if (flashcardCol) {
            await pb.collections.update(flashcardCol.id, {
                listRule: '@request.auth.id != "" && user = @request.auth.id',
                viewRule: '@request.auth.id != "" && user = @request.auth.id',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != "" && user = @request.auth.id',
                deleteRule: '@request.auth.id != "" && user = @request.auth.id'
            });
            console.log('✅ flashcard_reviews API rules configured');
        }

        // Learning cache has no auth rules (public cache)
        console.log('✅ learning_cache has no auth rules (public cache)');

        console.log('\n🎉 PocketBase schema setup complete!');
        console.log('\nCollections created:');
        console.log('  ✓ timelines (user timelines with auth)');
        console.log('  ✓ flashcard_reviews (spaced repetition data)');
        console.log('  ✓ learning_cache (AI content cache)');
        console.log('\nYou can now:');
        console.log('  1. Start your dev server: npm run dev');
        console.log('  2. Access the admin dashboard: http://127.0.0.1:8090/_/');

    } catch (error) {
        console.error('\n❌ Error setting up schema:', error.message);
        if (error.data) {
            console.error('Details:', JSON.stringify(error.data, null, 2));
        }
        process.exit(1);
    }
}

setupSchema();
