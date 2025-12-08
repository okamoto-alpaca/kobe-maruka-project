import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { documentId, action, targetUserId, userId } = body;

        if (!documentId || !action || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (action === 'transfer' && !targetUserId) {
            return NextResponse.json({ error: "Target user required for transfer" }, { status: 400 });
        }

        await db.runTransaction(async (transaction) => {
            const docRef = db.collection('fax_documents').doc(documentId);
            const detailsQuery = db.collection('fax_details').where('parentId', '==', documentId);

            // 1. READS
            const docSnap = await transaction.get(docRef);
            const detailsSnap = await transaction.get(detailsQuery);

            if (!docSnap.exists) {
                throw new Error("Document not found");
            }

            // 2. WRITES
            const newAssigneeId = action === 'release' ? null : targetUserId;

            // Update Parent
            transaction.update(docRef, { assigneeId: newAssigneeId });

            // Update Children
            detailsSnap.forEach(detailDoc => {
                transaction.update(detailDoc.ref, { assigneeId: newAssigneeId });
            });

            // Log Audit
            const auditRef = db.collection('audit_logs').doc();
            transaction.set(auditRef, {
                action: `assignment_${action}`,
                documentId,
                performedBy: userId,
                targetUserId: newAssigneeId,
                timestamp: Timestamp.now()
            });
        });

        return NextResponse.json({ status: "success" });

    } catch (error: any) {
        console.error("Assign API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
