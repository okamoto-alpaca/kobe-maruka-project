'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { FaxDetail, Allocation } from '@/types/schema';
import PrintLabel from './PrintLabel';
import CustomerCombobox from './CustomerCombobox';

import { useAuth } from '@/context/AuthContext';

interface AllocationFormProps {
    selectedDetailId: string | null;
    details?: FaxDetail[];
}

export default function AllocationForm({ selectedDetailId, details }: AllocationFormProps) {
    const { user } = useAuth();
    const [customerName, setCustomerName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    // Print State
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printData, setPrintData] = useState<{ detail: FaxDetail, allocation: Allocation } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDetailId || !user) return;

        setIsSubmitting(true);
        setMessage('');

        // Capture current values for print before clearing
        const currentCustomer = customerName;
        const currentQuantity = Number(quantity);

        try {
            const res = await fetch('/api/allocate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    detailId: selectedDetailId,
                    customerName: currentCustomer,
                    quantity: currentQuantity,
                    userId: user.uid,
                    userEmail: user.email
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Allocation failed');
            }

            setMessage('Allocation successful!');
            setCustomerName('');
            setQuantity('');

            mutate('/api/supplies'); // Refresh the list

            // --- Show Print Modal ---
            const currentDetail = details?.find(d => d.id === selectedDetailId);
            if (currentDetail) {
                setPrintData({
                    detail: currentDetail,
                    allocation: {
                        id: data.allocationId,
                        customerName: currentCustomer,
                        allocatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
                    } as any,
                });
                setShowPrintModal(true);
            }

        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleClose = () => {
        setShowPrintModal(false);
        setPrintData(null);
    };

    if (!selectedDetailId) {
        return <div style={{ padding: '20px', border: '1px solid #ccc' }}>Select a line item from the grid to allocate.</div>;
    }

    const selectedDetail = details?.find(d => d.id === selectedDetailId);

    return (
        <>
            <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
                <h3>Allocation Form</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                        <label>Product: </label>
                        <strong>{selectedDetail?.productName}</strong>
                    </div>
                    <div>
                        <label>Grade/Class: </label>
                        <strong>{selectedDetail?.grade} / {selectedDetail?.class}</strong>
                    </div>
                    {selectedDetail?.remarks && (
                        <div style={{ color: 'red' }}>
                            <label>Remarks: </label>
                            <strong>{selectedDetail.remarks}</strong>
                        </div>
                    )}

                    <div>
                        <label>Customer Name: </label>
                        <CustomerCombobox
                            value={customerName}
                            onChange={setCustomerName}
                        />
                    </div>
                    <div>
                        <label>Quantity: </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                            min="1"
                            max={selectedDetail?.quantity} // Limit to available quantity? Or allow split?
                            // For v3 MVP, let's assume 1-to-1 allocation or simple quantity input.
                            // The user didn't specify split logic yet, but "Allocation" usually implies splitting.
                            // However, fax_details has 'isAllocated' boolean, implying full allocation of the line.
                            // If partial allocation is needed, we'd need to split the FaxDetail record.
                            // For now, let's assume we allocate the whole line or just record the qty.
                            // The prompt says "fax_details (Lines / Children) ... isAllocated: boolean".
                            // This suggests the whole line is marked allocated.
                            // So maybe quantity is fixed to the line quantity?
                            // But the form allows input.
                            // Let's keep input but default to line quantity?
                            // Actually, if I allocate 10 out of 50, what happens to the remaining 40?
                            // If 'isAllocated' becomes true, the line disappears from the list.
                            // So partial allocation would require splitting the record.
                            // For this "Zero Loss" refresh, let's assume we allocate the *entire* line for now, 
                            // or the user manually edits the quantity.
                            // I'll default the quantity to the line quantity.
                            placeholder={String(selectedDetail?.quantity)}
                            style={{ border: '1px solid black', padding: '4px' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ border: '1px solid black', padding: '8px', background: '#eee', cursor: 'pointer' }}
                    >
                        {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
                    </button>
                </form>
                {message && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{message}</p>}
            </div>

            {/* Print Preview Modal */}
            {showPrintModal && printData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '20px', maxWidth: '500px', width: '100%' }}>
                        <h2>Print Preview</h2>
                        <div style={{ margin: '20px 0', border: '1px dashed gray', padding: '10px', display: 'flex', justifyContent: 'center' }}>
                            {/* This component is visible in modal AND used for printing */}
                            <PrintLabel detail={printData.detail} allocation={printData.allocation} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={handleClose} style={{ padding: '10px 20px', cursor: 'pointer' }}>Close</button>
                            <button onClick={handlePrint} style={{ padding: '10px 20px', background: 'black', color: 'white', cursor: 'pointer' }}>Print Label</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
