// import axios from 'axios';
import * as admin from 'firebase-admin';
// import { FaxDocument, FaxDetail } from '../web/src/types/schema';

// Inline types to avoid ts-node import issues across projects
interface FaxDocument {
    id: string;
    storagePath: string;
    status: 'received' | 'analyzing' | 'ready' | 'error' | 'completed';
    uploadTimestamp: admin.firestore.Timestamp;
    shippingDate: string | null;
    originName: string | null;
    originCode: string | null;
    slipNumber: string | null;
    reporter: string | null;
    transporter: string | null;
    errorMessage?: string;
}

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
const API_URL = 'http://localhost:3000/api/ingest';

async function testIngestV3() {
    console.log("Starting v3 Ingest Verification...");

    try {
        // 1. Send Request (Mock Mode)
        console.log("Sending POST request...");
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: "TEST_IMAGE_DATA" })
        });

        const data = await response.json() as any;
        console.log("API Response:", data);

        if (data.status !== 'success') {
            throw new Error("API returned non-success status");
        }

        const docId = data.documentId;
        console.log(`Document ID: ${docId}`);

        // 2. Verify FaxDocument
        const docSnap = await db.collection('fax_documents').doc(docId).get();
        if (!docSnap.exists) throw new Error("FaxDocument not found in Firestore");

        const docData = docSnap.data() as FaxDocument;
        console.log("FaxDocument Status:", docData.status);

        if (docData.status !== 'completed') {
            throw new Error(`Expected status 'completed', got '${docData.status}'`);
        }
        if (docData.originName !== 'Mock JA') {
            throw new Error("Header data mismatch");
        }

        // 3. Verify FaxDetails
        const detailsSnap = await db.collection('fax_details').where('parentId', '==', docId).get();
        console.log(`Found ${detailsSnap.size} details.`);

        if (detailsSnap.empty) throw new Error("No details found");

        const detail = detailsSnap.docs[0].data() as FaxDetail;
        console.log("Detail[0]:", detail);

        if (detail.grade !== 'A' || detail.class !== 'L') {
            throw new Error("Detail grade/class mismatch");
        }
        if (detail.remarks !== 'Mock Remark') {
            throw new Error("Detail remarks mismatch");
        }

        console.log("[SUCCESS] v3 Ingest Pipeline Verified");

    } catch (error: any) {
        console.error("[ERROR] Verification Failed:", error.message);
        if (error.response) {
            console.error("API Error Data:", error.response.data);
        }
        process.exit(1);
    }
}

testIngestV3();
