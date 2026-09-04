const seededIntents = [
  {
    id: 'lt_001',
    category: 'housing',
    public: 'Short-term furnished housing available in a major city',
    region: 'Chicago',
    wants: ['reliable tenant', 'flexible dates'],
    offers: ['furnished apartment', 'six-week availability'],
    private: 'The owner is traveling unexpectedly and prefers not to post the exact vacant dates publicly.'
  },
  {
    id: 'lt_002',
    category: 'services',
    public: 'Experienced local helper available for small weekend jobs',
    region: 'Seattle',
    wants: ['one-off projects', 'clear scope'],
    offers: ['moving help', 'assembly', 'local errands'],
    private: 'Available selectively and would rather review requests through an agent than publish a phone number.'
  },
  {
    id: 'lt_003',
    category: 'learning',
    public: 'Language tutor open to a recurring evening exchange',
    region: 'Remote',
    wants: ['consistent learner', 'weekly schedule'],
    offers: ['Spanish tutoring', 'conversation practice'],
    private: 'Prefers a learner with a specific schedule and does not want to manage a public tutoring profile.'
  },
  {
    id: 'lt_004',
    category: 'events',
    public: 'Small event vendor with last-minute weekend availability',
    region: 'Austin',
    wants: ['private event', 'under 80 guests'],
    offers: ['food service', 'setup', 'staffing'],
    private: 'A cancellation opened a date that is not being advertised publicly because the vendor wants one good-fit booking.'
  },
  {
    id: 'lt_005',
    category: 'commerce',
    public: 'Collector considering selling a high-end camera kit',
    region: 'United States',
    wants: ['serious buyer', 'simple transaction'],
    offers: ['camera body', 'two lenses', 'accessories'],
    private: 'The owner is only willing to sell above a private reserve and does not want to create a public listing unless there is real demand.'
  },
  {
    id: 'lt_006',
    category: 'community',
    public: 'Neighborhood group looking for occasional volunteer help',
    region: 'Portland',
    wants: ['weekend volunteers', 'reliable attendance'],
    offers: ['community projects', 'local connections'],
    private: 'The group wants people matched to specific tasks rather than collecting names through a public signup sheet.'
  }
];

const toolDescriptions = [
  ['get_market_snapshot', 'Read a coarse public view of the network without exposing private requests or contact details.'],
  ['submit_latent_intent', 'Save a private request in local storage so an agent can work on it without turning it into a public listing.'],
  ['find_counterparties', 'Return strong matches as opaque IDs with short rationales while withholding identity and raw private text.'],
  ['request_intro', 'Create a consent-gated introduction request that shares only the note the user explicitly approves.']
];

const AGENT_PROMPT = 'Use the WebMCP tools on this Latent page. I need a furnished two-bedroom place for about six weeks. I care about flexible dates and do not want to publish my exact budget or travel schedule. Save that request privately, find relevant matches, explain the best one, and do not request an introduction until I choose.';

const state = {
  localIntents: JSON.parse(localStorage.getItem('latent_intents') || '[]'),
  introRequests: JSON.parse(localStorage.getItem('latent_intros') || '[]')
};

