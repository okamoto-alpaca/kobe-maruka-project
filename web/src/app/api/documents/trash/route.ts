import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { documentId } = body;

        if (!documentId) {
            return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
        }

        await db.collection('fax_documents').doc(documentId).update({
            status: 'trash'
        });

        return NextResponse.json({ status: 'success' });
    } catch (error: any) {
        console.error("Trash Document Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
