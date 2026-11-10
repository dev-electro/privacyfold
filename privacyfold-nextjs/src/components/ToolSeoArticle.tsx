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