function save() {
  localStorage.setItem('latent_intents', JSON.stringify(state.localIntents));
  localStorage.setItem('latent_intros', JSON.stringify(state.introRequests));
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function renderSignals() {
  const grid = document.getElementById('signal-grid');
  if (!grid) return;

  grid.innerHTML = seededIntents.map(item => `
    <article class="signal-row">
      <div class="signal-tag">${escapeHTML(item.category)}</div>
      <div>
        <div class="signal-title">${escapeHTML(item.public)}</div>
        <div class="signal-meta">${escapeHTML(item.region)} · richer constraints available only to agents</div>
      </div>
    </article>
  `).join('');
}

function renderTools() {
  const grid = document.getElementById('tool-grid');
  if (!grid) return;

  grid.innerHTML = toolDescriptions.map(([name, description]) => `
    <article class="tool-card">
      <code>${escapeHTML(name)}</code>
      <h3>${escapeHTML(name)}</h3>
      <p>${escapeHTML(description)}</p>
    </article>
  `).join('');
}

function renderCounts() {
  const countEl = document.getElementById('intent-count');
  if (countEl) countEl.textContent = String(seededIntents.length + state.localIntents.length);
}

function renderPrompt() {
  const box = document.getElementById('agent-prompt-text');
  if (box) box.textContent = AGENT_PROMPT;
}

function render() {
  renderCounts();
  renderSignals();
  renderTools();
  renderPrompt();
}

function logCall(name, detail) {
  const box = document.getElementById('call-log');
  if (!box) return;
  if (box.textContent === 'No agent calls yet.') box.innerHTML = '';
  const entry = document.createElement('div');
  entry.className = 'call-entry';
  entry.textContent = `${new Date().toLocaleTimeString()}  ${name}  ${detail || ''}`;
  box.prepend(entry);
}

function scoreMatch(query, item) {
  const haystack = [item.category, item.public, item.region, ...item.wants, ...item.offers, item.private]
    .join(' ')
    .toLowerCase();

  const tokens = String(query || '')
    .toLowerCase()
    .split(/\W+/)
    .filter(token => token.length > 2);

  let score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
  return score + (item.category === query ? 3 : 0);
}

function registerWebMCP() {
  const mc = document.modelContext;
  const badge = document.getElementById('webmcp-badge');

  if (!badge) return;

  if (!mc || typeof mc.registerTool !== 'function') {
    badge.textContent = 'WebMCP not detected';
    return;
  }

  badge.textContent = 'WebMCP ready · 4 tools';

  mc.registerTool({
    name: 'get_market_snapshot',
    title: 'Get latent market snapshot',
    description: 'Read-only. Returns coarse categories and counts without exposing private request text, identities, or contact details.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => {
      logCall('get_market_snapshot', 'read-only');
      const counts = {};
      seededIntents.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
      });
      return {
        totalIntents: seededIntents.length + state.localIntents.length,
        categories: counts,
        privacy: 'The public snapshot is intentionally broad. Use find_counterparties for structured matching.'
      };
    }
  });

  mc.registerTool({
    name: 'submit_latent_intent',
    title: 'Submit a private intent',
    description: 'Store a private request for this user in local browser storage without publishing the full text publicly.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'What the user wants or can offer.' },
        category: { type: 'string', enum: ['housing', 'services', 'learning', 'events', 'commerce', 'community', 'other'] },
        region: { type: 'string', description: 'Optional geographic preference or constraint.' },
        publicSignal: { type: 'string', description: 'Optional broad teaser that is safe to show publicly.' },
        mustHaves: { type: 'array', items: { type: 'string' }, description: 'Requirements for a useful match.' },
        canOffer: { type: 'array', items: { type: 'string' }, description: 'What the user can offer in return, if relevant.' }
      },
      required: ['goal', 'category']
    },
    annotations: { readOnlyHint: false },
    execute: async input => {
      const id = `mine_${Date.now().toString(36)}`;
      state.localIntents.push({ id, ...input, createdAt: new Date().toISOString() });
      save();
      render();
      logCall('submit_latent_intent', id);
      return {
        id,
        status: 'stored privately on this device',
        publicSignal: input.publicSignal || null,
        next: 'Call find_counterparties next. Keep private details out of public-facing text.'
      };
    }
  });

  mc.registerTool({
    name: 'find_counterparties',
    title: 'Find complementary matches',
    description: 'Read-only. Searches private intent for complementary needs and offers, then returns opaque IDs, public-safe signals, and match rationales without exposing identities or raw private text.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What the user is trying to accomplish and what kind of match would help.' },
        category: { type: 'string', description: 'Optional category filter.' },
        region: { type: 'string', description: 'Optional location preference.' },
        maxResults: { type: 'integer', minimum: 1, maximum: 6, default: 3 }
      },
      required: ['query']
    },
    annotations: { readOnlyHint: true },
    execute: async ({ query, category, region, maxResults = 3 }) => {
      const ranked = seededIntents
        .filter(item => !category || item.category === category)
        .filter(item => !region || item.region.toLowerCase().includes(region.toLowerCase()) || region.toLowerCase().includes(item.region.toLowerCase()))
        .map(item => ({ item, score: scoreMatch(query, item) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(({ item, score }) => ({
          matchId: item.id,
          fitScore: Math.min(98, 62 + score * 6),
          publicSignal: item.public,
          region: item.region,
          usefulBecause: `Can offer ${item.offers.slice(0, 2).join(' + ')}; is seeking ${item.wants.slice(0, 2).join(' + ')}.`,
          privacy: 'Identity and raw private intent withheld until mutual consent.'
        }));

      logCall('find_counterparties', `${ranked.length} matches`);
      return {
        matches: ranked,
        next: 'If the user wants one, call request_intro with the opaque matchId and a short note that is safe to share.'
      };
    }
  });

  mc.registerTool({
    name: 'request_intro',
    title: 'Request a mutual-consent introduction',
    description: 'Sensitive action. Creates a consent-gated introduction request to an opaque match. The note must contain only information the user approves for sharing.',
    inputSchema: {
      type: 'object',
      properties: {
        matchId: { type: 'string', description: 'Opaque ID returned by find_counterparties.' },
        note: { type: 'string', description: 'Short message safe to reveal to the potential counterparty.' }
      },
      required: ['matchId', 'note']
    },
    annotations: { readOnlyHint: false },
    execute: async ({ matchId, note }) => {
      if (!seededIntents.some(item => item.id === matchId)) {
        throw new Error('Unknown matchId. Call find_counterparties first.');
      }

      const requestId = `intro_${Date.now().toString(36)}`;
      state.introRequests.push({ requestId, matchId, note, status: 'pending mutual consent', createdAt: new Date().toISOString() });
      save();
      logCall('request_intro', `${requestId} -> pending consent`);
      return {
        requestId,
        status: 'pending mutual consent',
        revealed: false,
        message: 'No identity or private request was disclosed. A production network would exchange contact details only after both sides approve.'
      };
    }
  });
}

async function copyPrompt() {
  await navigator.clipboard.writeText(AGENT_PROMPT);
  const status = document.getElementById('copy-status');
  if (status) status.textContent = 'Copied. Paste it into an agent while this page is open.';
}

render();
registerWebMCP();

document.getElementById('copy-agent-prompt')?.addEventListener('click', copyPrompt);
document.getElementById('copy-agent-prompt-2')?.addEventListener('click', copyPrompt);
