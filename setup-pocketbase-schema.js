#!/usr/bin/env node

/**
 * Simplified PocketBase Schema Setup
 * Creates collections one field at a time to avoid validation issues
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

async function setupSchema() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: node setup-pocketbase-schema.js <admin-email> <admin-password>');
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
        const existingCollections = await pb.collections.getFullList();
        const existingNames = existingCollections.map(c => c.name);

        const timelinesFields = [
            { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 1, maxSelect: 1 } },
            { name: 'title', type: 'text', required: true },
            { name: 'content', type: 'editor', required: true, options: { convertURLs: false } },
            { name: 'style', type: 'text' },
            { name: 'slug', type: 'text' },
            { name: 'public', type: 'bool' },
            { name: 'viewCount', type: 'number', options: { min: 0 } },
        ];

        const flashcardFields = [
            { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, minSelect: 1, maxSelect: 1 } },
            { name: 'card_id', type: 'text', required: true },
            { name: 'question', type: 'text', required: true },
            { name: 'answer', type: 'text', required: true },
            { name: 'ease_factor', type: 'number', options: { min: 1.3 } },
            { name: 'interval', type: 'number', options: { min: 0 } },
            { name: 'repetitions', type: 'number', options: { min: 0 } },
            { name: 'next_review', type: 'date' }
        ];

        const learningCacheFields = [
            { name: 'topic', type: 'text', required: true },
            { name: 'mode', type: 'text', required: true },
            { name: 'content', type: 'editor', required: true, options: { convertURLs: false } }
        ];

        // Create or update timelines
        if (!existingNames.includes('timelines')) {
            console.log('📝 Creating timelines collection...');
            await pb.collections.create({
                name: 'timelines',
                type: 'base',
                fields: timelinesFields,
                listRule: '@request.auth.id != \"\" && user = @request.auth.id',
                viewRule: '@request.auth.id != \"\" && user = @request.auth.id || public = true',
                createRule: '@request.auth.id != \"\"',
                updateRule: '@request.auth.id != \"\" && user = @request.auth.id',
                deleteRule: '@request.auth.id != \"\" && user = @request.auth.id'
            });
            console.log('✅ timelines collection created');
        } else {
            console.log('⚠️  timelines collection already exists, updating schema...');
            const timelinesCol = existingCollections.find(c => c.name === 'timelines') ||
                await pb.collections.getFirstListItem('name=\"timelines\"');
            await pb.collections.update(timelinesCol.id, {
                fields: timelinesFields,
                listRule: '@request.auth.id != \"\" && user = @request.auth.id',
                viewRule: '@request.auth.id != \"\" && user = @request.auth.id || public = true',
                createRule: '@request.auth.id != \"\"',
                updateRule: '@request.auth.id != \"\" && user = @request.auth.id',
                deleteRule: '@request.auth.id != \"\" && user = @request.auth.id'
            });
            console.log('✅ timelines collection updated');
        }

        // Create or update flashcard_reviews
        if (!existingNames.includes('flashcard_reviews')) {
            console.log('\\n📝 Creating flashcard_reviews collection...');
            await pb.collections.create({
                name: 'flashcard_reviews',
                type: 'base',
                fields: flashcardFields,
                listRule: '@request.auth.id != \"\" && user = @request.auth.id',
                viewRule: '@request.auth.id != \"\" && user = @request.auth.id',
                createRule: '@request.auth.id != \"\"',
                updateRule: '@request.auth.id != \"\" && user = @request.auth.id',
                deleteRule: '@request.auth.id != \"\" && user = @request.auth.id'
            });
            console.log('✅ flashcard_reviews collection created');
        } else {
            console.log('⚠️  flashcard_reviews collection already exists, updating schema...');
            const flashcardCol = existingCollections.find(c => c.name === 'flashcard_reviews') ||
                await pb.collections.getFirstListItem('name=\"flashcard_reviews\"');
            await pb.collections.update(flashcardCol.id, {
                fields: flashcardFields,
                listRule: '@request.auth.id != \"\" && user = @request.auth.id',
                viewRule: '@request.auth.id != \"\" && user = @request.auth.id',
                createRule: '@request.auth.id != \"\"',
                updateRule: '@request.auth.id != \"\" && user = @request.auth.id',
                deleteRule: '@request.auth.id != \"\" && user = @request.auth.id'
            });
            console.log('✅ flashcard_reviews collection updated');
        }

        // Create or update learning_cache
        if (!existingNames.includes('learning_cache')) {
            console.log('\\n📝 Creating learning_cache collection...');
            await pb.collections.create({
                name: 'learning_cache',
                type: 'base',
                fields: learningCacheFields
            });
            console.log('✅ learning_cache collection created');
        } else {
            console.log('⚠️  learning_cache collection already exists, updating schema...');
            const learningCol = existingCollections.find(c => c.name === 'learning_cache') ||
                await pb.collections.getFirstListItem('name=\"learning_cache\"');
            await pb.collections.update(learningCol.id, { fields: learningCacheFields });
            console.log('✅ learning_cache collection updated');
        }

        console.log('\n🎉 PocketBase schema setup complete!');
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
