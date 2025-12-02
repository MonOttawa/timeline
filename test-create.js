/* eslint-env node */
import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

async function createSimple() {
    const pb = new PocketBase(POCKETBASE_URL);
    await pb.admins.authWithPassword('mondy.lim@gmail.com', 'Testing1234');

    try {
        console.log('Creating timelines...');
        const col = await pb.collections.create({
            name: 'timelines',
            type: 'base',
            fields: [
                { name: 'title', type: 'text' }
            ]
        });
        console.log('Created:', col);
    } catch (e) {
        console.error(e);
    }
}

createSimple();
