import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FaxDetail, Allocation } from '@/types/schema';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { detailId, allocations, userId, userEmail, overrideTotalQty } = body;

        if (!detailId || !Array.isArray(allocations) || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await db.runTransaction(async (transaction) => {
            const detailRef = db.collection('fax_details').doc(detailId);
            const detailDoc = await transaction.get(detailRef);

            if (!detailDoc.exists) {
                throw new Error("Detail not found");
            }

            const detailData = detailDoc.data() as FaxDetail;
            let totalQty = detailData.quantity;

            // Handle Override
            if (overrideTotalQty !== undefined && overrideTotalQty !== totalQty) {
                totalQty = overrideTotalQty;
                transaction.update(detailRef, { quantity: totalQty });
            }

            // 1. Delete existing allocations for this detail (Replace Mode)
            // Note: In a transaction, we must perform reads before writes. 
            // Querying inside transaction requires the query to be part of the transaction.
            const existingAllocationsQuery = db.collection('allocations').where('detailId', '==', detailId);
            const existingAllocationsSnap = await transaction.get(existingAllocationsQuery);

            existingAllocationsSnap.forEach(doc => {
                transaction.delete(doc.ref);
            });

            // 2. Create New Allocations
            let allocatedTotal = 0;
            allocations.forEach((alloc: any) => {
                const qty = Number(alloc.quantity);
                if (qty > 0 && alloc.customerName) {
                    const newAllocRef = db.collection('allocations').doc();
                    const newAlloc: Allocation & { executedBy: any } = {
                        id: newAllocRef.id,
                        detailId: detailId,
                        customerName: alloc.customerName,
                        quantity: qty,
                        allocatedAt: Timestamp.now(),
                        executedBy: {
                            uid: userId,
                            email: userEmail || 'unknown'
                        }
                    };
                    transaction.set(newAllocRef, newAlloc);
                    allocatedTotal += qty;
                }
            });

            // 3. Update Status
            let status: 'none' | 'partial' | 'completed' | 'over' = 'none';
            if (allocatedTotal === 0) status = 'none';
            else if (allocatedTotal < totalQty) status = 'partial';
            else if (allocatedTotal === totalQty) status = 'completed';
            else status = 'over';

            transaction.update(detailRef, {
                allocationStatus: status,
                isAllocated: allocatedTotal > 0 // Legacy compat
            });

            return { status, allocatedTotal };
        });

        return NextResponse.json({ status: "success", ...result });

    } catch (error: any) {
        console.error("Allocate API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
