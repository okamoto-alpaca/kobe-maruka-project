'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { mutate } from 'swr';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface FaxIngestViewerProps {
    documentId?: string | null;
}

export default function FaxIngestViewer({ documentId }: FaxIngestViewerProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    // Effect: Load image if documentId is provided
    useEffect(() => {
        if (!documentId) {
            setImageSrc(null);
            return;
        }

        const loadImage = async () => {
            try {
                // 1. Get Document to find storage path
                const docRef = doc(db, 'fax_documents', documentId);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    setLoadingError("Document not found");
                    return;
                }

                const data = docSnap.data();
                const storagePath = data?.storagePath;

                if (!storagePath) {
                    setLoadingError("No image associated with this document");
                    return;
                }

                // 2. Get Download URL
                const storageRef = ref(storage, storagePath);
                const url = await getDownloadURL(storageRef);
                setImageSrc(url);
                setLoadingError(null);

            } catch (err: any) {
                console.error("Failed to load image:", err);
                setLoadingError("Failed to load image");
            }
        };

        loadImage();
    }, [documentId]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // 1. Show Preview Immediately
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setImageSrc(base64);

            // 2. Start Upload & Analysis
            uploadImage(base64.split(',')[1]); // Remove "data:image/png;base64," prefix
        };
        reader.readAsDataURL(file);
    }, []);

    const uploadImage = async (base64Data: string) => {
        setIsUploading(true);
        try {
            const res = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64Data }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Ingest failed');
            }

            // 3. Success: Update Grid
            mutate('/api/supplies');
            // Optional: Show success toast? For now, the grid update is the feedback.

        } catch (error: any) {
            alert(`Error: ${error.message}`); // Simple alert as requested
        } finally {
            setIsUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false,
        noClick: !!imageSrc, // Disable click to open dialog if image is loaded (allow zoom/pan)
        disabled: !!documentId // Disable upload if viewing specific document
    });

    if (loadingError) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
                {loadingError}
            </div>
        );
    }

    if (!imageSrc) {
        return (
            <div {...getRootProps()} style={{
                height: '100%',
                borderRight: '1px solid black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDragActive ? '#e0e0e0' : '#f0f0f0',
                cursor: documentId ? 'default' : 'pointer'
            }}>
                <input {...getInputProps()} />
                <p style={{ fontSize: '18px', color: '#666' }}>
                    {documentId ? 'Loading Image...' : (isDragActive ? 'Drop FAX here...' : 'Drag & Drop FAX Image Here')}
                </p>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', borderRight: '1px solid black', position: 'relative', overflow: 'hidden' }}>
            {/* Loading Overlay */}
            {isUploading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(255,255,255,0.7)', zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                }}>
                    <div style={{
                        width: '40px', height: '40px', border: '4px solid #ccc', borderTop: '4px solid black',
                        borderRadius: '50%', animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '10px', fontWeight: 'bold' }}>AI Analyzing...</p>
                    <style jsx>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                </div>
            )}

            {/* Zoom/Pan Viewer */}
            <TransformWrapper initialScale={1} minScale={0.5} maxScale={4} centerOnInit>
                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
                    <img src={imageSrc} alt="FAX Preview" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                </TransformComponent>
            </TransformWrapper>

            {/* Reset Button (Only show if NOT in read-only mode) */}
            {!documentId && (
                <button
                    onClick={() => setImageSrc(null)}
                    style={{
                        position: 'absolute', bottom: '10px', right: '10px', zIndex: 5,
                        padding: '5px 10px', background: 'white', border: '1px solid black', cursor: 'pointer'
                    }}
                >
                    Clear
                </button>
            )}
        </div>
    );
}
