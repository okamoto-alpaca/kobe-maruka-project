import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        // Validation: Check if allocated?
        // For simple edits (name, grade), we might allow it even if allocated.
        // But changing quantity below allocated amount is dangerous.
        // For MVP, we'll trust the UI validation or add basic check here.

        await db.collection('fax_details').doc(id).update(body);

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error("Update Detail Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Check for allocations
        const allocationsSnap = await db.collection('allocations').where('detailId', '==', id).get();
        if (!allocationsSnap.empty) {
            return NextResponse.json({ error: "Cannot delete item with existing allocations." }, { status: 400 });
        }

        await db.collection('fax_details').doc(id).delete();

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error("Delete Detail Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
