import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { documentId, userId, userName } = body;

        if (!documentId || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.runTransaction(async (transaction) => {
            const docRef = db.collection('fax_documents').doc(documentId);
            const docSnap = await transaction.get(docRef);

            if (!docSnap.exists) {
                throw new Error("Document not found");
            }

            const data = docSnap.data();
            console.log(`[Claim] Doc: ${documentId}, Current Assignee: ${data?.assigneeId}, Request User: ${userId}`);

            // Allow if unassigned OR if already assigned to the same user (idempotent)
            if (data?.assigneeId && data.assigneeId !== userId) {
                throw new Error("このFAXは既に他の担当者が作業中です");
            }

            // READ 2: Get Children (Must be done before any writes)
            const detailsQuery = db.collection('fax_details').where('parentId', '==', documentId);
            const detailsSnap = await transaction.get(detailsQuery);

            // WRITE 1: Update Parent
            transaction.update(docRef, {
                assigneeId: userId,
                assigneeName: userName || 'Unknown'
            });

            // WRITE 2: Update Children
            detailsSnap.forEach(detailDoc => {
                transaction.update(detailDoc.ref, { assigneeId: userId });
            });

            // WRITE 3: Log Audit
            const auditRef = db.collection('audit_logs').doc();
            transaction.set(auditRef, {
                action: 'claim',
                documentId,
                performedBy: userId,
                timestamp: Timestamp.now()
            });
        });

        return NextResponse.json({ status: "success" });

    } catch (error: any) {
        console.error("Claim API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
