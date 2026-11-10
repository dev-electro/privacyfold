'use client';
import React, { useEffect } from 'react';

export function PrivacyFoldApp({ initialToolSlug }: { initialToolSlug?: string }) {
  useEffect(() => {
    if (initialToolSlug && typeof window !== 'undefined' && !window.location.hash) {
      window.location.hash = initialToolSlug;
    }
    if (!document.getElementById('pf-runtime-script')) {
      const sc = document.createElement('script');
      sc.id = 'pf-runtime-script';
      sc.src = '/app-runtime.js';
      sc.async = true;
      document.body.appendChild(sc);
    }
  }, [initialToolSlug]);

  return (
    <div
      id="pf-root-shell"
      dangerouslySetInnerHTML={{
        __html: ""
      }}
    />
  );
}
