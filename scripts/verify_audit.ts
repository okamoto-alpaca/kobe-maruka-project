import * as admin from 'firebase-admin';

// Set emulator environment variables
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'demo-no-project';

// Initialize Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'demo-no-project',
    });
}

const db = admin.firestore();

async function verifyAudit() {
    console.log("Fetching latest allocation...");

    const snapshot = await db.collection('allocations')
        .orderBy('allocatedAt', 'desc')
        .limit(1)
        .get();

    if (snapshot.empty) {
        console.log("\x1b[31m[ERROR] No allocations found.\x1b[0m");

        // Debug: List all collections
        const collections = await db.listCollections();
        console.log("Available Collections:", collections.map(c => c.id));

        if (collections.length > 0) {
            const supplies = await db.collection('supplies').get();
            console.log(`Supplies count: ${supplies.size}`);
        }

        console.log("Please restart the server and perform an allocation again.");
        process.exit(1);
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    console.log("\n--- Latest Allocation Record ---");
    console.log(`ID: ${doc.id}`);
    console.log(`Customer: ${data.customerName}`);
    console.log(`Quantity: ${data.allocatedQuantity}`);

    if (data.executedBy) {
        console.log("\x1b[32m[SUCCESS] Audit Trail Found:\x1b[0m");
        console.log(JSON.stringify(data.executedBy, null, 2));
    } else {
        console.error("\x1b[31m[FAIL] 'executedBy' field is MISSING.\x1b[0m");
    }
}

verifyAudit();
