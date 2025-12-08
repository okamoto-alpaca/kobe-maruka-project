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
const bucket = admin.storage().bucket();

async function resetAndSeed() {
    console.log('Starting Reset & Seed...');

    // 1. Delete ALL existing documents
    console.log('Deleting old data...');
    const collections = ['fax_documents', 'fax_details'];
    for (const colName of collections) {
        const snapshot = await db.collection(colName).get();
        if (snapshot.empty) continue;

        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Deleted ${snapshot.size} docs from ${colName}`);
    }

    // 2. Upload Dummy Image
    console.log('Uploading seed image...');
    // 1x1 pixel red dot for visibility
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(base64Image, 'base64');
    const filename = `seed_test_${Date.now()}.png`;
    const storagePath = `fax/2025-12-06/${filename}`;

    await bucket.file(storagePath).save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true
    });
    console.log(`Uploaded image to ${storagePath}`);

    // 3. Create New Documents
    console.log('Creating new documents...');
    const docs = [
        {
            id: 'seed-doc-1',
            originName: '東讃営農C(中央)三木町',
            originId: 'origin-1',
            shippingDate: '2025-11-25',
            status: 'completed',
            storagePath: storagePath,
            uploadTimestamp: admin.firestore.Timestamp.now(),
            assigneeId: null,
            assigneeName: null
        },
        {
            id: 'seed-doc-2',
            originName: '香川県農業協同組合',
            originId: 'origin-2',
            shippingDate: '2025-11-25',
            status: 'pending',
            storagePath: storagePath,
            uploadTimestamp: admin.firestore.Timestamp.now(),
            assigneeId: null,
            assigneeName: null
        },
        {
            id: 'seed-doc-3',
            originName: '神戸中央青果',
            originId: 'origin-3',
            shippingDate: '2025-11-26',
            status: 'pending',
            storagePath: storagePath,
            uploadTimestamp: admin.firestore.Timestamp.now(),
            assigneeId: 'user1', // Assigned to user1
            assigneeName: 'User One'
        }
    ];

    for (const docData of docs) {
        await db.collection('fax_documents').doc(docData.id).set(docData);

        // Create dummy details
        const detailId = `detail-${docData.id}-1`;
        await db.collection('fax_details').doc(detailId).set({
            id: detailId,
            parentId: docData.id,
            productName: 'さぬきひめいちご',
            grade: '秀',
            class: 'L',
            quantity: 10,
            allocationStatus: 'none',
            assigneeId: docData.assigneeId,
            createdAt: admin.firestore.Timestamp.now()
        });
    }

    console.log('Reset & Seed Complete!');
}

resetAndSeed().catch(console.error);
