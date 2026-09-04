# Latent

**The private intent market for agents.**

Latent connects people whose goals complement each other without forcing them to publish those goals as public listings. Humans see only a deliberately lossy signal layer. AI agents get structured WebMCP tools for private intent submission, matching, and consent-gated introductions.

## Why WebMCP

A normal marketplace only knows what people are willing to post publicly. That excludes many of the highest-value opportunities: someone quietly open to leaving a job, a researcher willing to start a company for the right collaborator, an investor looking for an unusually specific founder, or an organization dissatisfied with an incumbent vendor.

WebMCP changes the interface. Instead of making the user translate a nuanced private goal into a public listing, their agent can represent it directly and query the market through structured tools. Latent returns compatibility and an opaque match ID first. Identity and private text stay hidden until both sides opt in.

## Human + agent flow

1. The human tells their agent a private goal in natural language.
2. The agent calls `submit_latent_intent` with the goal, constraints, and an optional vague public signal.
3. The agent calls `find_counterparties` to search richer latent intent.
4. Latent returns opaque candidate IDs, fit scores, coarse signals, and a reason each match could be useful.
5. The human chooses whether to proceed.
6. The agent calls `request_intro`; the demo records a pending mutual-consent request without exposing identities.

## WebMCP tools

- `get_market_snapshot` — read-only coarse market activity.
- `submit_latent_intent` — saves a user's private goal locally in the browser.
- `find_counterparties` — searches richer seeded intent and returns privacy-preserving matches.
- `request_intro` — creates a consent-gated introduction request.

The app uses the current imperative WebMCP API via `document.modelContext.registerTool(...)` and feature-detects support so ordinary browsers still render the site.

## Privacy model

This hackathon build intentionally demonstrates **progressive disclosure**:

- Public web: coarse, intentionally lossy signals.
- Agent layer: structured goals and constraints.
- Matching response: opaque IDs and match rationale, not raw private records.
- Introduction: explicit action, recorded as pending mutual consent.

The user's own submitted intents are stored in `localStorage` for the demo. Seeded counterparties simulate the network. A production version would store encrypted intent server-side and mediate disclosures through per-user agents and access controls.

## Run locally

No build step is required.

```bash
python3 -m http.server 3000
```

Open `http://localhost:3000` in a browser with WebMCP support enabled.

## Deploy

This is a static site and can be deployed directly to Vercel, Netlify, Cloudflare Pages, Render static hosting, or any equivalent host. The repository includes `vercel.json` for a zero-config Vercel deployment.

## Suggested judge demo

1. Open the live site in ChatGPT's in-app browser or Chrome with WebMCP enabled.
2. Ask: **“Use this site's tools. I quietly want to start an aging-biotech company if I can find the right technical or scientific collaborator. I do not want that full goal posted publicly. Find me relevant people.”**
3. The agent should discover the Latent tools, submit the private intent, and call `find_counterparties`.
4. Ask it to explain the best match.
5. Choose one and ask it to request an introduction.
6. Show that Latent returns a pending mutual-consent request rather than exposing private identity/contact data.

## Submission description

**Why this is a strong fit for WebMCP**

The value of Latent comes from information people do not want indexed on a public website. WebMCP lets the website expose a structured private interaction surface to the user's agent, so the agent can represent nuanced goals, search for complementary intent, and take consent-gated actions without scraping UI or requiring a public listing.

**Better user experience**

The user says what they actually want once. Their agent converts it into structured constraints, searches the market, explains the most promising matches, and asks before any disclosure. The public website stays sparse by design.

**What becomes possible**

Latent can create markets for opportunities that previously remained invisible because posting them carried social, professional, or privacy costs. Agents become trusted market representatives rather than just form-fillers.

## Hackathon checklist

- WebMCP-powered web app: yes
- Working human-facing web experience: yes
- Structured WebMCP tools: yes
- Public source repository: yes
- No secret credentials required: yes
- Deployable live URL: static, zero-build
- Demo video: still needs to be recorded for submission
