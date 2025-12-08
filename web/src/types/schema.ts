import { Timestamp } from 'firebase-admin/firestore';

/**
 * Collection: fax_documents (Headers / Parents)
 */
export interface FaxDocument {
    id: string;             // UUID
    storagePath: string;    // Storage path (e.g., "fax/2025-11-25/doc_01.pdf")
    status: 'received' | 'analyzing' | 'ready' | 'error' | 'completed' | 'trash';
    uploadTimestamp: Timestamp;

    // OCR Header Extraction (Nullable initially)
    shippingDate: string | null;  // "YYYY-MM-DD"
    originName: string | null;    // 出荷元名称
    originCode: string | null;    // 出荷元コード
    slipNumber: string | null;    // 送り状No
    reporter: string | null;      // 報告者
    transporter: string | null;   // 輸送業者

    // Error context
    errorMessage?: string;

    // Assignment (Task 17)
    assigneeId: string | null; // User UID or null (Unassigned)
    assigneeName: string | null; // Display name
    originId: string | null;     // Master ID for auto-assignment
}

/**
 * Collection: fax_details (Lines / Children)
 */
export interface FaxDetail {
    id: string;
    parentId: string;       // Foreign Key to fax_documents

    // Product Info
    productName: string;    // OCR Result
    grade: string | null;   // 等級 (例: "秀", "A") -> 分割必須
    class: string | null;   // 階級 (例: "L", "2L") -> 分割必須
    quantity: number;       // 数量
    remarks: string | null; // 備考 (例: "20-30穴", "水濡れ") -> 重要

    // Commercial Info
    unitPrice: number | null; // 単価 (後から入力。初期値 null)

    // Allocation Status (New for v3.1 Splitter)
    allocationStatus: 'none' | 'partial' | 'completed' | 'over';

    // Legacy compatibility (Optional)
    isAllocated: boolean;

    // Assignment (Denormalized from Parent)
    assigneeId: string | null;

    // Metadata
    createdAt?: Timestamp;
}

/**
 * Collection: allocations
 * Records of who received the goods.
 * Linked to FaxDetail via detailId.
 */
export interface Allocation {
    id: string;
    detailId: string;       // FK to fax_details
    customerName: string;
    quantity: number;
    unitPrice?: number;     // Optional override
    allocatedAt: Timestamp;
}
