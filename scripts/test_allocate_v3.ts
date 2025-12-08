import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Inline types
interface FaxDetail {
    id: string;
    parentId: string;
    productName: string;
    grade: string | null;
    class: string | null;
    quantity: number;
    remarks: string | null;
    unitPrice: number | null;
    isAllocated: boolean;
    allocationId?: string;
}

// Set emulator environment variables
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'demo-no-project';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'demo-no-project',
    });
}

const db = admin.firestore();
const API_URL = 'http://localhost:3000/api/allocate';

async function testAllocateV3() {
    console.log("Starting v3 Allocation Verification...");

    try {
        // 1. Setup: Create a FaxDetail
        const detailId = uuidv4();
        const parentId = `test-parent-${uuidv4()}`;
        const initialDetail: FaxDetail = {
            id: detailId,
            parentId: parentId,
            productName: 'Test Product',
            grade: 'A',
            class: 'L',
            quantity: 100,
            remarks: null,
            unitPrice: null,
            isAllocated: false
        };
        await db.collection('fax_details').doc(detailId).set(initialDetail);
        console.log(`[Setup] Created FaxDetail: ${detailId} (Qty: 100)`);

        // 2. Execute Allocation (Partial: 30)
        console.log("Sending POST request (Allocate 30)...");
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                detailId: detailId,
                customerName: 'Test Customer',
                quantity: 30,
                userId: 'test-user',
                userEmail: 'test@example.com'
            })
        });

        const data = await response.json() as any;
        console.log("API Response:", data);

        if (data.status !== 'success') {
            throw new Error("API returned non-success status");
        }

        // 3. Verify Results
        // A. Check Original Detail (Should be 30 and allocated)
        const updatedDetailSnap = await db.collection('fax_details').doc(detailId).get();
        const updatedDetail = updatedDetailSnap.data() as FaxDetail;

        console.log("Updated Detail:", updatedDetail);

        if (updatedDetail.quantity !== 30) throw new Error(`Expected Qty 30, got ${updatedDetail.quantity}`);
        if (!updatedDetail.isAllocated) throw new Error("Expected isAllocated true");
        if (!updatedDetail.allocationId) throw new Error("Expected allocationId");

        // B. Check New Detail (Should be 70 and unallocated)
        const siblingsSnap = await db.collection('fax_details')
            .where('parentId', '==', parentId)
            .where('isAllocated', '==', false)
            .get();

        if (siblingsSnap.empty) throw new Error("No remaining detail found");
        const remainingDetail = siblingsSnap.docs[0].data() as FaxDetail;

        console.log("Remaining Detail:", remainingDetail);

        if (remainingDetail.quantity !== 70) throw new Error(`Expected Remaining Qty 70, got ${remainingDetail.quantity}`);
        if (remainingDetail.id === detailId) throw new Error("Remaining detail has same ID as original");

        console.log("[SUCCESS] v3 Allocation & Split Verified");

    } catch (error: any) {
        console.error("[ERROR] Verification Failed:", error.message);
        process.exit(1);
    }
}

testAllocateV3();
