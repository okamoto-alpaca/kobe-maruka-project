'use client';

import { FaxDetail, Allocation } from '@/types/schema';
import { useState, useEffect } from 'react';
import CustomerCombobox from './CustomerCombobox';
import useSWR, { mutate } from 'swr';
import { useAuth } from '@/context/AuthContext';

interface DistributionPanelProps {
    detail: FaxDetail;
}

interface AllocationRow {
    id: string; // temp id
    customerName: string;
    quantity: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DistributionPanel({ detail }: DistributionPanelProps) {
    const { user } = useAuth();
    const [rows, setRows] = useState<AllocationRow[]>([]);
    const [totalQty, setTotalQty] = useState(detail.quantity);
    const [remaining, setRemaining] = useState(detail.quantity);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingTotal, setIsEditingTotal] = useState(false);

    // Fetch existing allocations
    const { data: existingAllocations, error } = useSWR<Allocation[]>(
        detail ? `/api/allocations?detailId=${detail.id}` : null,
        fetcher
    );

    // Initialize rows when detail or existingAllocations change
    useEffect(() => {
        setTotalQty(detail.quantity);
        if (existingAllocations && existingAllocations.length > 0) {
            setRows(existingAllocations.map(a => ({
                id: a.id,
                customerName: a.customerName,
                quantity: a.quantity
            })));
        } else {
            setRows([{ id: Date.now().toString(), customerName: '', quantity: 0 }]);
        }
    }, [detail.id, existingAllocations, detail.quantity]);

    // Recalculate remaining
    useEffect(() => {
        const allocated = rows.reduce((sum, row) => sum + row.quantity, 0);
        setRemaining(totalQty - allocated);
    }, [rows, totalQty]);

    const handleAddRow = () => {
        setRows([...rows, { id: Date.now().toString(), customerName: '', quantity: 0 }]);
    };

    const handleUpdateRow = (index: number, field: keyof AllocationRow, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleRemoveRow = (index: number) => {
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    };

    const handleSave = async () => {
        if (!user) {
            alert("ログインしてください");
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('/api/allocate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    detailId: detail.id,
                    allocations: rows,
                    userId: user.uid,
                    userEmail: user.email,
                    overrideTotalQty: totalQty !== detail.quantity ? totalQty : undefined
                }),
            });

            if (!res.ok) throw new Error("Save failed");

            // Refresh Supply Stream
            mutate('/api/supplies');
            // Refresh Allocations (though we just updated them)
            mutate(`/api/allocations?detailId=${detail.id}`);

            alert("保存しました！");

        } catch (error) {
            console.error(error);
            alert("保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            {/* Header */}
            <div style={{ padding: '15px', borderBottom: '1px solid #ddd', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{detail.productName}</h3>
                    <div style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {detail.grade} / {detail.class} | 総数:
                        {isEditingTotal ? (
                            <input
                                type="number"
                                value={totalQty}
                                onChange={(e) => setTotalQty(Number(e.target.value))}
                                onBlur={() => setIsEditingTotal(false)}
                                autoFocus
                                style={{ width: '60px', padding: '2px' }}
                            />
                        ) : (
                            <span
                                onClick={() => setIsEditingTotal(true)}
                                style={{ cursor: 'pointer', borderBottom: '1px dashed #999' }}
                                title="クリックして総数を編集"
                            >
                                {totalQty}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>残数</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: remaining < 0 ? 'red' : remaining === 0 ? 'green' : 'black' }}>
                        {remaining}
                    </div>
                </div>
            </div>

            {/* Editor Body */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                {rows.map((row, index) => (
                    <div key={row.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <CustomerCombobox
                                value={row.customerName}
                                onChange={(val) => handleUpdateRow(index, 'customerName', val)}
                            />
                        </div>
                        <div style={{ width: '100px' }}>
                            <input
                                type="number"
                                value={row.quantity || ''}
                                onChange={(e) => handleUpdateRow(index, 'quantity', Number(e.target.value))}
                                placeholder="数量"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <button
                            onClick={() => handleRemoveRow(index)}
                            style={{ padding: '8px', background: '#fee', color: 'red', border: '1px solid #fcc', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>
                ))}

                <button
                    onClick={handleAddRow}
                    style={{ marginTop: '10px', padding: '8px 16px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + 配送先を追加
                </button>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '15px', borderTop: '1px solid #ddd', background: '#f8f9fa', textAlign: 'right' }}>
                <button
                    onClick={handleSave}
                    disabled={remaining !== 0 || isSaving}
                    style={{
                        padding: '10px 30px',
                        background: remaining === 0 ? '#28a745' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: remaining === 0 && !isSaving ? 'pointer' : 'not-allowed',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    {isSaving ? '保存中...' : '分荷を確定'}
                </button>
            </div>
        </div>
    );
}
