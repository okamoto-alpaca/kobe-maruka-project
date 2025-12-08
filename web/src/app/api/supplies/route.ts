import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FaxDetail } from '@/types/schema';

export const dynamic = 'force-dynamic'; // Ensure no caching for real-time data

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const documentId = searchParams.get('documentId');

        // Sort by createdAt desc to show newest first (for "Add Row" at top)
        // Fallback to productName if createdAt is missing (legacy data)
        let query = db.collection('fax_details').orderBy('createdAt', 'desc');

        if (documentId) {
            query = query.where('parentId', '==', documentId);
        }

        const snapshot = await query.get();

        const details: FaxDetail[] = [];
        snapshot.forEach(doc => {
            details.push(doc.data() as FaxDetail);
        });

        return NextResponse.json(details);
    } catch (error: any) {
        console.error("Supplies (Details) GET API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
