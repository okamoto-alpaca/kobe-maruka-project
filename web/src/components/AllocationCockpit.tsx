'use client';

import { useState, useEffect } from 'react';
import FaxIngestViewer from './FaxIngestViewer';
import SupplyStream from './SupplyStream';
import DistributionPanel from './DistributionPanel';
import { FaxDetail, FaxDocument } from '@/types/schema';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AllocationCockpit() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const documentId = searchParams.get('id');

    // Fetch Document Data for Date
    const { data: documents } = useSWR<FaxDocument[]>('/api/documents', fetcher);
    const currentDoc = documents?.find(d => d.id === documentId);

    const [selectedDetail, setSelectedDetail] = useState<FaxDetail | null>(null);
    const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Sync targetDate with document's shippingDate when loaded
    useEffect(() => {
        if (currentDoc?.shippingDate) {
            setTargetDate(currentDoc.shippingDate);
        }
    }, [currentDoc]);

    if (!documentId) {
        return <div style={{ padding: '20px' }}>ドキュメントIDが指定されていません。ダッシュボードからタスクを選択してください。<a href="/">戻る</a></div>;
    }

    const handleUpdateDate = async (newDate: string) => {
        setTargetDate(newDate);
        try {
            // Update document's shippingDate
            // We need a generic update endpoint or reuse existing one?
            // Let's assume we need to create/use an update endpoint.
            // For now, let's use a new endpoint or just assume we can update it.
            // Wait, we don't have a generic update endpoint for documents yet.
            // Let's create one or use a specific one.
            // Let's create `PUT /api/documents/[id]` quickly or use a server action if we were using them.
            // Let's use `PUT /api/documents/update` (new) or just add it to `api/documents`?
            // Let's create `api/documents/update/route.ts` for simplicity.

            await fetch('/api/documents/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId, shippingDate: newDate })
            });
        } catch (e) {
            console.error("Failed to update date", e);
        }
    };

    const handleTrash = async () => {
        if (!confirm('このFAXをゴミ箱に移動しますか？')) return;
        try {
            const res = await fetch('/api/documents/trash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId }),
            });
            if (res.ok) {
                window.location.href = '/'; // Redirect to dashboard
            } else {
                alert('移動に失敗しました');
            }
        } catch (e) {
            console.error(e);
            alert('通信エラー');
        }
    };

    const handleAssignment = async (action: 'release' | 'transfer') => {
        if (!user) return;

        const actionName = action === 'release' ? '担当を外れ' : '転送し';
        if (!confirm(`本当にこのタスクの${actionName}ますか？`)) return;

        try {
            const res = await fetch('/api/documents/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: documentId, // Use documentId from scope
                    action,
                    userId: user.uid,
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`タスクの${actionName}ました`);
                setSelectedDetail(null); // Deselect
                window.location.href = '/'; // Redirect to dashboard after releasing assignment
            } else {
                alert(`操作に失敗しました: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('通信エラーが発生しました');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%' }}>
            {/* Left Pane: Fax Viewer (35%) */}
            <div style={{ width: '35%', height: '100%', borderRight: '1px solid #ccc' }}>
                <FaxIngestViewer documentId={documentId} />
            </div>

            {/* Right Pane: Splitter Interface (65%) */}
            <div style={{ width: '65%', height: '100%', display: 'flex', flexDirection: 'column' }}>

                {/* Header: Global Controls */}
                <div style={{ padding: '10px', borderBottom: '1px solid #ddd', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontWeight: 'bold' }}>対象日 (Shipping Date):</label>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => handleUpdateDate(e.target.value)}
                            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                            (受信: {currentDoc?.uploadTimestamp ? new Date((currentDoc.uploadTimestamp as any)._seconds * 1000).toLocaleString() : '---'})
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => handleAssignment('release')}
                            style={{ padding: '5px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            担当を破棄する
                        </button>
                        <button
                            onClick={handleTrash}
                            style={{ padding: '5px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            ゴミ箱へ
                        </button>
                        <a href="/" style={{ padding: '5px 15px', background: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>
                            ダッシュボードへ戻る
                        </a>
                    </div>
                </div>

                {/* Area 1: Supply Stream (Top 50%) */}
                <div style={{ flex: 1, borderBottom: '1px solid #ccc', overflow: 'hidden' }}>
                    <SupplyStream
                        onSelect={setSelectedDetail}
                        selectedId={selectedDetail?.id}
                        targetDate={targetDate}
                        documentId={documentId}
                    />
                </div>

                {/* Area 2: Distribution Panel (Bottom 50%) */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {selectedDetail ? (
                        <DistributionPanel detail={selectedDetail} />
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
                            上のリストから商品を選択して分荷を開始してください。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
