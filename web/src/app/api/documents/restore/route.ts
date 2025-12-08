import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { documentId } = body;

        if (!documentId) {
            return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
        }

        // Restore to 'received' status
        // Ideally we should restore to previous status, but 'received' is a safe fallback.
        // Or 'analyzing' if we want to re-trigger analysis? No, just 'received' or 'ready' if data exists.
        // Let's set to 'received' for now as it's the initial state.
        // Wait, if it was 'completed', we might want to keep it 'completed'?
        // But if it was trash, maybe we assume it needs review.
        // Let's check if we can infer status. For now, 'received' is safest to make it appear in lists.

        await db.collection('fax_documents').doc(documentId).update({
            status: 'received'
        });

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error("Restore Document Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
