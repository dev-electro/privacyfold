'use client';
import React from 'react';

export interface AdSenseUnitProps {
  slotId: string;
  format?: 'leaderboard' | 'rectangle' | 'in-article';
  label?: string;
}

export function AdSenseUnit({ slotId, format = 'leaderboard', label = 'Sponsored · Privacy-Safe Placement' }: AdSenseUnitProps) {
  return (
    <aside
      className={`ad-slot ${format === 'rectangle' ? 'tall' : ''}`}
      aria-label="Sponsored advertisement"
      data-ad-slot={slotId}
      data-npa="1"
    >
      <div className="ad-top">
        <span className="ad-badge">{label}</span>
        <span>slot={slotId} · npa=1</span>
      </div>
      <div className="ad-body">
        <b>Privacy-First Developer &amp; Document Hardware</b>
        <span>
          Contextual, non-personalized placement. Isolated below the workspace to prevent accidental clicks and guarantee 0.00 CLS.
        </span>
      </div>
      <div className="ad-foot">
        <span>Google AdSense Policy Compliant</span>
        <span>Reserved height (0.00 CLS)</span>
      </div>
    </aside>
  );
}
