PrivacyFold: Content, SEO and Ads Foundation
10 Nov 2026 · @Gaurav Suthar
1. The decision in one page
Build PrivacyFold as one Astro static site in one GitHub repo. Markdown and YAML files are the database, Sveltia CMS at /admin is the editing screen, and Cloudflare Pages is the host. Every SEO, AEO, structured-data and ad rule lives in shared page templates, so no editor can forget it or break it.
The principle behind every choice below: one tool record drives everything. A single tools/<slug>.yaml plus its Markdown body generates the HTML page, the JSON-LD, the sitemap entry, llms.txt, the static JSON API, the MCP manifest, the social cards and the ad eligibility. Nothing is typed twice.
Layer
Choice
Why this one
Site framework
Astro with content collections
Static HTML by default. Zod schemas validate every content file at build time. The tool UI loads as an island only on tool pages.
Content store
Markdown, MDX and YAML in the repo
Git history is your audit trail, review process and rollback. No database to run.
Editing screen
Sveltia CMS
A static single-page app served from your own site. It reads Decap-style config and supports i18n.
Login
Fine-grained GitHub token to start
Sveltia's docs say PKCE for GitHub is not available yet, so a no-server login means a token.
Hosting
Cloudflare Pages, free plan
500 builds a month, 20,000 files per site, 25 MiB per file (limits).
Ads
AdSense, manual slots only
A slot component that refuses to render unless the page has enough real content.
Quality control
GitHub Actions on every pull request
Content that fails a check cannot reach production.
What to build first, in order:
1. The repo skeleton: collections, page templates, the shared head component, and CI. Nothing is published yet.
2. Eight flagship tool pages written completely, to set the quality bar every later page is held to.
3. The CMS screen, so content work stops needing code edits.
4. Guides, glossary, and the trust pages AdSense expects (about, privacy, contact).
5. Ads on content sections only, then the preset pages at scale.
One fact shapes the whole AI-visibility plan. Google states that there are no additional requirements or special optimizations for AI Overviews and AI Mode, and that no special files, markup or schema are needed. So "GEO" here means strong, crawlable, well-sourced SEO pages. It does not mean tricks.
2. Architecture
Content flows one way: an editor saves in the CMS, GitHub receives a branch, CI checks it, Cloudflare builds a preview, and a merge publishes it. Visitors only ever receive static files.
Repo layout. Keep content and code in the same repo, but in separate folders, so an editor never needs to open src/.
privacyfold/
  content/                    # everything editors touch
    tools/        image-compress.yaml + image-compress.md
    presets/      us-passport-photo.yaml ...   # requirement data
    guides/       how-to-remove-photo-metadata.md
    glossary/     exif.md
    compare/      privacyfold-vs-cloud-compressors.md
    authors/      gaurav.yaml
    pages/        about.md privacy.md contact.md
    i18n/         hi/ ...                       # translated copies
  src/
    content.config.ts         # Zod schemas = the contract
    layouts/      Base.astro ToolPage.astro GuidePage.astro
    components/   Seo.astro JsonLd.astro AdSlot.astro Faq.astro Related.astro
    islands/      ToolShell (WASM tools mount here)
    pages/        tools/[slug].astro guides/[slug].astro ...
    pages/api/    tools.json.ts presets.json.ts llms.txt.ts   # build-time endpoints
  public/         robots.txt ads.txt _headers _redirects
  scripts/        og-images.ts check-content.ts
  .github/workflows/ci.yml
  admin/          index.html config.yml        # Sveltia CMS
