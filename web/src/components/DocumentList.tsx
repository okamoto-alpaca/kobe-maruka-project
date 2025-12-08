'use client';

import useSWR from 'swr';
import { FaxDocument } from '@/types/schema';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Thumbnail Component
function FaxThumbnail({ path }: { path: string }) {
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (!path) return;
        const storageRef = ref(storage, path);
        getDownloadURL(storageRef)
            .then(setUrl)
            .catch(err => {
                console.error("Failed to load thumbnail:", err);
                setError(true);
            });
    }, [path]);

    if (error) return <div style={{ height: '100%', background: '#f8d7da', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#721c24', fontSize: '12px' }}>画像エラー</div>;
    if (!url) return <div style={{ height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Loading...</div>;

    return <img src={url} alt="FAX" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

export default function DocumentList() {
    const { user } = useAuth();
    const router = useRouter();
    const { data: documents, error, mutate } = useSWR<FaxDocument[]>('/api/documents', fetcher);
    const [showTrash, setShowTrash] = useState(false);

    if (error) return <div>ドキュメントの読み込みに失敗しました</div>;
    if (!documents) return <div>読み込み中...</div>;

    const today = new Date().toISOString().split('T')[0];

    // Sort by shippingDate ASC (Target Date)
    const sortedDocs = [...documents].sort((a, b) => {
        const dateA = a.shippingDate || '9999-99-99';
        const dateB = b.shippingDate || '9999-99-99';
        return dateA.localeCompare(dateB);
    });

    // Grouping
    const trashTasks = sortedDocs.filter(d => d.status === 'trash');
    const activeTasks = sortedDocs.filter(d => d.status !== 'trash');

    const pastTasks = activeTasks.filter(d => {
        const isPast = (d.shippingDate || '9999-99-99') < today;
        // Only show if it's MY task or UNASSIGNED. Hide tasks assigned to others.
        const isMineOrUnassigned = d.assigneeId === user?.uid || !d.assigneeId;
        return isPast && isMineOrUnassigned;
    });
    const currentTasks = activeTasks.filter(d => (d.shippingDate || '9999-99-99') >= today);

    const myTasks = currentTasks.filter(d => d.assigneeId === user?.uid);
    const orphanTasks = currentTasks.filter(d => !d.assigneeId);

    const handleTrash = async (docId: string) => {
        if (!confirm('このFAXをゴミ箱に移動しますか？')) return;
        try {
            const res = await fetch('/api/documents/trash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: docId }),
            });
            if (res.ok) {
                mutate(); // Refresh list
            } else {
                alert('移動に失敗しました');
            }
        } catch (e) {
            console.error(e);
            alert('通信エラー');
        }
    };

    const handleRestore = async (docId: string) => {
        if (!confirm('このFAXを復元しますか？')) return;
        try {
            const res = await fetch('/api/documents/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: docId }),
            });
            if (res.ok) {
                mutate(); // Refresh list
            } else {
                alert('復元に失敗しました');
            }
        } catch (e) {
            console.error(e);
            alert('通信エラー');
        }
    };

    const handleClaim = async (docId: string) => {
        if (!user) return;
        try {
            const res = await fetch('/api/documents/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: docId, userId: user.uid, userName: user.email }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/cockpit?id=${docId}`);
            } else {
                alert(`エラー: ${data.error || '担当割り当てに失敗しました'}`);
                mutate();
            }
        } catch (e) {
            console.error(e);
            alert('通信エラーが発生しました');
        }
    };

    const handleOpen = (docId: string) => {
        router.push(`/cockpit?id=${docId}`);
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'received': return '受信済';
            case 'analyzing': return '解析中';
            case 'ready': return '準備完了';
            case 'error': return 'エラー';
            case 'completed': return '完了';
            case 'trash': return 'ゴミ箱';
            default: return status;
        }
    };

    const renderCard = (doc: FaxDocument, isMine: boolean, isTrash: boolean = false) => (
        <div key={doc.id} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            width: '250px',
            background: isTrash ? '#f8f9fa' : 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            opacity: isTrash ? 0.7 : 1
        }}>
            {/* Thumbnail */}
            <div style={{
                height: '150px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #eee'
            }}>
                {doc.storagePath ? <FaxThumbnail path={doc.storagePath} /> : <div style={{ padding: 20 }}>No Image</div>}
            </div>

            <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{doc.originName || '出荷元不明'}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{doc.shippingDate || '日付不明'}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>状態: {getStatusText(doc.status)}</div>
            </div>

            {!isTrash ? (
                <>
                    {isMine ? (
                        <button
                            onClick={() => handleOpen(doc.id)}
                            style={{
                                padding: '8px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            作業再開
                        </button>
                    ) : (
                        <button
                            onClick={() => handleClaim(doc.id)}
                            style={{
                                padding: '8px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            担当する
                        </button>
                    )}
                    <button
                        onClick={() => handleTrash(doc.id)}
                        style={{
                            padding: '8px',
                            background: 'transparent',
                            color: '#dc3545',
                            border: '1px solid #dc3545',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginTop: '5px'
                        }}
                    >
                        ゴミ箱へ
                    </button>
                </>
            ) : (
                <button
                    onClick={() => handleRestore(doc.id)}
                    style={{
                        padding: '8px',
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    復元する
                </button>
            )}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* My Tasks Section */}
            <section>
                <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px', marginBottom: '15px', color: '#007bff' }}>
                    担当タスク ({myTasks.length})
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {myTasks.length > 0 ? myTasks.map(d => renderCard(d, true)) : <p>担当しているタスクはありません。</p>}
                </div>
            </section>

            {/* Orphan Tasks Section */}
            <section>
                <h2 style={{ borderBottom: '2px solid #dc3545', paddingBottom: '5px', marginBottom: '15px', color: '#dc3545' }}>
                    未割当タスク ({orphanTasks.length})
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {orphanTasks.length > 0 ? orphanTasks.map(d => renderCard(d, false)) : <p>未割当のタスクはありません。</p>}
                </div>
            </section>

            {/* Past Tasks Section (Collapsible or Separate) */}
            {pastTasks.length > 0 && (
                <section style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <h2 style={{ borderBottom: '2px solid #6c757d', paddingBottom: '5px', marginBottom: '15px', color: '#6c757d' }}>
                        過去のタスク ({pastTasks.length})
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        {pastTasks.map(d => renderCard(d, d.assigneeId === user?.uid))}
                    </div>
                </section>
            )}

            {/* Trash Section (Collapsible) */}
            <section style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <button
                    onClick={() => setShowTrash(!showTrash)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6c757d',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    {showTrash ? '▼' : '▶'} ゴミ箱 ({trashTasks.length})
                </button>

                {showTrash && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px' }}>
                        {trashTasks.length > 0 ? trashTasks.map(d => renderCard(d, false, true)) : <p>ゴミ箱は空です。</p>}
                    </div>
                )}
            </section>
        </div>
    );
}
