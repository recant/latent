# Latent

**A private intent market for agents.**

Latent connects people whose needs and offers complement each other without forcing them to publish those details as public listings. Humans see only a deliberately broad signal layer. AI agents get structured WebMCP tools for private intent submission, matching, and consent-gated introductions.

## Why WebMCP

Traditional marketplaces only know what people are willing to post publicly. That leaves out a large class of useful intent: someone looking for short-term housing without publishing exact dates and budget, a buyer quietly searching for a specific item, a person looking for a tutor but wanting an agent to screen candidates first, or a local service provider with limited availability who does not want a public contact form flooded with requests.

WebMCP changes the interface. Instead of making the user compress a nuanced private request into a public listing, their agent can represent it directly and query the market through structured tools. Latent returns compatibility and an opaque match ID first. Identity and private text stay hidden until both sides opt in.

## Human + agent flow

1. The human tells their agent a private request in natural language.
2. The agent calls `submit_latent_intent` with the request, constraints, and an optional broad public signal.
3. The agent calls `find_counterparties` to search complementary private intent.
4. Latent returns opaque candidate IDs, fit scores, coarse signals, and a reason each match may be useful.
5. The human chooses whether to proceed.
6. The agent calls `request_intro`; the demo records a pending mutual-consent request without exposing identities.

## WebMCP tools

- `get_market_snapshot` — read-only coarse market activity.
- `submit_latent_intent` — saves a user's private request locally in the browser.
- `find_counterparties` — searches seeded private intent and returns privacy-preserving matches.
- `request_intro` — creates a consent-gated introduction request.

The app uses the imperative WebMCP API via `document.modelContext.registerTool(...)` and feature-detects support so ordinary browsers still render the site.

## Privacy model

This hackathon build demonstrates progressive disclosure:

- Public web: coarse, intentionally broad signals.
- Agent layer: structured requests and constraints.
- Matching response: opaque IDs and match rationale, not raw private records.
- Introduction: explicit action, recorded as pending mutual consent.

The user's own submitted intents are stored in `localStorage` for the demo. Seeded counterparties simulate the network. A production version would store encrypted intent server-side and mediate disclosure through access controls and per-user agents.

## Run locally

No build step is required.

```bash
python3 -m http.server 3000
```

Open `http://localhost:3000` in a browser with WebMCP support enabled.

## Deploy

This is a static site and can be deployed directly to Vercel, Netlify, Cloudflare Pages, Render static hosting, or any equivalent host. The repository includes `vercel.json` for a zero-config Vercel deployment.

## Suggested judge demo

1. Open the live site in a browser with WebMCP enabled.
2. Ask: **“Use this site's tools. I need a furnished two-bedroom place for about six weeks. I care about flexible dates and do not want to publish my exact budget or travel schedule. Find me relevant matches.”**
3. The agent should discover the Latent tools, submit the private intent, and call `find_counterparties`.
4. Ask it to explain the best match.
5. Choose one and ask it to request an introduction.
6. Show that Latent returns a pending mutual-consent request rather than exposing private identity or contact data.

## Submission description

### Why this is a strong fit for WebMCP

The value of Latent comes from information people may want to share with an agent but not publish on a public page. WebMCP lets the website expose a structured private interaction surface to the user's agent, so the agent can represent nuanced intent, search for complementary intent, and take consent-gated actions without scraping UI or requiring a public listing.

### Better user experience

The user says what they actually want once. Their agent converts it into structured constraints, searches the market, explains the most promising matches, and asks before any disclosure. The public website stays sparse by design.

### What becomes possible

Latent can create markets for needs and offers that previously remained invisible because publishing them carried privacy, convenience, or social costs. Agents become market representatives rather than just form-fillers.

## Hackathon checklist

- WebMCP-powered web app: yes
- Working human-facing web experience: yes
- Structured WebMCP tools: yes
- Public source repository: yes
- No secret credentials required: yes
- Deployable live URL: static, zero-build
- Demo video: still needs to be recorded for submission
