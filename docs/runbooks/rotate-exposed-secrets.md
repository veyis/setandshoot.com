# Runbook: rotate the secrets exposed in a Claude Code transcript (2026-06-13)

> **Uncommitted by design.** This repo is **public**. This file contains no
> secret values (only env-var names and the non-secret OAuth client ID), so
> committing it is low-risk — but the decision is yours. Delete it once the
> rotation is done if you'd rather not keep it.

## What happened

During a session on 2026-06-13, a `grep` over `.env.local` printed two live
secret **values** into the assistant transcript:

| Env var                        | What it is                                                         | Exposure                  |
| ------------------------------ | ------------------------------------------------------------------ | ------------------------- |
| `GOOGLE_CLIENT_SECRET`         | OAuth client secret for Google Cloud OAuth client `829316570560-…` | value shown in transcript |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini / Generative AI API key (`AQ.…`)                            | value shown in transcript |

`.env.local` itself is gitignored and was **never committed** (verified:
`git log --all -- .env.local` is empty), so the repo is clean. The only
exposure surface is the transcript. Rotate both as a precaution.

> Client IDs are **not** secret (they ship in the browser), so the IDs above are
> safe to write down. Only the **secret** and the **API key** need rotation.

## Important context before you start

- **The exposed Google OAuth secret (`829316570560-…`) may not even be in use by
  production.** The live sign-in flow on `setandshoot.com` was observed using a
  **different** Google OAuth client, `516759701042-…`, which is configured inside
  the **Neon Auth console** (not in this repo's env). That client's secret was
  **never** in the transcript, so it does not require rotation from this incident.
  - Action: first decide whether `829316570560-…` is still used by anything. If
    nothing uses it, **delete the whole OAuth client** instead of rotating, and
    remove `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from `.env.local`.
- Secrets must be updated **everywhere they're configured**, not just
  `.env.local`: check **Vercel project env vars** (prod/preview/dev) and any CI.

---

## 1. `GOOGLE_GENERATIVE_AI_API_KEY` (Gemini key) — rotate

This is the clearer case; do it first.

1. **Find where it was issued.** A `AQ.…`-prefixed key is a Google API key —
   check **Google AI Studio** (https://aistudio.google.com/apikey) and, if not
   there, **Google Cloud Console → APIs & Services → Credentials**
   (https://console.cloud.google.com/apis/credentials), under **API Keys**.
2. **Create a new key** (AI Studio: "Create API key"; Cloud: "Create credentials
   → API key"). Restrict it (API restriction = Generative Language API; add an
   application restriction if your usage allows).
3. **Find every place the old key is configured** and replace it with the new
   value:
   - `.env.local` (local dev) — edit `GOOGLE_GENERATIVE_AI_API_KEY=…`.
   - Vercel: `vercel env ls` → if `GOOGLE_GENERATIVE_AI_API_KEY` is listed,
     `vercel env rm GOOGLE_GENERATIVE_AI_API_KEY production` then
     `vercel env add GOOGLE_GENERATIVE_AI_API_KEY production` (repeat for
     `preview`/`development` if present). A redeploy picks up the new value.
   - Any other host/CI that runs this app.
4. **Delete the old key** in the console once nothing references it.
5. **Verify** whatever feature uses Gemini still works (it wasn't found wired
   into `src/` during the session, so confirm where/if it's actually consumed —
   if nothing uses it, just delete the key and drop the env var).

---

## 2. `GOOGLE_CLIENT_SECRET` (OAuth client `829316570560-…`)

### 2a. First: is this client used anywhere?

- Search the app + infra for `829316570560`. During the session, nothing in
  `src/` referenced `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` for auth — Neon Auth
  holds the prod Google credentials in its own console (and uses the _other_
  client, `516759701042-…`).
- Check Vercel env (`vercel env ls`) for `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- Check the **Neon Auth console** → your project → Auth / social providers →
  Google: note which client ID is configured there (expected: `516759701042-…`).

**If `829316570560-…` is configured nowhere** → go to 2c (delete it).
**If it is configured somewhere** → go to 2b (rotate it).

### 2b. Rotate the secret (if the client is in use)

1. Google Cloud Console → **APIs & Services → Credentials**
   (https://console.cloud.google.com/apis/credentials) → open OAuth 2.0 Client
   `829316570560-…`.
2. **Add secret** (new clients support multiple secrets) — or, on older clients,
   **Reset secret**. Adding-then-removing avoids downtime.
3. Put the new secret everywhere the client is configured:
   - `.env.local` → `GOOGLE_CLIENT_SECRET=…`
   - Vercel env (if present) — remove + re-add as in step 1.4 above.
   - **Neon Auth console** — only if `829316570560-…` is the client Neon uses
     (it appeared to use `516759701042-…` instead, so likely **not** here).
4. **Disable/delete the old secret** in the Google client once nothing uses it.
5. **Verify Google sign-in** still works end-to-end: open
   `https://setandshoot.com/sign-in`, click **Sign in with Google**, confirm it
   reaches Google's consent screen and a real login round-trips back and signs
   you in. (This is the same check done live during the session.)

### 2c. Or delete it (if unused)

1. In Google Cloud Console → Credentials, **delete** OAuth client `829316570560-…`.
2. Remove `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from `.env.local`
   (and from Vercel env if present).
3. **Verify Google sign-in still works** (it should — prod uses
   `516759701042-…` via Neon Auth, which is untouched by this).

---

## 3. Rotate the Neon-side Google secret too? (optional)

The production sign-in uses client `516759701042-…`, whose secret lives in the
**Neon Auth console** and was **not** exposed. Strictly, this incident doesn't
require rotating it. Rotate it only if you want belt-and-suspenders:
Neon Auth console → project → social providers → Google → update the client
secret with a freshly reset one from that client's Google Cloud Credentials page,
then re-run the sign-in verification in 2b.5.

---

## 4. Done checklist

- [ ] New Gemini key issued; `.env.local` + Vercel updated; old key deleted; app verified (or key removed if unused).
- [ ] `829316570560-…` OAuth client: rotated **or** deleted; `.env.local` + Vercel updated.
- [ ] Google sign-in verified working on `https://setandshoot.com/sign-in`.
- [ ] (Optional) Neon-side `516759701042-…` secret rotated.
- [ ] This runbook deleted or moved out of the public repo if you don't want it tracked.
