'use client';

import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { FaxDetail } from '@/types/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MatrixPage() {
    const { data: details, error, isLoading } = useSWR<FaxDetail[]>('/api/supplies', fetcher);
    const [priceUpdates, setPriceUpdates] = useState<Record<string, number>>({});

    // Aggregate Data
    const matrix = useMemo(() => {
        if (!details) return {};

        const grouped: Record<string, Record<string, Record<string, { qty: number, ids: string[], price: number | null }>>> = {};

        details.forEach(d => {
            const product = d.productName || 'Unknown';
            const grade = d.grade || '-';
            const cls = d.class || '-';

            if (!grouped[product]) grouped[product] = {};
            if (!grouped[product][grade]) grouped[product][grade] = {};
            if (!grouped[product][grade][cls]) {
                grouped[product][grade][cls] = { qty: 0, ids: [], price: d.unitPrice };
            }

            grouped[product][grade][cls].qty += d.quantity;
            grouped[product][grade][cls].ids.push(d.id);
            // Assume price is consistent or take first
        });

        return grouped;
    }, [details]);

    // Extract all unique classes for columns
    const allClasses = useMemo(() => {
        const classes = new Set<string>();
        if (details) {
            details.forEach(d => classes.add(d.class || '-'));
        }
        return Array.from(classes).sort();
    }, [details]);

    const handlePriceUpdate = async (ids: string[], newPrice: number) => {
        try {
            const res = await fetch('/api/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, price: newPrice }),
            });
            if (!res.ok) throw new Error('Failed to update price');

            // Optimistic update or revalidate
            mutate('/api/supplies');
        } catch (e) {
            console.error(e);
            alert("Failed to update price");
        }
    };

    if (error) return <div>Failed to load data</div>;
    if (isLoading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Daily Matrix View (Pricing)</h1>

            {Object.entries(matrix).map(([product, grades]) => (
                <div key={product} style={{ marginBottom: '40px' }}>
                    <h2>{product}</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #ddd', padding: '8px', background: '#f2f2f2' }}>Grade</th>
                                {allClasses.map(cls => (
                                    <th key={cls} style={{ border: '1px solid #ddd', padding: '8px', background: '#f2f2f2' }}>{cls}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(grades).map(([grade, classes]) => (
                                <tr key={grade}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{grade}</td>
                                    {allClasses.map(cls => {
                                        const cell = classes[cls];
                                        return (
                                            <td key={cls} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                                                {cell ? (
                                                    <div>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{cell.qty}</div>
                                                        <input
                                                            type="number"
                                                            defaultValue={cell.price || ''}
                                                            placeholder="Price"
                                                            style={{ width: '80px', marginTop: '5px', padding: '4px' }}
                                                            onBlur={(e) => {
                                                                const val = Number(e.target.value);
                                                                if (!isNaN(val) && val >= 0 && val !== cell.price) {
                                                                    handlePriceUpdate(cell.ids, val);
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.currentTarget.blur();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                ) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}
