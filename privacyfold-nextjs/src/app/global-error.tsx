'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Local Execution Interrupted | PrivacyFold</title>
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#fbfbfa',
          color: '#1a1a19',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
          <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '12px' }}>
            PrivacyFold Local Engine Interrupted
          </h1>
          <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.5', marginBottom: '20px' }}>
            An unhandled runtime error occurred in your local browser sandbox. No user files or inputs have been transmitted anywhere.
          </p>
          <div
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #f3f4f6',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: '#6b7280',
              marginBottom: '24px',
              wordBreak: 'break-word',
            }}
          >
            {error.message || 'Fatal client bootstrap fault.'}
          </div>
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
            Reload Workspace
          </button>
        </div>
      </body>
    </html>
  );
}
