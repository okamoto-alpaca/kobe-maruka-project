import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids, price } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Missing or invalid IDs" }, { status: 400 });
        }

        if (typeof price !== 'number' || price < 0) {
            return NextResponse.json({ error: "Invalid price" }, { status: 400 });
        }

        const batch = db.batch();
        ids.forEach((id: string) => {
            const ref = db.collection('fax_details').doc(id);
            batch.update(ref, { unitPrice: price });
        });

        await batch.commit();

        return NextResponse.json({ status: "success", count: ids.length });

    } catch (error: any) {
        console.error("Pricing API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
