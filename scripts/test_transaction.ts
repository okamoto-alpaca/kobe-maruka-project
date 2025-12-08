import * as admin from 'firebase-admin';
import { Supply, SupplyStatus, Allocation } from '../types/schema';
import { v4 as uuidv4 } from 'uuid';

// --- Safety Lock ---
if (!process.env.FIRESTORE_EMULATOR_HOST) {
    console.error("\x1b[31m[FATAL] FIRESTORE_EMULATOR_HOST is not set. Use 'firebase emulators:exec' or set the env var.\x1b[0m");
    process.exit(1);
}

// Initialize Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'kobe-maruka-project-dev',
    });
}

const db = admin.firestore();

/**
 * Transactional Allocation Function
 */
async function allocateStock(supplyId: string, customerName: string, requestQuantity: number) {
    return db.runTransaction(async (transaction) => {
        const supplyRef = db.collection('supplies').doc(supplyId);
        const supplyDoc = await transaction.get(supplyRef);

        if (!supplyDoc.exists) {
            throw new Error("Supply not found");
        }

        const supplyData = supplyDoc.data() as Supply;
        const currentQty = supplyData.currentQuantity;

        if (currentQty < requestQuantity) {
            throw new Error("Inventory Shortage");
        }

        const newQty = currentQty - requestQuantity;

        // 1. Update Supply
        transaction.update(supplyRef, { currentQuantity: newQty });

        // 2. Create Allocation
        const allocationRef = db.collection('allocations').doc();
        const allocation: Allocation = {
            id: allocationRef.id,
            supplyId: supplyId,
            customerName: customerName,
            allocatedQuantity: requestQuantity,
            allocatedAt: admin.firestore.Timestamp.now(),
        };
        transaction.set(allocationRef, allocation);

        return { newQty, allocationId: allocationRef.id };
    });
}

async function main() {
    console.log("--- Starting Transaction & Concurrency Test ---");

    try {
        // --- 1. Setup ---
        const supplyId = "test_supply_001";
        const initialQty = 10;
        console.log(`\n[Setup] Creating supply ${supplyId} with Qty: ${initialQty}`);

        const supplyData: Supply = {
            id: supplyId,
            faxId: "fax_test_001",
            status: SupplyStatus.PENDING,
            productName: "Stress Test Product",
            initialQuantity: initialQty,
            currentQuantity: initialQty,
            createdAt: admin.firestore.Timestamp.now(),
        };

        await db.collection('supplies').doc(supplyId).set(supplyData);

        // --- 2. Attack (Concurrency Stress Test) ---
        console.log("\n[Attack] Launching 5 concurrent requests (Qty: 3 each)...");
        // Total Request: 15, Available: 10. Expected: 3 Success, 2 Fail.

        const requests = [1, 2, 3, 4, 5].map((i) =>
            allocateStock(supplyId, `Customer_${i}`, 3)
                .then((res) => ({ result: "success", id: i, ...res }))
                .catch((e) => ({ result: "failed", id: i, error: e.message }))
        );

        const results = await Promise.all(requests);

        // --- 3. Validation ---
        console.log("\n[Validation] Analyzing results...");

        const successes = results.filter(r => r.result === "success");
        const failures = results.filter(r => r.result === "failed");

        console.log(`Successes: ${successes.length} (Expected: 3)`);
        console.log(`Failures:  ${failures.length} (Expected: 2)`);

        if (successes.length !== 3 || failures.length !== 2) {
            console.error("\x1b[31m[FAIL] Unexpected success/failure count.\x1b[0m");
            console.log(results);
            process.exit(1);
        }

        // Verify Final Stock
        const finalDoc = await db.collection('supplies').doc(supplyId).get();
        const finalData = finalDoc.data() as Supply;
        console.log(`Final Quantity: ${finalData.currentQuantity} (Expected: 1)`);

        if (finalData.currentQuantity !== 1) {
            console.error(`\x1b[31m[FAIL] Final quantity mismatch. Got ${finalData.currentQuantity}, expected 1.\x1b[0m`);
            process.exit(1);
        }

        // Verify Allocations Count
        const allocSnap = await db.collection('allocations').where('supplyId', '==', supplyId).get();
        console.log(`Total Allocations Created: ${allocSnap.size} (Expected: 3)`);

        if (allocSnap.size !== 3) {
            console.error(`\x1b[31m[FAIL] Allocation document count mismatch.\x1b[0m`);
            process.exit(1);
        }

        console.log("\x1b[32m[SUCCESS] Concurrency Control Verified. No Overselling.\x1b[0m");

    } catch (error) {
        console.error("\x1b[31m[FATAL] Error during test\x1b[0m", error);
        process.exit(1);
    }
}

main();
