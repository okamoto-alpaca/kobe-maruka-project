import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FaxDocument } from '@/types/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // In a real app, we'd filter by user ID from session/token here.
        // For MVP, we fetch all relevant docs and let client filter, OR filter here if we pass userId param.
        // Let's fetch ALL "active" documents (not archived) and let client split them for now.
        // Optimization: Filter where assigneeId == userId OR assigneeId == null.

        const snapshot = await db.collection('fax_documents')
            .orderBy('uploadTimestamp', 'desc')
            .limit(100)
            .get();

        const documents: FaxDocument[] = [];
        snapshot.forEach(doc => {
            documents.push(doc.data() as FaxDocument);
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        console.error("Documents GET API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
