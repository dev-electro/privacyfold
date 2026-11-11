'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log locally without transmitting PII or user file content
    console.error('[PrivacyFold Error Boundary]', error.message);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#fbfbfa',
        color: '#1a1a19',
        fontFamily: "'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e3',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px',
          }}
        >
          Local Execution Interrupted
        </div>

        <h1
          style={{
            fontSize: '24px',
            lineHeight: '1.25',
            fontWeight: 600,
            fontFamily: "'Bricolage Grotesque', sans-serif",
            marginBottom: '12px',
            color: '#111827',
          }}
        >
          Something interrupted this tool run
        </h1>

        <p
          style={{
            fontSize: '15px',
            lineHeight: '1.5',
            color: '#4b5563',
            marginBottom: '20px',
          }}
        >
          Your privacy guarantee is fully preserved: <strong>zero bytes left your device</strong>. The error occurred purely within your local browser sandbox.
        </p>

        <div
          style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #f3f4f6',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '13px',
            fontFamily: "'DM Mono', monospace",
            color: '#6b7280',
            marginBottom: '24px',
            wordBreak: 'break-word',
          }}
        >
          {error.message || 'An unexpected client execution fault occurred.'}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 18px',
              backgroundColor: '#1a1a19',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Retry Local Operation
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 18px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Return to Desk
          </Link>
        </div>
      </div>
    </div>
  );
}