Build pipeline. One command, astro build, runs these steps in order:
1. Validate every content file against its Zod schema. A bad field stops the build.
2. Render pages from layouts, with the shared head and JSON-LD attached automatically.
3. Write build-time endpoints: /tools.json, /presets.json, /llms.txt, /sitemap-index.xml.
4. Generate one Open Graph image per tool and per guide.
5. Run the content checks from section 12.
Environments. Cloudflare Pages gives every branch its own preview URL, and the docs list unlimited active preview deployments. Editors review on the preview URL before merging. Set X-Robots-Tag: noindex on preview hosts in _headers so previews never enter Google.
Budgets that decide how you structure pages. The free plan caps a site at 20,000 files and 500 builds a month. A rough count: 50 tools × 25 languages × 2 files (page + image) is 2,500 files, which is fine. Preset pages in many languages can pass 20,000 quickly. Share one Open Graph image per tool across all its presets, and batch your merges so you do not burn builds on small edits.
3. Content model
Eight collections cover everything you described, and each one is a folder of files with a fixed schema. The schema is the contract between editors and code: if a field is missing or malformed, the build fails with a message that names the file.
Collection
Holds
Must-have fields
Becomes
tools
One record per tool
slug, name, family, task phrase, answer block, tool engine id, params, related tools, reviewed date, reviewer
Tool page, JSON-LD, /tools.json, MCP manifest, llms.txt entry
presets
Requirement data for a portal or document
tool, country, document, width, height, max KB, format, source URL, verified date, version
Preset page, filled-in tool settings, /presets.json
guides
How-to and explainer articles
title, answer block, steps, author, published and updated dates, sources
Guide page, Article JSON-LD
glossary
One short definition per term
term, one-sentence definition, aliases, related tools
Glossary page, DefinedTerm JSON-LD, internal links
compare
PrivacyFold versus a category
claim list, each claim with a source
Comparison page
authors
People and reviewers
name, role, bio, links
Bylines, Person JSON-LD
pages
About, privacy, contact, terms
title, body
Trust pages that AdSense reviewers look for
i18n/<lang>
Translated copies of the above
same schema + translation_of, reviewed_by
/<lang>/... pages with hreflang
A tool record, as an editor sees it:
# content/tools/exif-strip.yaml
id: exif_strip
slug: exif-strip
name: Photo metadata remover
family: image
task: Remove location and camera data from a photo
answer: >-
  Open the photo, press Remove metadata, and download a clean copy.
  Everything happens in your browser, so the photo is never uploaded.
engine: exif_strip            # id the ToolShell island mounts
params:
  - { key: out, label: Save as, type: choice, default: jpeg }
related: [image-compress, passport-photo]
reviewed: 2026-11-10
reviewer: gaurav
status: live                  # draft | live | beta
index: true                   # false = noindex
social:
  hook: "Your photos know where you live."
