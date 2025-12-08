import { Timestamp } from 'firebase-admin/firestore';

/**
 * Supply Status Enum
 * Strict definition using const assertion for type safety.
 */
export const SupplyStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
} as const;

export type SupplyStatus = typeof SupplyStatus[keyof typeof SupplyStatus];

/**
 * Collection: supplies
 */
export interface Supply {
    id: string; // UUID
    faxId: string;
    status: SupplyStatus;
    productName: string;
    initialQuantity: number; // >= 0
    currentQuantity: number; // >= 0
    createdAt: Timestamp;
}

/**
 * Collection: allocations
 * Root Collection
 */
export interface Allocation {
    id?: string; // Firestore auto-id is fine, or UUID
    supplyId: string; // Foreign key to supplies
    customerName: string;
    allocatedQuantity: number; // >= 1
    allocatedAt: Timestamp;
}
