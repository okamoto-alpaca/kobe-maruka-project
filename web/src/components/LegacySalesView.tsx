'use client';

import useSWR from 'swr';
import { FaxDetail, Allocation } from '@/types/schema';
import { useMemo } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AggregatedRow {
    detailId: string;
    originName: string;
    productName: string;
    grade: string;
    class: string;
    totalQuantity: number;
    allocations: Allocation[];
}

export default function LegacySalesView() {
    const { data: details } = useSWR<FaxDetail[]>('/api/supplies', fetcher);
    const { data: allocations } = useSWR<Allocation[]>('/api/allocations', fetcher);

    const aggregatedData = useMemo(() => {
        if (!details || !allocations) return [];

        // Group allocations by detailId
        const allocMap = new Map<string, Allocation[]>();
        allocations.forEach(a => {
            if (!allocMap.has(a.detailId)) allocMap.set(a.detailId, []);
            allocMap.get(a.detailId)?.push(a);
        });

        // Create rows
        const rows: AggregatedRow[] = details
            .filter(d => {
                // Filter Logic: Only show if allocated or status is not 'none'
                const hasAllocations = allocMap.has(d.id) && allocMap.get(d.id)!.length > 0;
                const isStatusActive = d.allocationStatus && d.allocationStatus !== 'none';
                return hasAllocations || isStatusActive;
            })
            .map(d => ({
                detailId: d.id,
                originName: 'Unknown Origin', // TODO: Join with FaxDocument
                productName: d.productName,
                grade: d.grade || '-',
                class: d.class || '-',
                totalQuantity: d.quantity,
                allocations: allocMap.get(d.id) || []
            }));

        // Sort by Product -> Grade -> Class
        return rows.sort((a, b) =>
            a.productName.localeCompare(b.productName) ||
            a.grade.localeCompare(b.grade) ||
            a.class.localeCompare(b.class)
        );
    }, [details, allocations]);

    const handleDownloadCSV = () => {
        if (aggregatedData.length === 0) return;

        // Header
        let csv = 'Product,Grade,Class,Total,Customer1,Qty1,Customer2,Qty2,Customer3,Qty3,Customer4,Qty4\n';

        aggregatedData.forEach(row => {
            let line = `"${row.productName}","${row.grade}","${row.class}",${row.totalQuantity}`;

            // Add allocations (up to 8 slots like the paper form)
            for (let i = 0; i < 8; i++) {
                const alloc = row.allocations[i];
                if (alloc) {
                    line += `,"${alloc.customerName}",${alloc.quantity}`;
                } else {
                    line += ',,';
                }
            }
            csv += line + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'sales_instruction_legacy.csv';
        link.click();
    };

    if (!details || !allocations) return <div>Loading...</div>;

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <button
                    onClick={handleDownloadCSV}
                    style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    CSVダウンロード (旧フォーマット)
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '8px', border: '1px solid #ddd', minWidth: '150px' }}>商品名</th>
                            <th style={{ padding: '8px', border: '1px solid #ddd', width: '50px' }}>等級</th>
                            <th style={{ padding: '8px', border: '1px solid #ddd', width: '50px' }}>階級</th>
                            <th style={{ padding: '8px', border: '1px solid #ddd', width: '60px' }}>総数</th>
                            {[...Array(8)].map((_, i) => (
                                <th key={i} colSpan={2} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', background: '#e9ecef' }}>
                                    顧客 {i + 1}
                                </th>
                            ))}
                        </tr>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                            <th colSpan={4}></th>
                            {[...Array(8)].map((_, i) => (
                                <>
                                    <th key={`c${i}`} style={{ padding: '4px', border: '1px solid #ddd', fontSize: '10px' }}>名称</th>
                                    <th key={`q${i}`} style={{ padding: '4px', border: '1px solid #ddd', fontSize: '10px' }}>数量</th>
                                </>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {aggregatedData.map((row) => (
                            <tr key={row.detailId} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{row.productName}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{row.grade}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{row.class}</td>
                                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>{row.totalQuantity}</td>
                                {[...Array(8)].map((_, i) => {
                                    const alloc = row.allocations[i];
                                    return (
                                        <>
                                            <td key={`nc${i}`} style={{ padding: '8px', border: '1px solid #ddd', color: alloc ? 'black' : '#eee' }}>
                                                {alloc?.customerName || '-'}
                                            </td>
                                            <td key={`nq${i}`} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: alloc ? 'black' : '#eee' }}>
                                                {alloc?.quantity || '-'}
                                            </td>
                                        </>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
