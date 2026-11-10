# Sveltia CMS — how it is configured, and where you edit `content/tools`

Answers to: "how will it be configured?" and "where will I make edits to content/tools?"
Blueprint: `docs/plans/content-seo-ads-foundation-2026-11-10.md` §4 (DEC-004).

## The three files (all in the repo, nothing else to install)

```
admin/
  index.html     # ~15 lines: loads Sveltia + points at config.yml
  config.yml     # the CMS: backend, collections, fields — mirrors content.config.ts
```

`admin/index.html` (starter, complete):

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PrivacyFold CMS</title>
</head>
<body>
  <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" async></script>
  <script>
    window.CMS_CONFIG = { config_location: 'config.yml' }; // Sveltia loads it itself
  </script>
  <!-- content is loaded from GitHub; /admin is data-only, robots-disallowed (PF-027) -->
</body>
</html>
```

## Where you edit `content/tools`

**At `https://privacyfold.com/admin`** → sign in → collection **"Tools"** → each tool is one entry card (Photo metadata remover, Image compressor, …). Clicking one opens a form with every field from the tool record:

- Data fields (from the record): `name`, `family` (dropdown of the 6 families), `task`, `answer` (the 40–60-word quotable block), `engine`, `params` (repeatable widget), `related` (relation picker), `status` (draft/beta/live), `index`, `reviewed`, `reviewer`, `social.hook/proof/hashtags`.
- **Body**: a rich-text/Markdown editor for the long-form sections (How it works, Settings explained, What to expect, Privacy & proof, FAQ, sources).

**What actually happens on Save** (editorial workflow, default): Sveltia writes the file to a **new branch** and opens a pull request. You then see it on the Cloudflare Pages preview URL for that branch, review like any PR, and **merge to main → site publishes**. No commit from your IDE required, but the file in Git is the same source your build reads — `git log` is the audit trail, which is the whole point.

Fallback that always works: editing the same files by hand in a code editor / VS Code web. The CMS is a form over plain Markdown/YAML; if Sveltia ever disappears, switch config to Decap/Keystatic and lose nothing.

## Login — the one thing that needs your decision

Sveltia cannot do no-server OAuth for GitHub yet (the plan §4 states PKCE is unavailable there). Two supported options:

| Option | Setup | Owner effort |
|---|---|---|
| **Fine-grained GitHub token** (plan's default, start here) | GitHub → Settings → Developer settings → Fine-grained tokens → New: **repository access = privacyfold only**, permissions: `Contents: read/write`, `Pull requests: read/write`. Paste the token into the Sveltia login box. Stored in your browser's local storage only. | 2 minutes, per browser |
| **Sveltia auth Worker** (later, when a second editor joins) | Sveltia ships `sveltia-cms-auth` as a small Cloudflare Worker for real GitHub OAuth. Runs only when an editor signs in — inside the free tier, and does not violate the "no Workers for visitors" rule (DEC-004 note). | ~30 min once |

Rotation note: if the token is ever in a screenshot or a browser you don't control, revoke/regenerate in GitHub — the CMS holds no data of its own.

## `admin/config.yml` starter for PrivacyFold's 8 collections

Matches `content/` as designed in the plan §3 (collections mirror `content.config.ts`; a CI script checks field drift between the two, PF-026):

```yaml
backend:
  name: github
  repo: dev-electro/privacyfold
  branch: main
  # editorial workflow writes to a branch and opens a PR instead of committing to main
workflow: editorial            # Sveltia key for draft→review→publish
locale: en
media_folder: public/uploads
public_path: /uploads
site_url: https://privacyfold.com
collections:
  - name: tools
    label: Tools
    folder: content/tools
    create: true
    slug: '{{slug}}'
    extension: md              # one record = one .md with frontmatter (see note below)
    summary: '{{name}} · {{family}} · {{status}}'
    fields:
      - { label: Slug, name: slug, widget: string }
      - { label: Name, name: name, widget: string }
      - { label: Family, name: family, widget: select, options: [photo, pdf, forms, image, dev, crypto] }
      - { label: Task phrase, name: task, widget: string }
      - { label: Answer (40–60 words, quotable), name: answer, widget: text }
      - { label: Engine id, name: engine, widget: string }
      - { label: Params, name: params, widget: list, collapsed: false,
          fields: [ { label: Key, name: key, widget: string },
                    { label: Label, name: label, widget: string },
                    { label: Type, name: type, widget: select, options: [text, number, range, choice, bool, swatch] },
                    { label: Default, name: default, widget: string },
                    { label: Choices, name: opts, widget: list, required: false, fields: [ { label: Value, name: v, widget: string }, { label: Label, name: t, widget: string } ] } ] }
      - { label: Related tools, name: related, widget: list, required: false }
      - { label: Status, name: status, widget: select, options: [draft, beta, live], default: draft }
      - { label: Allow indexing, name: index, widget: boolean, default: true }
      - { label: Reviewed date, name: reviewed, widget: date }
      - { label: Reviewer, name: reviewer, widget: string }
      - { label: Social hook, name: hook, widget: string, required: false, media_library: {} }
      - { label: Body (How it works → FAQ), name: body, widget: markdown }
# … same pattern for: presets (folder content/presets, one .yaml per portal,
#    fields mirror §3: tool, country, document, width, height, maxKB, format,
#    source_url, verified, version), guides, glossary, compare, authors,
#    pages (about/privacy/contact/terms), i18n/<lang> (with translation_of)
```

## One content-model recommendation this config exposes (flag for PF-003)

The plan shows a tool as **two files** (`<slug>.yaml` + `<slug>.md`). Sveltia (and Decap) handle a folder collection as **one entry = one file**, so the cleaner CMS contract is **one `.md` per tool** with all record data in frontmatter and the long-form text as the body. Same schema in `content.config.ts`, one file per entry, CMS-friendly, and `git mv`-reversible. Decide it in PF-003 when the collections are converted — it changes 72 files' shape, not a single field's meaning.
