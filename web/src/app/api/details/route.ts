import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FaxDetail } from '@/types/schema';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { parentId } = body;

        if (!parentId) {
            return NextResponse.json({ error: "Missing parentId" }, { status: 400 });
        }

        const newDetailId = uuidv4();
        const newDetail: FaxDetail = {
            id: newDetailId,
            parentId,
            productName: '',
            grade: '',
            class: '',
            quantity: 0,
            remarks: '',
            unitPrice: null,
            allocationStatus: 'none',
            isAllocated: false,
            assigneeId: null,
            createdAt: Timestamp.now()
        };

        await db.collection('fax_details').doc(newDetailId).set(newDetail);

        return NextResponse.json(newDetail);
    } catch (error: any) {
        console.error("Create Detail Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
