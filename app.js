const seededIntents = [
  { id:'lt_001', category:'founder', public:'Technical builder exploring a company in computational biology', region:'Boston/Cambridge', wants:['cofounder','research commercialization'], offers:['ML','bioinformatics','rapid prototyping'], private:'Would leave a prestigious lab for the right cofounder; wants someone unusually ambitious and fast-moving.' },
  { id:'lt_002', category:'research', public:'Wet-lab scientist interested in translating aging biology', region:'Bay Area', wants:['computational collaborator','startup path'], offers:['mouse models','assay design','aging biology'], private:'Frustrated with academic pace and quietly open to joining a venture-backed startup.' },
  { id:'lt_003', category:'capital', public:'Angel looking for unusual pre-seed technical founders', region:'United States', wants:['deep-tech founders','contrarian theses'], offers:['capital','introductions','company building'], private:'Especially interested in founders too early for a formal round and does not want public dealflow spam.' },
  { id:'lt_004', category:'work', public:'Senior engineer open to a mission-driven side project', region:'Remote', wants:['high-agency team','equity-heavy role'], offers:['full-stack','agents','infrastructure'], private:'Would consider quitting current role only after building trust through a short collaboration.' },
  { id:'lt_005', category:'health', public:'Operator seeking better preventive health tools for employees', region:'Nevada', wants:['pilot','measurable outcomes'], offers:['distribution','benefit budget','population access'], private:'Can approve a small pilot quickly but cannot publicly signal vendor dissatisfaction.' },
  { id:'lt_006', category:'creative', public:'Producer looking for technically ambitious interactive media', region:'Los Angeles', wants:['AI collaborator','experimental demos'], offers:['production','distribution','creative direction'], private:'Wants weird prototypes, not polished agency pitches.' }
];

const tools = [
  ['get_market_snapshot','Read coarse demand/supply signals without exposing private intent.'],
  ['submit_latent_intent','Store a user goal privately in this browser for agent-mediated matching.'],
  ['find_counterparties','Search richer latent intent and return compatibility without exposing identities or private text.'],
  ['request_intro','Create a consent-gated introduction request to an opaque counterparty.']
];

const state = {
  localIntents: JSON.parse(localStorage.getItem('latent_intents') || '[]'),
  introRequests: JSON.parse(localStorage.getItem('latent_intros') || '[]')
};

function save(){
  localStorage.setItem('latent_intents', JSON.stringify(state.localIntents));
  localStorage.setItem('latent_intros', JSON.stringify(state.introRequests));
}

function render(){
  const signals = seededIntents.map(({category, public, region}) => ({category, public, region}));
  document.getElementById('intent-count').textContent = seededIntents.length + state.localIntents.length;
  document.getElementById('signal-grid').innerHTML = signals.map(s => `
    <article class="signal-card">
      <span class="tag">${escapeHTML(s.category)}</span>
      <h3>${escapeHTML(s.public)}</h3>
      <p>${escapeHTML(s.region)} · richer constraints available to agents</p>
    </article>`).join('');
  document.getElementById('tool-grid').innerHTML = tools.map(([name,desc]) => `
    <article class="tool-card"><code>${name}</code><p>${desc}</p></article>`).join('');
}

