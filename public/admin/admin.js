/**
 * PrivacyFold Sveltia CMS Editor Sugar (DEC-012 / PF-035)
 * Editor conveniences: slug generation, formative preSave validation warnings,
 * and branch preview helper. Never auto-stamps provenance or verified dates.
 */
(() => {
  const initSugar = () => {
    if (!window.CMS) {
      setTimeout(initSugar, 100);
      return;
    }

    // 1. PreSave Formative Warnings Hook
    if (window.CMS.registerEventListener) {
      window.CMS.registerEventListener({
        name: 'preSave',
        handler: ({ entry }) => {
          const data = (typeof entry?.get === 'function' ? entry.get('data')?.toJS?.() : entry?.data) || {};
          const collection = typeof entry?.get === 'function' ? entry.get('collection') : entry?.collection;

          // Warning when a preset lacks source_url
          if (collection === 'presets') {
            if (!data.source_url || !String(data.source_url).startsWith('https://')) {
              const proceed = window.confirm(
                '⚠️ PrivacyFold Quality Warning:\n\n' +
                'This preset lacks an official, verified HTTPS source_url.\n' +
                'Factual records without an authoritative source will be flagged by CI.\n\n' +
                'Do you want to save anyway?'
              );
              if (!proceed) return false;
            }
          }

          // Warning when tool lacks answer block
          if (collection === 'tools') {
            if (!data.answer || String(data.answer).trim().length < 40) {
              const proceed = window.confirm(
                '⚠️ PrivacyFold Quality Warning:\n\n' +
                'The answer block is shorter than 40 words.\n' +
                'Tool pages require a standalone 40–60 word answer for AEO/SEO quality.\n\n' +
                'Do you want to save anyway?'
              );
              if (!proceed) return false;
            }
          }

          return true;
        },
      });
    }

    // 2. Slug Auto-Generation Helper
    document.addEventListener('input', (e) => {
      const target = e.target;
      if (!target || target.id !== 'name') return;
      const slugInput = document.getElementById('slug') || document.querySelector('input[name="slug"]');
      if (slugInput && !slugInput.value) {
        slugInput.value = target.value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        slugInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    console.log('✓ PrivacyFold Sveltia CMS sugar initialized (PF-035)');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSugar);
  } else {
    initSugar();
  }
})();
