// src/data.jsx — sample prompts + metadata, exported on window

const TAG_HUES = {
  dev:       { bg: "#e8f0fe", fg: "#1d4ed8" },
  review:    { bg: "#fef3e8", fg: "#9a5a00" },
  writing:   { bg: "#fce8f3", fg: "#a31764" },
  seo:       { bg: "#e8f8ee", fg: "#0f7d3f" },
  qa:        { bg: "#f0e8fe", fg: "#5b21b6" },
  research:  { bg: "#e6f4f5", fg: "#0e6772" },
  marketing: { bg: "#fde8e8", fg: "#a3261a" },
  email:     { bg: "#eef2ff", fg: "#3730a3" },
  pm:        { bg: "#fff1cc", fg: "#854d0e" },
  personal:  { bg: "#ecfccb", fg: "#3f6212" },
  sales:     { bg: "#ffe4e6", fg: "#9f1239" },
  ideation:  { bg: "#fce7f3", fg: "#9d174d" },
  legal:     { bg: "#e2e8f0", fg: "#334155" },
  design:    { bg: "#fde6f3", fg: "#831843" },
};

const AI_META = {
  claude:     { name: "Claude",     short: "Claude",  color: "#d97757", glyph: "✦" },
  chatgpt:    { name: "ChatGPT",    short: "GPT",     color: "#10a37f", glyph: "◎" },
  gemini:     { name: "Gemini",     short: "Gemini",  color: "#5b8def", glyph: "♢" },
  perplexity: { name: "Perplexity", short: "Pplx",    color: "#20808d", glyph: "✱" },
  generic:    { name: "Any LLM",    short: "Any",     color: "#6b6358", glyph: "○" },
};

const SAMPLE_PROMPTS = [
  { id: 1,  title: "Code review checklist",        ai: "claude",     tags: ["dev","review"],   star: true,  uses: 47, edited: "2d",
    body: "You are a senior staff engineer reviewing a pull request.\n\nReview the diff below for:\n1. Correctness & edge cases\n2. Readability and naming\n3. Test coverage\n4. Performance hot paths\n5. Security (auth, injection, secrets)\n\nReturn findings as a bulleted list grouped by severity (blocker / nit). End with one open question.\n\nDiff:\n{{diff}}" },
  { id: 2,  title: "Blog post outline",            ai: "chatgpt",    tags: ["writing","seo"],  star: true,  uses: 28, edited: "5h",
    body: "Write a {{tone}} outline for a blog post about {{topic}} aimed at {{audience}}.\n\nDeliver:\n- H1 + 1-line hook\n- 5–7 H2 sections with 2–3 bullet points each\n- Suggested CTA\n- Three SEO keywords to weave in" },
  { id: 3,  title: "Bug repro template",            ai: "claude",     tags: ["dev","qa"],       star: false, uses: 12, edited: "1w",
    body: "Reproduce the bug described in ticket {{ticket}} step-by-step.\n\nFormat:\n- Environment\n- Steps (numbered)\n- Expected\n- Actual\n- Hypothesis (top 2)" },
  { id: 4,  title: "Research paper → 5 bullets",   ai: "perplexity", tags: ["research"],       star: true,  uses: 33, edited: "3d",
    body: "Summarize {{paper}} into exactly 5 bullets for a curious non-expert. Each bullet ≤ 22 words. End with one provocative question." },
  { id: 5,  title: "SEO meta description",         ai: "perplexity", tags: ["marketing","seo"],star: false, uses: 19, edited: "2w",
    body: "Write a meta description (max 155 chars) for {{url}}.\nMust include the primary keyword \"{{keyword}}\" once, an active verb, and a concrete benefit." },
  { id: 6,  title: "Email → professional rewrite", ai: "gemini",     tags: ["writing","email"],star: false, uses: 8,  edited: "1d",
    body: "Rewrite the email below in a professional, warm tone. Keep it under 120 words. Preserve all factual details. No emoji.\n\nEmail:\n{{email}}" },
  { id: 7,  title: "Standup notes → tickets",      ai: "claude",     tags: ["dev","pm"],       star: false, uses: 22, edited: "6h",
    body: "Convert these standup notes into Linear tickets. One ticket per actionable item.\n\nEach ticket: title (≤8 words), 2-sentence description, suggested label.\n\nNotes:\n{{notes}}" },
  { id: 8,  title: "Recipe scaler",                ai: "generic",    tags: ["personal"],       star: false, uses: 4,  edited: "3w",
    body: "Scale this recipe from {{from}} to {{to}} servings.\nReturn the full ingredient list with new quantities, plus any timing adjustments." },
  { id: 9,  title: "Cold outreach intro",          ai: "chatgpt",    tags: ["sales"],          star: true,  uses: 61, edited: "4h",
    body: "Write a 3-sentence cold intro to {{name}} ({{role}} at {{company}}) about {{topic}}.\n\nNo flattery. Lead with a specific observation about their work. End with a low-friction ask." },
  { id: 10, title: "Brainstorm 10 angles",         ai: "claude",     tags: ["ideation","writing"], star: false, uses: 15, edited: "5d",
    body: "Give me 10 distinct angles on {{topic}}.\nFor each: one-line headline + the audience it would resonate with. Span serious → playful → contrarian." },
  { id: 11, title: "Contract red-flag scan",       ai: "claude",     tags: ["legal","review"], star: true,  uses: 9,  edited: "2d",
    body: "Scan the contract below for clauses that would concern a small-business buyer:\n- Auto-renewal\n- Liability caps\n- IP assignment\n- Jurisdiction\n\nReturn a table: clause / risk / suggested redline.\n\nContract:\n{{contract}}" },
  { id: 12, title: "Tweet thread from article",    ai: "chatgpt",    tags: ["marketing","writing"], star: false, uses: 17, edited: "1d",
    body: "Turn {{url}} into a {{n}}-tweet thread. First tweet must hook in ≤ 240 chars without clickbait. Last tweet must point back to the source." },
  { id: 13, title: "Daily journal prompt",         ai: "generic",    tags: ["personal"],       star: false, uses: 88, edited: "12h",
    body: "Ask me 3 reflective questions for today, {{date}}. One looking back, one looking around, one looking forward. Keep them specific and concrete." },
  { id: 14, title: "Design critique framework",    ai: "claude",     tags: ["design","review"],star: true,  uses: 24, edited: "6d",
    body: "Critique this design through 3 lenses: clarity, hierarchy, delight.\nFor each lens give: what works, what's weakest, one focused suggestion.\n\nDesign description / screenshot:\n{{design}}" },
  { id: 15, title: "Compare two products",         ai: "perplexity", tags: ["research","marketing"], star: false, uses: 11, edited: "4d",
    body: "Compare {{a}} vs {{b}} on:\n- Pricing model\n- Target user\n- Standout feature\n- 1 weakness each\n\nReturn as a tidy markdown table." },
];

Object.assign(window, { AI_META, TAG_HUES, SAMPLE_PROMPTS });
