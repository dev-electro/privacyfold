# Admin CMS authentication — how login works and why it's secure

DEC-008. Files shipped: `public/admin/index.html` + `public/admin/config.yml` (move to the Astro `public/` at PF-002 — path already correct for the Astro static layout).

## The auth chain (what actually happens when you sign in)

```
privacyfold.com/admin (Sveltia app, static)
        │  1. click "Sign in with GitHub"
        ▼
sveltia-cms-auth Worker (our Cloudflare Worker)  ─ holds GITHUB_CLIENT_SECRET server-side
        │  2. redirects → github.com/login/oauth/authorize?client_id=…
        ▼
GitHub consent screen (your GitHub account authenticates)
        │  3. callback → Worker /callback
        ▼
Worker exchanges code+secret for an access token  →  hands ONLY the token to Sveltia
        │
        ▼
Sveltia uses the token for Contents/PR API calls until you sign out or revoke it
```

Only the Worker ever holds the client secret; the repo and the browser never see it. This is the official flow documented by Sveltia themselves (`sveltia/sveltia-cms-auth`), NOT a hand-rolled one.

## Why this beats the alternatives

| Path | What's stored client-side | Verdict |
|---|---|---|
| **Fine-grained GitHub PAT** (plan §4 default) | a long-lived token **in localStorage**; whoever reads it has repo write; revocation is the only expiry | workable fallback ONLY, never the daily path |
| **+ this Worker (chosen)** | the OAuth token Sveltia receives — same storage location, but never the *client secret*, revocable centrally from the OAuth app page, and scoped identity per GitHub account | secure-enough single-control |
| **+ Cloudflare Access (add)** | a **WAF/Zero-Trust gate in front of `/admin/*` *before any CMS code loads*** — email one-time-PIN or your IdP decides who even reaches the login, per-device | the strongest available without a server — adds what the OAuth flow lacks (a bouncer, not just a badge) |

## Making the token-theft surface small (what good looks like here)

A static CMS's worst realistic case is token theft from the browser (the token must sit in Sveltia's localStorage while you edit — that's inherent). The stack makes that case survivable:

1. **Cloudflare Access on `/admin*`** (Cloudflare dashboard → Zero Trust → Access → Applications → Add self-hosted app; domain `privacyfold.com/admin`; policy: email `you@...` → One-time PIN). Even if Sveltia's CDN asset (`unpkg.com/@sveltia/cms`) were ever compromised, the attacker hits Access, not the site.
2. **Self-host the Sveltia bundle** into `public/admin/cms.js` with an SRI hash — drops the third-party script dependency entirely (do at PF-002; unpkg is the remaining CDN in the chain today).
3. **GitHub-side containment** (do once, in GitHub → Settings): branch `main` protected with the CI check required + 1 approval + no force-push; the OAuth app token can only do what a normal account to this repo can — so even a stolen token can't rewrite `git history`, and every change is visible as a PR/Diff.
4. **CSP for /admin** guards XSS: Sveltia is one self-hosted `<script src>`; no ads, no analytics on the CMS route.
5. **Expiry + audit**: cost is contained because GitHub access tokens here are app-scoped (revoke-all instantly from the OAuth app page) — not because they expire (GitHub OAuth app tokens don't).

## Setup steps (two values only you can mint; everything else is already in the repo)

1. Workers → deploy the official `sveltia-cms-auth` (one-click deploy button on that repo, or `git clone` + `npx wrangler deploy` from it) → note the URL.
2. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App: homepage any URL, callback `<WORKER_URL>/callback` → copy Client ID, generate Client Secret.
3. Workers dashboard → `sveltia-cms-auth` → Settings → Variables → `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` (Encrypt) → deploy.
4. `public/admin/config.yml` → replace `base_url: https://sveltia-cms-auth.<SUBDOMAIN>.workers.dev` with the real URL → commit.
5. Cloudflare Zero Trust → Access → Applications → protect `/admin*` (step 1 above).

After step 4, `privacyfold.com/admin` → "Sign in with GitHub" → Sveltia opens the Tools collection; editorial workflow creates the PR and the preview per DEC-004.
