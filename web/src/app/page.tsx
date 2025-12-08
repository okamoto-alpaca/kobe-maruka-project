import DocumentList from '@/components/DocumentList';
import FaxIngestViewer from '@/components/FaxIngestViewer';

export default function Home() {
  return (
    <main style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Left Pane (30%) */}
      <div style={{ width: '30%', height: '100%' }}>
        <FaxIngestViewer />
      </div>

      {/* Right Pane (70%) */}
      <div style={{ width: '70%', height: '100%', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>Kobe Maruka Dashboard</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/legacy" style={{ padding: '10px 20px', background: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
              Legacy View
            </a>
          </div>
        </div>
        <DocumentList />
      </div>
    </main>
  );
}
