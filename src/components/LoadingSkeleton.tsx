import { Loader2 } from 'lucide-react';

export default function LoadingSkeleton() {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
        gap: '16px',
      }}
    >
      <div 
        className="glass-panel" 
        style={{
          padding: '40px',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          background: 'rgba(15, 15, 20, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        }}
      >
        <Loader2 
          size={48} 
          style={{ 
            color: '#818cf8',
            animation: 'spin 1s linear infinite'
          }} 
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#e4e4e7' }}>
            Loading Workspace...
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#71717a' }}>
            Preparing 3D environment and tools
          </p>
        </div>
      </div>
    </div>
  );
}
