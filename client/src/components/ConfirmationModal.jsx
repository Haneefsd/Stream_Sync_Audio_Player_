import React, { useEffect } from 'react';
import { Info, CheckCircle, Trash2, Edit3, PlusSquare } from 'lucide-react';

export default function ConfirmationModal({
  title,
  message,
  confirmText,
  cancelText,
  actionType,
  onConfirm,
  onCancel,
}) {
  // Determine colors and icons based on actionType
  let accentColor = 'var(--accent-cyan)';
  let bgGradient = 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)';
  let Icon = Info;
  let textColor = '#fff';

  if (actionType === 'delete' || actionType === 'danger') {
    accentColor = '#ef4444'; // Red
    bgGradient = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%)';
    Icon = Trash2;
  } else if (actionType === 'create') {
    accentColor = 'var(--accent-emerald)';
    bgGradient = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)';
    Icon = PlusSquare;
    textColor = '#000';
  } else if (actionType === 'update') {
    accentColor = 'var(--accent-indigo)';
    bgGradient = 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)';
    Icon = Edit3;
  }

  // Prevent background scrolling and handle Escape key
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel, onConfirm]);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      
      <div style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${accentColor}40`,
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '420px',
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
        overflow: 'hidden',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          padding: '2rem 1.75rem 1.5rem',
          background: bgGradient,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: `${accentColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            marginBottom: '0.25rem'
          }}>
            <Icon size={28} strokeWidth={2.5} />
          </div>
          
          <h2 style={{
            margin: 0,
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.01em'
          }}>
            {title}
          </h2>
          
          <p style={{
            margin: 0,
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            {message}
          </p>
        </div>

        <div style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: accentColor,
              border: 'none',
              color: textColor,
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: `0 4px 12px ${accentColor}40`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 16px ${accentColor}60`;
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = `0 4px 12px ${accentColor}40`;
              e.currentTarget.style.filter = 'none';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
