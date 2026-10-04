import React, { useState, useRef } from 'react';
import { Upload, FileText, RefreshCw } from 'lucide-react';
import { TermsheetExtractionResponse } from '../types';
import { ManualEntryFallback } from './ManualEntryFallback';

interface UploadZoneProps {
  onExtractionComplete: (response: TermsheetExtractionResponse) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onExtractionComplete,
  isLoading,
  setIsLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [rejection, setRejection] = useState<{ reason: string; guidance: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setRejection(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: TermsheetExtractionResponse = await response.json();

      if (data.is_rejected) {
        setRejection({
          reason: data.rejection_reason || 'DOCUMENT_REJECTED',
          guidance: data.rejection_guidance || 'Uploaded file could not be parsed as a structured product.',
        });
      } else {
        onExtractionComplete(data);
      }
    } catch (err: any) {
      setRejection({
        reason: 'NETWORK_ERROR',
        guidance: err.message || 'Failed to upload termsheet. Please check server connectivity and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto 20px' }}>
      {/* Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        style={{
          border: isDragOver ? '2px dashed var(--terracotta-primary)' : '2px dashed var(--border-medium)',
          background: isDragOver ? 'var(--terracotta-light)' : 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 24px',
          textAlign: 'center',
          cursor: isLoading ? 'wait' : 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <RefreshCw
              size={42}
              style={{
                color: 'var(--terracotta-primary)',
                animation: 'spin 1.5s linear infinite',
              }}
            />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Analyzing Termsheet Economics...
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Multimodal OCR extraction, PII scrub, and financial parameter structuring in progress.
              </p>
            </div>
            {/* Animated Skeleton bars */}
            <div style={{ width: '80%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '6px', width: '60%', background: 'var(--border-subtle)', borderRadius: '4px', margin: '0 auto', animation: 'pulse 1.5s infinite 0.2s' }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--terracotta-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--terracotta-border)',
              }}
            >
              <Upload size={26} style={{ color: 'var(--terracotta-primary)' }} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Drop Termsheet PDF or Image Here
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Supports DCI, Fixed Coupon Notes (FCN), Step-Up/Down Autocalls & Twin-Win Notes (up to 25MB)
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '6px' }}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FileText size={16} />
              Browse Termsheet
            </button>

            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Strict Zero-Retention: In-memory byte streaming. No client values or identities are stored.
            </span>
          </div>
        )}
      </div>

      {/* Rejection / Warning Guidance Banner */}
      {rejection && (
        <ManualEntryFallback 
          rejectionReason={rejection.reason} 
          guidance={rejection.guidance} 
          onRetry={() => {
            setRejection(null);
            fileInputRef.current?.click();
          }} 
        />
      )}

      {/* Embedded CSS animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
