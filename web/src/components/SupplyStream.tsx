'use client';

import useSWR from 'swr';
import { FaxDetail } from '@/types/schema';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SupplyStreamProps {
    onSelect: (detail: FaxDetail) => void;
    selectedId?: string;
    targetDate: string;
    documentId: string;
}

export default function SupplyStream({ onSelect, selectedId, targetDate, documentId }: SupplyStreamProps) {
    const { data: details, error, mutate } = useSWR<FaxDetail[]>(`/api/supplies?documentId=${documentId}`, fetcher);
    const [tab, setTab] = useState<'pending' | 'completed' | 'all' | 'unassigned'>('pending');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<FaxDetail>>({});

    if (error) return <div>読み込みエラー</div>;
    if (!details) return <div>読み込み中...</div>;

    // Filter Logic
    const filteredDetails = details.filter(d => {
        const status = d.allocationStatus || 'none';
        const isCompleted = status === 'completed';

        if (tab === 'pending') return !isCompleted;
        if (tab === 'completed') return isCompleted;
        return true; // 'all'
    });

    // --- Actions ---

    const handleAddRow = async () => {
        try {
            const res = await fetch('/api/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parentId: documentId })
            });
            if (res.ok) {
                const newDetail = await res.json();
                await mutate(); // Refresh list
                // Automatically enter edit mode for the new row
                setEditingId(newDetail.id);
                setEditForm(newDetail);
            } else {
                alert('行の追加に失敗しました');
            }
        } catch (e) {
            console.error(e);
            alert('通信エラー');
        }
    };

    const handleDeleteRow = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('この行を削除しますか？')) return;

        try {
            const res = await fetch(`/api/details/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                mutate();
            } else {
                alert(`削除失敗: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('通信エラー');
        }
    };

    const startEdit = (detail: FaxDetail, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(detail.id);
        setEditForm(detail);
    };

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/details/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            mutate();
            setEditingId(null);
            setEditForm({});
        } catch (e) {
            console.error(e);
            alert('保存に失敗しました');
        }
    };

    const handleInputChange = (field: keyof FaxDetail, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Add Button Fixed */}
            <div style={{ padding: '10px', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => setTab('pending')} style={tabStyle(tab === 'pending', '#007bff')}>未完了</button>
                    <button onClick={() => setTab('completed')} style={tabStyle(tab === 'completed', '#28a745')}>完了</button>
                    <button onClick={() => setTab('all')} style={tabStyle(tab === 'all', '#6c757d')}>全て</button>
                </div>
                <button
                    onClick={handleAddRow}
                    style={{
                        padding: '8px 15px',
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    ＋ 行を追加
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>商品名</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>等級</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>階級</th>
                            <th style={{ padding: '8px', textAlign: 'right', width: '60px' }}>総数</th>
                            <th style={{ padding: '8px', textAlign: 'right', width: '60px' }}>残数</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '80px' }}>状態</th>
                            <th style={{ padding: '8px', width: '80px' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDetails.map((detail) => {
                            const isSelected = detail.id === selectedId;
                            const isEditing = detail.id === editingId;
                            const remaining = detail.quantity;
                            const status = detail.allocationStatus || 'none';
                            const isCompleted = status === 'completed';

                            return (
                                <tr
                                    key={detail.id}
                                    onClick={() => !isEditing && onSelect(detail)}
                                    style={{
                                        cursor: isEditing ? 'default' : 'pointer',
                                        background: isSelected ? '#e3f2fd' : (isCompleted ? '#f8f9fa' : 'white'),
                                        color: isCompleted ? '#888' : 'black',
                                        borderBottom: '1px solid #f0f0f0'
                                    }}
                                >
                                    {isEditing ? (
                                        <>
                                            <td style={{ padding: '4px' }}>
                                                <input
                                                    type="text"
                                                    value={editForm.productName || ''}
                                                    onChange={(e) => handleInputChange('productName', e.target.value)}
                                                    style={inputStyle}
                                                    autoFocus
                                                />
                                            </td>
                                            <td style={{ padding: '4px' }}>
                                                <input
                                                    type="text"
                                                    value={editForm.grade || ''}
                                                    onChange={(e) => handleInputChange('grade', e.target.value)}
                                                    style={{ ...inputStyle, textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ padding: '4px' }}>
                                                <input
                                                    type="text"
                                                    value={editForm.class || ''}
                                                    onChange={(e) => handleInputChange('class', e.target.value)}
                                                    style={{ ...inputStyle, textAlign: 'center' }}
                                                />
                                            </td>
                                            <td style={{ padding: '4px' }}>
                                                <input
                                                    type="number"
                                                    value={editForm.quantity || 0}
                                                    onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                                                    style={{ ...inputStyle, textAlign: 'right' }}
                                                />
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>-</td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>-</td>
                                            <td style={{ padding: '4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                <button onClick={(e) => saveEdit(detail.id, e)} style={{ marginRight: '5px', border: 'none', background: 'transparent', color: '#28a745', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
                                                <button onClick={(e) => cancelEdit(e)} style={{ border: 'none', background: 'transparent', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ padding: '8px' }}>{detail.productName}</td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>{detail.grade}</td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>{detail.class}</td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{detail.quantity}</td>
                                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: remaining === 0 ? 'green' : 'red' }}>
                                                {remaining}
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    background: status === 'completed' ? '#d4edda' : '#f8d7da',
                                                    color: status === 'completed' ? '#155724' : '#721c24'
                                                }}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                <button
                                                    onClick={(e) => startEdit(detail, e)}
                                                    style={{
                                                        marginRight: '5px',
                                                        border: '1px solid #007bff',
                                                        background: 'transparent',
                                                        color: '#007bff',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px',
                                                        padding: '2px 6px',
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    編集
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteRow(detail.id, e)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: '#dc3545',
                                                        cursor: 'pointer',
                                                        fontSize: '16px'
                                                    }}
                                                    title="削除"
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const tabStyle = (active: boolean, activeColor: string) => ({
    padding: '5px 10px',
    borderRadius: '15px',
    border: 'none',
    background: active ? activeColor : '#e9ecef',
    color: active ? 'white' : 'black',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '12px'
});

const inputStyle = {
    width: '100%',
    border: '1px solid #007bff',
    background: 'white',
    padding: '4px',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none'
};
