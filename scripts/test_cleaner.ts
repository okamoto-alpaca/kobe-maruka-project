import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.STORAGE_EMULATOR_HOST = 'http://127.0.0.1:9199';

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'kobe-maruka-alpaca',
        storageBucket: 'kobe-maruka-alpaca.appspot.com'
    });
}

const db = admin.firestore();

async function testCleaner() {
    console.log('--- Starting Cleaner Test ---');

    // 1. Create a dummy document
    const docId = uuidv4();
    await db.collection('fax_documents').doc(docId).set({
        id: docId,
        status: 'received',
        uploadTimestamp: admin.firestore.Timestamp.now(),
        storagePath: 'test/path.jpg'
    });
    console.log(`Created Doc: ${docId}`);

    // 2. Test Create Detail
    const detailId = uuidv4();
    await db.collection('fax_details').doc(detailId).set({
        id: detailId,
        parentId: docId,
        productName: 'Test Product',
        quantity: 10,
        allocationStatus: 'none'
    });
    console.log(`Created Detail: ${detailId}`);

    // 3. Test Update Detail (Simulate PUT)
    await db.collection('fax_details').doc(detailId).update({
        quantity: 20,
        grade: 'A'
    });
    const updated = await db.collection('fax_details').doc(detailId).get();
    if (updated.data()?.quantity === 20 && updated.data()?.grade === 'A') {
        console.log('Update Detail: SUCCESS');
    } else {
        console.error('Update Detail: FAILED');
    }

    // 4. Test Trash Document (Simulate POST /trash)
    await db.collection('fax_documents').doc(docId).update({
        status: 'trash'
    });
    const trashed = await db.collection('fax_documents').doc(docId).get();
    if (trashed.data()?.status === 'trash') {
        console.log('Trash Document: SUCCESS');
    } else {
        console.error('Trash Document: FAILED');
    }

    // 5. Test Delete Detail (Simulate DELETE)
    await db.collection('fax_details').doc(detailId).delete();
    const deleted = await db.collection('fax_details').doc(detailId).get();
    if (!deleted.exists) {
        console.log('Delete Detail: SUCCESS');
    } else {
        console.error('Delete Detail: FAILED');
    }

    console.log('--- Test Complete ---');
}

testCleaner().catch(console.error);
