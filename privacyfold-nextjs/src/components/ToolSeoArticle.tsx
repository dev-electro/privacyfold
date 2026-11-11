import React from 'react';
import type { GitCmsTool } from '@/lib/git-cms';
import { getAllToolsFromGit } from '@/lib/git-cms';
import { FAMILIES } from '@/lib/tools/registry';
import { generateToolJsonLdGraph } from '@/lib/seo/schema-generator';
import { AdSenseUnit } from './AdSenseUnit';

export function ToolSeoArticle({ tool, presetTitle, presetDesc }: { tool: GitCmsTool; presetTitle?: string; presetDesc?: string }) {
  const famName = FAMILIES[tool.fam]?.name || 'Utility';
  const canonicalUrl = `https://privacyfold.com/tools/${tool.slug}/`;
  const jsonLd = generateToolJsonLdGraph(tool, canonicalUrl);
  const related = getAllToolsFromGit().filter((t) => t.fam === tool.fam && t.id !== tool.id).slice(0, 4);

  return (
    <div className="seo-wrap">
      <div className="seo-main">
        <AdSenseUnit slotId={`pf-${tool.slug}-top`} format="leaderboard" />

        <article className="seo-card">
          <div className="kick">TECHNICAL SPECIFICATION &amp; USER GUIDE · {famName.toUpperCase()}</div>
          <h2>{presetTitle || `How ${tool.name} Works Locally in Your Browser`}</h2>

          <div className="aeo-box">
            <span className="aeo-k">Direct Answer Summary (Optimized for Search &amp; AI Citations)</span>
            <p>{tool.seo.aeoSummary}</p>
          </div>

          <p>{presetDesc || tool.desc}</p>

          <h3>Step-by-Step Instructions</h3>
          <ol>
            {tool.seo.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>

          {tool.settingsExplained && tool.settingsExplained.length > 0 && (
            <>
              <h3>Settings Explained &amp; Safe Configurations</h3>
              <div className="settings-list" style={{ display: 'grid', gap: '14px', margin: '16px 0 24px 0' }}>
                {tool.settingsExplained.map((s, idx) => (
                  <div key={idx} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>{s.name}</div>
                    <p style={{ margin: '6px 0 8px 0', fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>{s.description}</p>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      <span>Safe Default: <code>{s.safeDefault}</code></span> · <span>Example: <em>{s.example}</em></span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tool.whatToExpect && (
            <>
              <h3>What to Expect &amp; Performance Benchmarks</h3>
              <p style={{ fontSize: '14.5px', color: '#374151', lineHeight: '1.6' }}>{tool.whatToExpect.results}</p>
              <div style={{ background: '#f8fafc', borderLeft: '4px solid #3b82f6', padding: '12px 16px', margin: '14px 0', fontSize: '13.5px', color: '#1e293b' }}>
                <div><strong>Execution Latency:</strong> {tool.whatToExpect.benchmarks}</div>
                <div style={{ marginTop: '4px' }}><strong>Supported Limits:</strong> {tool.whatToExpect.limits}</div>
              </div>
            </>
          )}

          {tool.privacyProof && (
            <>
              <h3>Privacy Verification &amp; Technical Guarantee</h3>
              <p style={{ fontSize: '14.5px', color: '#374151', lineHeight: '1.6' }}>{tool.privacyProof.howItWorks}</p>
              <ol style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
                {tool.privacyProof.verificationSteps.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{step}</li>
                ))}
              </ol>
              <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', marginTop: '10px' }}>
                {tool.privacyProof.openSourceNotice}
              </p>
            </>
          )}

          <h3>Architecture &amp; Standards Comparison</h3>
          <table className="spec-tbl">
            <thead>
              <tr>
                <th>Attribute</th>
                <th>PrivacyFold Local Engine</th>
                <th>Traditional Online Converters</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Execution Runtime</strong></td>
                <td>{tool.wasmModule} (In-Browser RAM)</td>
                <td>Remote Cloud Server Buckets</td>
              </tr>
              <tr>
                <td><strong>Standard Compliance</strong></td>
                <td>{tool.std}</td>
                <td>Opaque Server Scripts</td>
              </tr>
              <tr>
                <td><strong>Data Uploaded</strong></td>
                <td><strong>0 Bytes (Verified per run)</strong></td>
                <td>Full File Uploaded Over HTTPS</td>
              </tr>
              <tr>
                <td><strong>Offline Capability</strong></td>
                <td>Works Offline (PWA Service Worker)</td>
                <td>Requires Internet Connection</td>
              </tr>
              <tr>
                <td><strong>AI Agent / MCP Support</strong></td>
                <td><code>privacyfold.{tool.id}</code> via <code>@privacyfold/mcp</code></td>
                <td>None or Paid API Quota</td>
              </tr>
            </tbody>
          </table>
        </article>

        <section className="seo-card" aria-label="Frequently Asked Questions">
          <div className="kick">FREQUENTLY ASKED QUESTIONS</div>
          <h2>Common Questions About {tool.name}</h2>
          <div className="faq-list">
            {tool.seo.faqs.map((f, idx) => (
              <details key={idx} className="faq-item" open={idx === 0}>
                <summary>{f.question}</summary>
                <div className="faq-a">{f.answer}</div>
              </details>
            ))}
          </div>

          {tool.byline && (
            <footer style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
              <div>
                Authored by <strong>{tool.byline.author}</strong> · Technical Review by <strong>{tool.byline.reviewer}</strong> · Audited: <time>{tool.byline.reviewedDate}</time>
              </div>
              {tool.byline.sources && tool.byline.sources.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  Authoritative Standards &amp; References:{' '}
                  {tool.byline.sources.map((src, i) => (
                    <span key={i}>
                      {i > 0 && ' · '}
                      <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>
                        {src.name}
                      </a>
                    </span>
                  ))}
                </div>
              )}
            </footer>
          )}
        </section>
      </div>

      <aside className="seo-main">
        <AdSenseUnit slotId={`pf-${tool.slug}-sidebar`} format="rectangle" label="Sponsored · Sidebar (300×250)" />
        <div className="seo-card">
          <div className="kick">RELATED {famName.toUpperCase()} TOOLS</div>
          <h3 style={{ marginTop: 0 }}>More {famName} Utilities</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '8px' }}>
            {related.map((rt) => (
              <li key={rt.id}>
                <a href={`/tools/${rt.slug}/`} style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline' }}>
                  {rt.name}
                </a>{' '}
                — <span style={{ fontSize: '13.5px', color: 'var(--ink-2)' }}>{rt.task}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
