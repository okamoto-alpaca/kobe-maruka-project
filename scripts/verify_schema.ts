import * as admin from 'firebase-admin';
import { Supply, SupplyStatus, Allocation } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

// --- 1. Safety Lock ---
if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error("\x1b[31m[FATAL] FIRESTORE_EMULATOR_HOST is not set. Use 'firebase emulators:exec' or set the env var.\x1b[0m");
    process.exit(1);
}

// Initialize Admin SDK
admin.initializeApp({
    projectId: 'kobe-maruka-project-dev', // Dummy project ID for emulator
});

const db = admin.firestore();

async function main() {
    console.log("Starting verification...");

    try {
        // --- Step 1: Ingest ---
        console.log("\n--- Step 1: Ingest ---");
        const supplyId = uuidv4();
        const initialQty = 100;
        const supplyData: Supply = {
            id: supplyId,
            faxId: 'fax-001',
            status: SupplyStatus.PENDING,
            productName: 'さぬき姫',
            initialQuantity: initialQty,
            currentQuantity: initialQty,
            createdAt: admin.firestore.Timestamp.now(),
        };

        await db.collection('supplies').doc(supplyId).set(supplyData);
        console.log(`Supply created: ${supplyId}`);

        const supplySnap = await db.collection('supplies').doc(supplyId).get();
        const fetchedSupply = supplySnap.data() as Supply;

        if (fetchedSupply.currentQuantity === 100) {
            console.log("ASSERT: currentQuantity === 100 [OK]");
        } else {
            throw new Error(`ASSERT FAILED: currentQuantity is ${fetchedSupply.currentQuantity}`);
        }

        // --- Step 2: Structure Check ---
        console.log("\n--- Step 2: Structure Check ---");
        const allocationsData = [
            { customer: '取引先A', qty: 20 },
            { customer: '取引先B', qty: 30 },
            { customer: '取引先C', qty: 50 },
        ];

        for (const item of allocationsData) {
            const allocation: Allocation = {
                supplyId: supplyId,
                customerName: item.customer,
                allocatedQuantity: item.qty,
                allocatedAt: admin.firestore.Timestamp.now(),
            };
            await db.collection('allocations').add(allocation);
            console.log(`Allocation added for ${item.customer}: ${item.qty}`);
        }

        // --- Step 3: Consistency Proof ---
        console.log("\n--- Step 3: Consistency Proof ---");
        const allocationsSnapshot = await db.collection('allocations')
            .where('supplyId', '==', supplyId)
            .get();

        console.log(`Fetched ${allocationsSnapshot.size} allocations.`);

        if (allocationsSnapshot.size !== 3) {
            throw new Error(`ASSERT FAILED: Expected 3 allocations, got ${allocationsSnapshot.size}`);
        }

        let totalAllocated = 0;
        allocationsSnapshot.forEach(doc => {
            const data = doc.data() as Allocation;
            totalAllocated += data.allocatedQuantity;
        });

        console.log(`Total Allocated: ${totalAllocated}`);
        console.log(`Initial Quantity: ${fetchedSupply.initialQuantity}`);

        if (totalAllocated === fetchedSupply.initialQuantity) {
            console.log("\x1b[32m[SUCCESS] Consistency Verified\x1b[0m");
        } else {
            console.error("\x1b[31m[FATAL] Data Mismatch\x1b[0m");
            process.exit(1);
        }

    } catch (error) {
        console.error("\x1b[31m[ERROR] Verification failed:\x1b[0m", error);
        process.exit(1);
    }
}

main();
