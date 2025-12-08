import LegacySalesView from '@/components/LegacySalesView';

export default function LegacyPage() {
    return (
        <main style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
            <h1 style={{ marginBottom: '20px' }}>Sales Instruction (Legacy View)</h1>
            <LegacySalesView />
        </main>
    );
}
