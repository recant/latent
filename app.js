const seededIntents = [
  {
    id: 'lt_001',
    category: 'founder',
    public: 'Technical builder exploring a company in computational biology',
    region: 'Boston/Cambridge',
    wants: ['cofounder', 'research commercialization'],
    offers: ['ML', 'bioinformatics', 'rapid prototyping'],
    private: 'Would leave a prestigious lab for the right cofounder; wants someone unusually ambitious and fast-moving.'
  },
  {
    id: 'lt_002',
    category: 'research',
    public: 'Wet-lab scientist interested in translating aging biology',
    region: 'Bay Area',
    wants: ['computational collaborator', 'startup path'],
    offers: ['mouse models', 'assay design', 'aging biology'],
    private: 'Frustrated with academic pace and quietly open to joining a venture-backed startup.'
  },
  {
    id: 'lt_003',
    category: 'capital',
    public: 'Angel looking for unusual pre-seed technical founders',
    region: 'United States',
    wants: ['deep-tech founders', 'contrarian theses'],
    offers: ['capital', 'introductions', 'company building'],
    private: 'Especially interested in founders too early for a formal round and does not want public dealflow spam.'
  },
  {
    id: 'lt_004',
    category: 'work',
    public: 'Senior engineer open to a mission-driven side project',
    region: 'Remote',
    wants: ['high-agency team', 'equity-heavy role'],
    offers: ['full-stack', 'agents', 'infrastructure'],
    private: 'Would consider quitting current role only after building trust through a short collaboration.'
  },
  {
    id: 'lt_005',
    category: 'health',
    public: 'Operator seeking better preventive health tools for employees',
    region: 'Nevada',
    wants: ['pilot', 'measurable outcomes'],
    offers: ['distribution', 'benefit budget', 'population access'],
    private: 'Can approve a small pilot quickly but cannot publicly signal vendor dissatisfaction.'
  },
  {
    id: 'lt_006',
    category: 'creative',
    public: 'Producer looking for technically ambitious interactive media',
    region: 'Los Angeles',
    wants: ['AI collaborator', 'experimental demos'],
    offers: ['production', 'distribution', 'creative direction'],
    private: 'Wants weird prototypes, not polished agency pitches.'
  }
];

const toolDescriptions = [
  ['get_market_snapshot', 'Read a coarse public view of the network without exposing private goals or contact details.'],
  ['submit_latent_intent', 'Save a user goal privately in local storage so an agent can work on it without posting the full thing publicly.'],
  ['find_counterparties', 'Return strong matches as opaque IDs with short rationales, while withholding identity and raw private text.'],
  ['request_intro', 'Create a consent-gated intro request that shares only the note the user explicitly approves.']
];

const AGENT_PROMPT = 'Use the WebMCP tools on this Latent page. First help me phrase my real goal privately. Then store it with submit_latent_intent, search for strong counterparties with find_counterparties, explain the best matches, and only request an introduction after I choose one. Do not expose my private intent publicly.';

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

  const publicSignals = seededIntents.map(({ category, public: publicText, region }) => ({
    category,
    publicText,
    region
  }));

  grid.innerHTML = publicSignals.map(item => `
    <article class="signal-row">
      <div class="signal-tag">${escapeHTML(item.category)}</div>
      <div>
        <div class="signal-title">${escapeHTML(item.publicText)}</div>
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
  if (countEl) {
    countEl.textContent = String(seededIntents.length + state.localIntents.length);
  }
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
    description: 'Read-only tool. Returns coarse counts and category-level information without exposing private intent text or contact details.',
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
        privacy: 'This snapshot is intentionally lossy. Use find_counterparties for richer agent-facing matching.'
      };
    }
  });

  mc.registerTool({
    name: 'submit_latent_intent',
    title: 'Submit a private latent intent',
    description: 'Store a private goal for this user in local browser storage. Use when the user wants to represent a real goal, constraint, or offer without publishing the full text publicly.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'The private goal or need in the user’s own words.' },
        category: { type: 'string', enum: ['founder', 'research', 'capital', 'work', 'health', 'creative', 'other'] },
        region: { type: 'string', description: 'Optional geographic preference or constraint.' },
        publicSignal: { type: 'string', description: 'Optional vague teaser that is safe to show publicly.' },
        mustHaves: { type: 'array', items: { type: 'string' }, description: 'Requirements for a useful match.' },
        canOffer: { type: 'array', items: { type: 'string' }, description: 'What the user can offer in return.' }
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
        next: 'Use find_counterparties next. Do not reveal the private goal to counterparties.'
      };
    }
  });

  mc.registerTool({
    name: 'find_counterparties',
    title: 'Find complementary people',
    description: 'Read-only tool. Searches the latent market for complementary goals and offers, then returns opaque IDs, public-safe signals, and short rationales without exposing identities or private text.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What the user wants to accomplish and the kind of counterparty that would help.' },
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
        next: 'If the user chooses one, call request_intro with the opaque matchId and a short safe-to-share note.'
      };
    }
  });

  mc.registerTool({
    name: 'request_intro',
    title: 'Request a mutual-consent introduction',
    description: 'Sensitive action. Sends a consent-gated intro request to an opaque match. The note should contain only information the user explicitly approves for sharing.',
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
        message: 'No identity or private goal was disclosed. In a production network, both sides would approve before contact details are exchanged.'
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