The long-form text (how it works, settings explained, FAQ) sits in the matching .md file as normal Markdown with headings, so editors write it like a document.
Four rules that keep the model healthy:
1. Facts live in data, not prose. A preset's size limit exists once, in the preset file. The page, the tool settings, the JSON API and the schema all read it from there, so they can never disagree.
2. Every factual record carries source_url and verified. This is the trust signal for readers, search engines and AI answer systems, and it is what lets CI flag stale data.
3. status and index are separate. A page can be live for users but noindex while it is still thin.
4. Translations point back to a source record. translation_of lets CI detect when the original changed and the translation is out of date.
4. Git CMS: setup and workflow
Sveltia CMS gives editors a normal form-based screen at yoursite.com/admin, while every save becomes a commit or pull request in GitHub. Install it by adding two files to admin/ (a one-line HTML loader and config.yml). The starter config is in section 15.
Login without any server. Sveltia supports signing in with a pasted personal access token, stored in that browser's local storage. Use a fine-grained token limited to this one repo, with Contents and Pull requests set to read and write. The Sveltia docs also say that PKCE login for GitHub is "unimplemented", so the proper OAuth sign-in needs a small OAuth client, which Sveltia ships as a Cloudflare Worker. Your "no Workers" rule is about visitors, and this client would only ever run when an editor logs in, so it would stay inside the free tier. Decide when you add a second, non-technical editor (section 16).
The editorial workflow: every change is a pull request.
1. Editor opens /admin, edits a tool or guide, and presses Save in the editorial workflow.
2. Sveltia opens a pull request on its own branch. The GitHub backend supports the editorial workflow, including on protected branches, as long as the token has Pull requests access.
3. CI runs the content checks (section 12) and Cloudflare publishes a preview URL for that branch.
4. Reviewer reads the preview, fixes anything in the pull request, and merges.
5. The merge to main deploys to production.
Protect main. In GitHub, require the CI check to pass and one approval before merge, and block direct pushes. This is what makes "rock solid" real: nobody, including you at 2 a.m., can publish a page that fails the checks.
Roles without a user system. GitHub permissions are the roles: Write access for editors, Admin for you. A Reviewer is anyone listed in CODEOWNERS for a folder. For example, require your review on content/presets/** because those files carry factual claims.
Media. Editors upload images into public/uploads/. Add a CI step that rejects any image over 300 KB and any image without alt text in the page that uses it. Keep large videos out of the repo, since a Pages file is capped at 25 MiB.
What the CMS will not do for you. It edits fields, but it does not understand your rules. The Zod schema and the CI checks are the real gatekeepers, and the CMS form is a friendly front end for them. Keep admin/config.yml and content.config.ts in step: a CI script compares field names and fails if they drift.
Fallback if the CMS ever disappears. The content is plain Markdown and YAML in Git. Swapping Sveltia for Decap, Keystatic or just a code editor costs you the form screen and nothing else.
5. Tool page anatomy
Every tool page uses the same ten blocks in the same order. The top of the page is the product, the rest is the proof and the reading material that search engines, AI answer systems and AdSense reviewers need. A tool page that is only a widget is thin content, and ads on it are a policy risk (section 10).
#
Block
What it must contain
Ad slot
1
Title and answer
H1 in the words people search ("Remove EXIF data from a photo"), then a 40 to 60 word answer that stands alone if quoted
None
2
The tool
The ToolShell island. Drop zone, settings, result, flip-the-page back
Never
3
Trust line
"Runs in your browser. Nothing is uploaded." plus a link to the proof
None
4
How it works
3 to 5 numbered steps, each one sentence
Slot A (below, after this block)
5
Settings explained
Each setting, what it does, a safe default, an example of the effect
None
6
What to expect
Typical results with real numbers, and limits (file size, formats)
Slot B (between blocks 6 and 7)
7
Privacy and proof
How you can verify nothing leaves the device, with a link to the ledger and the open code
None
8
FAQ
5 to 8 real questions, written out in full on the page
None
9
Related
Related tools, guides and glossary terms, chosen by related and family
Slot C (end of the page)
10
Byline and freshness
Author, reviewer, reviewed date, change log link, sources list
None
Why this order works for all three audiences. People get the tool in the first screen. Search engines get a clear H1, a quotable answer, and a full body of text. AI systems get a self-contained answer block, a dated review stamp, and sources to cite.
Rules for the answer block (block 1).
• It answers the question in the title, in plain words, with no marketing.
• It names the action and the privacy fact, as in the example in section 3.
• It is the same text used in the meta description, the first line of llms.txt, and the JSON-LD description. Write it once.
Rules for the FAQ (block 8).
• Use questions you can verify people ask: Search Console queries, support mail, community threads.
• Each answer is 30 to 80 words and links to a deeper guide where one exists.
• The text is always visible. It stays in the HTML. Native details elements are fine, but nothing may load only after a click.
What makes a page eligible for ads. The page needs the ten blocks filled in, at least 600 words of original text outside the tool, a reviewed date in the last 12 months, and status: live. That 600-word figure is my working threshold, not a Google number. Section 10 explains how the build enforces it.
6. SEO foundation
All of this is produced by one Seo.astro component that every layout includes. Editors fill in frontmatter, and the component turns it into correct tags. A page cannot ship without them because the schema makes the fields required.
Element
Rule
Generated from
Title tag
Task phrase first, brand last, about 55 characters. Example: "Remove EXIF data from photos online
PrivacyFold"
Meta description
140 to 155 characters, the same text as the answer block
answer
Canonical
Absolute URL, one per page, always the clean URL without query parameters
route
Robots meta
index,follow, or noindex,follow when index: false or the page is stale
index, verified
Open Graph and Twitter
title, description, image, type, locale, site name
frontmatter + generated image
hreflang
Every language version lists every other, plus x-default, and each links back
i18n folder
Breadcrumbs
Visible trail plus BreadcrumbList JSON-LD
route
Headings
One H1. H2s are the section names from the blocks in section 5
template
Images
Width and height set, alt required by the schema, AVIF or WebP
schema
URL design (decide once, never change).
• /tools/<slug>/ for tools, /guides/<slug>/, /glossary/<term>/, /compare/<slug>/.
• Preset pages nest under their tool: /tools/passport-photo/us/, so the hierarchy is browsable and not a pile of keyword pages.
• Languages as a path prefix: /hi/tools/exif-strip/. Not subdomains, so authority stays on one host.
• Lowercase, hyphens, trailing slash everywhere, with Cloudflare redirects for any deviation.
The tool URL API needs special care. Your agent design puts settings in the query string (?quality=80). Those variants must never be indexed. Every variant sets <link rel="canonical"> to the clean page, and the sitemap lists only clean URLs. Files go in the fragment, which is never sent to a server.
Sitemaps. Generate a sitemap index with one sitemap per collection, so Search Console shows indexing per page type. Set lastmod from the real last Git commit date of the content file, not the build date. Google ignores priority and changefreq, so leave them out.
robots.txt. Allow everything public, point to the sitemap index, and block only /admin/ and preview hosts. The AI crawler rules are in section 8.
Internal linking, automated. Each tool page links to its related tools, its guides, and its glossary terms, and each guide links back to the tool it explains. A CI check fails any page with no inbound link from another page, because orphan pages rarely get indexed.
Open Graph images. scripts/og-images.ts renders a 1200 × 630 PNG per tool and per guide at build time, in the paper-fold style: tool name, the one-line task, the crane, and "Nothing uploaded". Cache the output between builds so image work does not eat your 20-minute build limit.
Indexing hygiene. Submit the sitemap index in Google Search Console and Bing Webmaster Tools. Use IndexNow for Bing and other participating engines when pages change.
7. Structured data (JSON-LD)
Use structured data to state facts about each page clearly and consistently. Do not expect it to unlock special results by itself. Google's own guidance says it wants structured data that matches the visible text, and that no special schema is needed for AI features.
Page type
Schema.org types
Notes
Home
Organization, WebSite
Logo, name, sameAs links to your social profiles. Same name and logo on every page.
Tool
WebApplication, BreadcrumbList
applicationCategory, operatingSystem: Any, offers.price: 0. See the rating warning below.
Guide
Article, Person author, BreadcrumbList
datePublished, dateModified from Git, author linked to the authors collection.
Glossary
DefinedTerm inside a DefinedTermSet
One term per page.
Preset
WebApplication + Dataset (optional)
Only if the requirement table is the page's main value.
FAQ block
FAQPage
Low priority. Only if the same questions and answers are visible on the page.
The rating warning. For software, Google's Software App guidance requires either aggregateRating or review for rich-result eligibility. You have no real ratings yet. Do not invent any. Fake ratings break Google's structured data guidelines and can trigger a manual action. Publish valid WebApplication markup without ratings for entity clarity, and add aggregateRating only when you collect genuine reviews and show them on the page.
What is still worth doing, and what is not.
• Worth it: Organization, WebSite, BreadcrumbList, Article, WebApplication. They are cheap, generated once, and describe the entity accurately.
• Not worth chasing: FAQ and HowTo. Neither appears in Google's current structured data gallery. I could not confirm their exact status from that page, so treat them as nice-to-have only.
• Never worth doing: markup for content that is not on the page, or any rating, review count or price you cannot show.
How it is built. JsonLd.astro takes a typed object from the page layout and prints one <script type="application/ld+json">. One builder per page type lives in src/lib/schema.ts, so a change to the Organization record fixes every page at once. The starter code is in section 15.
Validation. In CI, parse each page's JSON-LD and fail if it is invalid JSON, if name differs from the visible H1, or if dateModified is older than the last Git change to the file. Before launch, spot-check one page of each type in the Rich Results Test.
8. AEO, GEO and AI citations
Answer engines pick pages they can fetch, parse, trust and quote. Google says a page only needs to be indexed and snippet-eligible to be a supporting link in AI Overviews and AI Mode. The other assistants work the same way in spirit, so the plan below is about being easy to fetch and easy to quote. No tactic here depends on a secret.
Seven practices, in priority order:
1. Let the crawlers in. Allow search crawlers in robots.txt and make sure Cloudflare is not blocking them. Google lists this as a best practice: allow crawling "in robots.txt and by any CDN or hosting infrastructure".
2. Put the answer in the HTML. Your tools run on JavaScript, but the answer block, steps, FAQ and tables must be server-rendered text. Crawlers that do not run scripts then still see everything.
3. Lead every page with a quotable answer. The 40 to 60 word block from section 5 is the unit an assistant lifts. It needs no surrounding context to make sense.
4. Make facts verifiable. Every requirement table shows its source_url and verified date on the page. Readers can check them, and an answer system has something concrete to cite.
5. Keep one consistent entity. Same name, logo, one-line description and sameAs links everywhere (site, JSON-LD, social profiles, GitHub). Inconsistency makes you look like several small entities.
6. Stay fresh. Show reviewed and updated dates, and re-verify presets on a schedule (section 11).
7. Earn mentions off-site. Publish the open-source engine on GitHub, answer questions in relevant communities, and ask for listings in tool directories. Citations follow reputation, and you cannot template reputation.
Crawler policy: decide by purpose, not by vendor. Training crawlers and search crawlers are separate. OpenAI documents that OAI-SearchBot decides inclusion in ChatGPT search answers, GPTBot is for model training, and the settings are independent. Anthropic documents three agents with the same split.
Purpose
Agents
Recommendation
Search and citation
Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot
Allow. This is how you get cited.
User-initiated fetch
ChatGPT-User, Claude-User, Perplexity-User
Allow. A person asked an assistant about your page.
Model training
GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot
Your call. See section 16.
I verified the OpenAI and Anthropic names from their own pages. Check Google, Perplexity, Apple and Common Crawl names in each vendor's current docs before you ship the file.
Content Signals. Cloudflare's Content Signals Policy adds one line to robots.txt, such as Content-Signal: search=yes, ai-train=no, with three signals: search, ai-input and ai-train. It states your preference but does not enforce it. The starter file in section 15 includes it.
llms.txt: cheap, optional, unproven. Google's AI features page does not mention it, and nothing I found shows Google uses it. Generate a short one anyway from the tools collection, since it costs nothing and some agent tools read it. Do not spend editorial time on it.
Machine-readable surface. Your static JSON endpoints (/tools.json, /presets.json) and /.well-known/mcp.json are the agent-facing version of this section. Because they are built from the same records as the pages, they stay accurate for free.
What to measure. Track visits whose referrer is an assistant (chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com), and test a fixed list of 30 questions monthly in each assistant, noting whether you are cited. Record the results in a sheet. Expect noise: answers vary run to run.
9. Social media layer
Treat social as a distribution channel for the same records, not a second content job. Each tool and guide carries a small social block in its frontmatter, and the build turns it into share images, link previews and a ready-to-post queue.
What every page gets automatically
• Open Graph and Twitter card tags with a unique 1200 × 630 image (section 6).
• A share row under the answer block: copy link, WhatsApp, X, LinkedIn, Reddit, email. These are plain links, so no third-party scripts load and the privacy promise stays intact.
• UTM tags added only on links you post yourself, for example ?utm_source=linkedin&utm_medium=social&utm_campaign=exif-strip. The canonical tag strips them, so they never create duplicate pages.
The social block an editor fills in
social:
  hook: "Your photos know where you live."       # first line of every post
  proof: "One tap removes 6 hidden items."        # the concrete result
  hashtags: [privacy, photography]
  clip: exif-strip-demo.mp4                      # 15 second screen recording
  channels: [linkedin, x, reddit, whatsapp, instagram]
Channel plan. Match each channel to what it is good for, and skip channels you cannot keep up.
Channel
Best format
Fit for PrivacyFold
WhatsApp
A link with a clean preview, forwarded in family groups
Widely used in India. People forward "how to shrink this photo for the form". Make the preview image and title excellent.
YouTube Shorts and Instagram Reels
15 second before-and-after screen recording of the real tool
Your best content: the sticky notes peeling off a photo is a built-in hook.
LinkedIn
One practical tip with the result number and a link
Good for the privacy and developer audience.
Reddit and communities
Helpful answers that mention the tool where relevant
Follow each community's self-promotion rules, and lead with help.
X, Bluesky, Mastodon
Short post with a clip
Bluesky and Mastodon have open APIs that a GitHub Action can post to. X's API is paid, so post there by hand.
Pinterest
Origami-style infographics of requirements
Good fit for passport and ID size guides.
Workflow. A scheduled GitHub Action reads recent social blocks and writes social-queue.md with one drafted post per channel. You review the queue weekly, post the strong ones, and tick them off. Automating posts without review is how an account loses trust, so keep a human in the loop.
A repeatable series. Pick one format and run it weekly, such as "Photo secrets", where each post shows one thing a photo, PDF or document leaks and the tool that removes it. Every episode is a guide plus a tool, so the post, the guide and the tool page reinforce each other.
Be accurate in public. Every claim you post must match the tool page. If the page says "nothing is uploaded", the post says that too, and only when the ads decision in section 10 keeps it true on that page.
10. AdSense: placement system and policy rules
Build ads as a controlled system, not as script tags pasted into pages. One AdSlot component decides at build time whether a slot may render, and the rules below are enforced in code so an editor cannot cause a policy problem.
What Google's policies say, and what each means for you
Policy point
What the policy says
What you do
Accidental clicks
Be careful placing "links, play buttons, download buttons, navigation buttons" near ads. It also names "drop-down menus", "game windows" and "applications". Unintentional accidental clicks can still get a violation notice (program policies).
No ad inside or beside the tool, the result screen, or any download button.
Spacing
Google's only number is for game sites: "at least 150 pixels" from the game edge.
Use 150 px as your safety margin around the tool and any button. This is my choice, not a rule for tools.
Drawing attention
No flashy animation that draws the eye to ads. No disguising ads.
Label each slot "Advertisement". Keep the crane and other play effects away from ad slots.
Content value
No ads on screens "without publisher-content or with low-value content", or with "more ads or other paid promotional material than publisher-content" (inventory policy).
The word-count and ad-density gates below.
Consent
A certified CMP is required for personalized ads for users in the EEA and UK, and in Switzerland.
Add a certified consent banner before serving personalized ads there.
ads.txt
Optional but highly recommended, at the site root, in a fixed line format (ads.txt help).
Ship public/ads.txt from the start.
Google's text does not say how much text a tool page needs. The 600-word figure is my gate for reducing risk.
The slot component's rules. AdSlot.astro renders only when all of these are true:
1. site.ads.enabled is true and the page type is allowed.
2. The page is status: live, index: true, and reviewed within 12 months.
3. Original text outside the tool is at least 600 words (guides: 800).
4. Fewer than one ad per 400 words, and at most three per page.
5. The slot name is one of the approved positions (A, B, C, sidebar).
If any check fails, the component prints nothing and the page ships ad-free. The AdSense script is only added to pages that contain at least one rendered slot.
Approved positions
Slot
Where
Pages
Size handling
A
After the "How it works" block, below the tool
Tool pages (if enabled), guides
Responsive, reserved height 280 px
B
Mid-article, between two sections
Tool pages (if enabled), guides, comparisons
Responsive, reserved height 280 px
C
End of content, before "Related"
All content pages
Responsive, reserved height 280 px
Sidebar
Beside text only, desktop, sticky within the article column
Guides, glossary, comparisons
300 × 600, reserved
Never place ads here: inside the ToolShell, on the result screen, in modals or the command palette, in the flip-the-page back, in the first 120 px under the H1, or within 150 px of any button.
Turn off Auto ads, and use manual units only. Auto ads can insert units anywhere, including next to your download button, which is the exact pattern the policy warns about. Also avoid anchor and vignette formats on tool pages: a bottom-anchored ad on a phone can sit over the download button.
Layout stability. Every slot has a fixed min-height from the table above, so an ad that loads late does not push content. Test with the CLS budget from section 12.
The privacy conflict you must decide on. PrivacyFold's promise is that files never leave the device. An ad script is third-party code running on the page, and it also sets cookies. A reader who opens the network tab on a tool page with ads will see requests to Google. That undercuts your strongest claim exactly where it matters. Three ways to handle it:
Option
How it works
Trade-off
A. Ads on content pages only (recommended at launch)
Guides, glossary, comparisons, hubs and preset explainers carry ads. Tool pages ship with ads.toolPages: false. The network proof stays clean on every page where files are handled.
Tool pages earn nothing directly, but they feed traffic to the pages that do.
B. Ads below the tool
Slots A, B, C on tool pages, with the tool above.
Highest revenue, and the proof claim becomes "your file is not uploaded" with ad requests listed separately. Weakens the brand.
C. Sealed tool frame
The tool runs in an iframe on a separate host such as tool.privacyfold.com, and the ads live on the parent page. A different origin means the parent's scripts cannot read the tool's memory.
Strongest honest answer, but it adds hosting, drag-and-drop and layout complexity. Revisit once traffic justifies it.
AdSense onboarding sequence
1. Publish first, with real content: the eight flagship tools, at least 20 guides and glossary entries, plus About, Privacy, Contact and Terms pages.
2. Add the site in AdSense, place the verification snippet, and publish ads.txt with your own publisher ID line.
3. While the review runs, keep the site ad-free. Approval is a review of the whole site, so thin pages anywhere can hurt it.
4. After approval, enable ads on one page type, check the Policy center and CLS, then widen.
5. Add the consent banner before you turn ads on for visitors from the EEA, UK or Switzerland.
Also write your own Privacy page honestly: say which pages load ad scripts, what they set, and that tool pages that handle files do not (under option A).