function escapeHTML(value=''){
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function logCall(name, detail){
  const box = document.getElementById('call-log');
  if (box.textContent === 'No agent calls yet.') box.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'call-entry';
  el.textContent = `${new Date().toLocaleTimeString()}  ${name}  ${detail || ''}`;
  box.prepend(el);
}

function scoreMatch(query, item){
  const haystack = [item.category,item.public,item.region,...item.wants,...item.offers,item.private].join(' ').toLowerCase();
  const tokens = String(query || '').toLowerCase().split(/\W+/).filter(t => t.length > 2);
  let score = tokens.reduce((n,t) => n + (haystack.includes(t) ? 1 : 0), 0);
  return score + (item.category === query ? 3 : 0);
}

function registerWebMCP(){
  const mc = document.modelContext;
  const badge = document.getElementById('webmcp-badge');
  if (!mc || typeof mc.registerTool !== 'function') {
    badge.textContent = 'WebMCP browser not detected';
    return;
  }
  badge.textContent = 'WebMCP ready · 4 tools';

  mc.registerTool({
    name:'get_market_snapshot',
    title:'Get latent market snapshot',
    description:'Read only. Returns coarse categories and counts of what people in Latent are seeking or offering. Never returns private intent text or contact details.',
    inputSchema:{type:'object',properties:{}},
    annotations:{readOnlyHint:true},
    execute: async () => {
      logCall('get_market_snapshot','read-only');
      const counts = {};
      seededIntents.forEach(x => counts[x.category] = (counts[x.category] || 0) + 1);
      return { totalIntents: seededIntents.length + state.localIntents.length, categories: counts, privacy:'Public snapshot is intentionally lossy. Use find_counterparties for structured matching.' };
    }
  });

  mc.registerTool({
    name:'submit_latent_intent',
    title:'Submit a private latent intent',
    description:'Save a private goal for this user in local browser storage. Use when the user wants Latent to represent an opportunity, need, goal, offer, or constraint without publishing the full text publicly.',
    inputSchema:{
      type:'object',
      properties:{
        goal:{type:'string',description:'The private goal or need in the user’s own words.'},
        category:{type:'string',enum:['founder','research','capital','work','health','creative','other']},
        region:{type:'string',description:'Optional geographic constraint.'},
        publicSignal:{type:'string',description:'Optional deliberately vague teaser safe to show publicly.'},
        mustHaves:{type:'array',items:{type:'string'},description:'Constraints required for a useful match.'},
        canOffer:{type:'array',items:{type:'string'},description:'Resources, skills, access, or value the user can offer.'}
      },
      required:['goal','category']
    },
    annotations:{readOnlyHint:false},
    execute: async input => {
      const id = `mine_${Date.now().toString(36)}`;
      state.localIntents.push({id,...input,createdAt:new Date().toISOString()});
      save(); render(); logCall('submit_latent_intent',id);
      return {id,status:'stored privately on this device',publicSignal:input.publicSignal || null,next:'Call find_counterparties using the goal and constraints. Do not reveal the private goal to a counterparty.'};
    }
  });

  mc.registerTool({
    name:'find_counterparties',
    title:'Find complementary people',
    description:'Read only. Search the private intent market for people whose goals, needs, or offers complement the user. Returns opaque IDs, coarse public signals, and match rationales, but never raw private text or contact details.',
    inputSchema:{
      type:'object',
      properties:{
        query:{type:'string',description:'What the user is trying to accomplish and what counterparties would be useful.'},
        category:{type:'string',description:'Optional market category.'},
        region:{type:'string',description:'Optional location preference.'},
        maxResults:{type:'integer',minimum:1,maximum:6,default:3}
      },
      required:['query']
    },
    annotations:{readOnlyHint:true},
    execute: async ({query,category,region,maxResults=3}) => {
      const ranked = seededIntents
        .filter(x => !category || x.category === category)
        .filter(x => !region || x.region.toLowerCase().includes(region.toLowerCase()) || region.toLowerCase().includes(x.region.toLowerCase()))
        .map(x => ({x,score:scoreMatch(query,x)}))
        .sort((a,b)=>b.score-a.score)
        .slice(0,maxResults)
        .map(({x,score}) => ({
          matchId:x.id,
          fitScore:Math.min(98,62 + score*6),
          publicSignal:x.public,
          region:x.region,
          usefulBecause:`Can offer ${x.offers.slice(0,2).join(' + ')}; is seeking ${x.wants.slice(0,2).join(' + ')}.`,
          privacy:'Identity and raw private intent withheld until mutual consent.'
        }));
      logCall('find_counterparties',`${ranked.length} matches`);
      return {matches:ranked,next:'If the user wants one, call request_intro with the opaque matchId and a short note that is safe to share.'};
    }
  });

  mc.registerTool({
    name:'request_intro',
    title:'Request a mutual-consent introduction',
    description:'Sensitive action. Sends a consent-gated introduction request to an opaque Latent match. The note should contain only information the user explicitly wants shared. This demo records a pending request locally and does not reveal either side’s private intent.',
    inputSchema:{
      type:'object',
      properties:{
        matchId:{type:'string',description:'Opaque ID returned by find_counterparties.'},
        note:{type:'string',description:'Short message safe to reveal to the potential counterparty.'}
      },
      required:['matchId','note']
    },
    annotations:{readOnlyHint:false},
    execute: async ({matchId,note}) => {
      const exists = seededIntents.some(x => x.id === matchId);
      if (!exists) throw new Error('Unknown matchId. Call find_counterparties first.');
      const requestId = `intro_${Date.now().toString(36)}`;
      state.introRequests.push({requestId,matchId,note,status:'pending mutual consent',createdAt:new Date().toISOString()});
      save(); logCall('request_intro',`${requestId} → pending consent`);
      return {requestId,status:'pending mutual consent',revealed:false,message:'No identity or private intent was disclosed. In a production network, both agents would obtain approval before exchanging contact details.'};
    }
  });
}

render();
registerWebMCP();

document.getElementById('copy-agent-prompt').addEventListener('click', async () => {
  const prompt = 'Use the WebMCP tools on this Latent page. Help me express a goal privately, save it with submit_latent_intent, find complementary counterparties, explain the best matches, and only request an introduction after I choose one. Do not expose my private intent publicly.';
  await navigator.clipboard.writeText(prompt);
  document.getElementById('copy-status').textContent = 'Copied. Paste it into an agent while this page is open.';
});
