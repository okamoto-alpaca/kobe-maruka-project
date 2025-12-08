import * as admin from 'firebase-admin';
import { FaxDocument, FaxDetail } from '../web/src/types/schema';
import { v4 as uuidv4 } from 'uuid';

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

async function verifyV3Schema() {
    console.log("Starting v3 Schema Verification...");

    try {
        // 1. Create FaxDocument (Parent)
        const docId = uuidv4();
        const faxDoc: FaxDocument = {
            id: docId,
            storagePath: 'fax/2025-12-06/test_doc.pdf',
            status: 'received',
            uploadTimestamp: admin.firestore.Timestamp.now(),
            shippingDate: null,
            originName: null,
            originCode: null,
            slipNumber: null,
            reporter: null,
            transporter: null
        };

        await db.collection('fax_documents').doc(docId).set(faxDoc);
        console.log(`[SUCCESS] Created FaxDocument: ${docId}`);

        // 2. Create FaxDetail (Child)
        const detailId = uuidv4();
        const faxDetail: FaxDetail = {
            id: detailId,
            parentId: docId,
            productName: 'Test Product',
            grade: 'A',
            class: 'L',
            quantity: 50,
            remarks: 'Test Remark',
            unitPrice: null,
            isAllocated: false
        };

        await db.collection('fax_details').doc(detailId).set(faxDetail);
        console.log(`[SUCCESS] Created FaxDetail: ${detailId}`);

        // 3. Verify Data
        const docSnap = await db.collection('fax_documents').doc(docId).get();
        const detailSnap = await db.collection('fax_details').doc(detailId).get();

        if (docSnap.exists && detailSnap.exists) {
            const fetchedDetail = detailSnap.data() as FaxDetail;
            if (fetchedDetail.parentId === docId) {
                console.log("[SUCCESS] Parent-Child Link Verified");
            } else {
                throw new Error("Parent ID mismatch");
            }
        } else {
            throw new Error("Document or Detail not found");
        }

    } catch (error) {
        console.error("[ERROR] Verification Failed:", error);
        process.exit(1);
    }
}

verifyV3Schema();
