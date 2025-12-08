import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FaxDetail, FaxDocument, Allocation } from '@/types/schema';

export async function GET() {
    try {
        // 1. Fetch Allocated Details
        const detailsSnap = await db.collection('fax_details')
            .where('isAllocated', '==', true)
            .get();

        if (detailsSnap.empty) {
            return new NextResponse("No data", { status: 200 });
        }

        const details = detailsSnap.docs.map(d => d.data() as FaxDetail);

        // 2. Fetch Related Data (Parents & Allocations)
        // Optimization: Deduplicate IDs to minimize reads
        const parentIds = [...new Set(details.map(d => d.parentId))];
        const allocationIds = [...new Set(details.map(d => d.allocationId).filter(id => id) as string[])];

        // Fetch Parents
        const parents: Record<string, FaxDocument> = {};
        const parentChunks = chunkArray(parentIds, 10); // Firestore 'in' limit is 10
        for (const chunk of parentChunks) {
            const snap = await db.collection('fax_documents').where('id', 'in', chunk).get();
            snap.forEach(doc => {
                parents[doc.id] = doc.data() as FaxDocument;
            });
        }

        // Fetch Allocations
        const allocations: Record<string, Allocation> = {};
        const allocChunks = chunkArray(allocationIds, 10);
        for (const chunk of allocChunks) {
            const snap = await db.collection('allocations').where('id', 'in', chunk).get();
            snap.forEach(doc => {
                allocations[doc.id] = doc.data() as Allocation;
            });
        }

        // 3. Generate CSV
        const header = "出荷元,商品,等階級,取引先,数量,単価,金額\n";
        const rows = details.map(d => {
            const parent = parents[d.parentId];
            const allocation = d.allocationId ? allocations[d.allocationId] : null;

            const origin = parent?.originName || '';
            const product = d.productName || '';
            const gradeClass = `${d.grade || ''}${d.class || ''}`;
            const customer = allocation?.customerName || '';
            const qty = d.quantity;
            const price = d.unitPrice || 0;
            const amount = qty * price;

            return `${origin},${product},${gradeClass},${customer},${qty},${price},${amount}`;
        }).join("\n");

        const csv = header + rows;

        // 4. Return Response
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="sales_instructions.csv"',
            },
        });

    } catch (error: any) {
        console.error("Export API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}
