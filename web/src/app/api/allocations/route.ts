import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Allocation } from '@/types/schema';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const detailId = searchParams.get('detailId');

    try {
        let query: FirebaseFirestore.Query = db.collection('allocations');

        if (detailId) {
            query = query.where('detailId', '==', detailId);
        }

        // Limit to recent 500 if no filter (safety)
        if (!detailId) {
            query = query.orderBy('allocatedAt', 'desc').limit(500);
        }

        const snapshot = await query.get();

        const allocations = snapshot.docs.map(doc => doc.data() as Allocation);
        return NextResponse.json(allocations);

    } catch (error: any) {
        console.error("Allocations API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
