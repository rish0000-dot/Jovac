/* ===== learn:// — AI Topic Roadmap (Groq powered) ===== */

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

let state = {
  topic: "",
  tree: [],        
  activeNodeId: null,
  notesCache: {},  
};

/* ---------- DOM ---------- */
const topicInput   = document.getElementById("topicInput");
const genBtn       = document.getElementById("genBtn");
const keyBtn       = document.getElementById("keyBtn");
const keyModal     = document.getElementById("keyModal");
const apiKeyInput  = document.getElementById("apiKeyInput");
const saveKeyBtn   = document.getElementById("saveKeyBtn");
const closeKeyBtn  = document.getElementById("closeKeyBtn");
const rootLabel    = document.getElementById("rootLabel");
const progressPct  = document.getElementById("progressPct");
const progressFill = document.getElementById("progressFill");
const treeList     = document.getElementById("treeList");
const activeTab     = document.getElementById("activeTab");
const editorBody   = document.getElementById("editorBody");
const statusText   = document.getElementById("statusText");


function getApiKey(){ return localStorage.getItem("learn_groq_api_key") || ""; }
function setApiKey(k){ localStorage.setItem("learn_groq_api_key", k); }

keyBtn.addEventListener("click", () => {
  apiKeyInput.value = getApiKey();
  keyModal.classList.remove("hidden");
});
closeKeyBtn.addEventListener("click", () => keyModal.classList.add("hidden"));
saveKeyBtn.addEventListener("click", () => {
  const val = apiKeyInput.value.trim();
  if (val) setApiKey(val);
  keyModal.classList.add("hidden");
  setStatus("api key saved");
});

function setStatus(msg){ statusText.textContent = msg; }

function requireKey(){
  const key = getApiKey();
  if (!key){
    setStatus("no api key set");
    keyModal.classList.remove("hidden");
    return null;
  }
  return key;
}


async function callGroq(messages, { json = false } = {}){
  const key = requireKey();
  if (!key) throw new Error("Missing API key");

  const body = {
    model: GROQ_MODEL,
    messages,
    temperature: 0.4,
  };
  if (json) body.response_format = { type: "json_object" };

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok){
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq API error (${res.status}): ${errText.slice(0,200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from Groq");
  return content;
}


genBtn.addEventListener("click", generateTree);
topicInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") generateTree();
});

async function generateTree(){
  const topic = topicInput.value.trim();
  if (!topic){ setStatus("enter a topic first"); return; }
  if (!requireKey()) return;

  state.topic = topic;
  genBtn.disabled = true;
  setStatus(`generating roadmap for "${topic}"...`);
  treeList.innerHTML = `<li class="empty-hint">Building tree for "${escapeHtml(topic)}"...</li>`;

  const sys = `You are an expert curriculum designer and educator. Given a topic/language, output a COMPREHENSIVE and DETAILED JSON study roadmap that covers EVERYTHING a student needs to learn.
Return ONLY valid JSON matching this shape, no prose:
{
  "sections": [
    { "id": "s1", "title": "Section name", "children": [
        { "id": "s1-1", "title": "Subtopic name" }
      ]
    }
  ]
}
Rules:
- MINIMUM 8 sections, ideally 10 to 14 sections, ordered from absolute basics to advanced topics.
- MINIMUM 4 subtopics per section, ideally 5 to 8 subtopics per section.
- Cover ALL important aspects: fundamentals, types/categories, data types, operators, control flow, functions, OOP concepts, advanced patterns, error handling, best practices, real-world patterns, interview-important topics, etc.
- Include sections for: Introduction & Setup, Core Concepts, Types & Categories, Control Structures, Functions & Scope, Data Structures, OOP/Advanced Patterns, Error Handling, Built-in Methods/APIs, Best Practices & Patterns, Projects & Real-world Usage, Interview Preparation (adapt these based on the actual topic).
- Titles short (max 6 words), no numbering, no markdown.
- Make it EXHAUSTIVE — cover every important concept a student would need.`;

  const userMsg = `Topic: ${topic}`;

  try {
    const raw = await callGroq(
      [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      { json: true }
    );
    const parsed = JSON.parse(raw);
    state.tree = (parsed.sections || []).map(sec => ({
      id: sec.id,
      title: sec.title,
      children: (sec.children || []).map(c => ({ id: c.id, title: c.title, done: false })),
    }));
    state.notesCache = {};
    state.activeNodeId = null;
    renderTree();
    resetEditor();
    setStatus(`roadmap ready — ${state.tree.length} sections`);
  } catch (err){
    console.error(err);
    treeList.innerHTML = `<li class="empty-hint">Failed to build tree: ${escapeHtml(err.message)}</li>`;
    setStatus("error generating tree");
  } finally {
    genBtn.disabled = false;
  }
}


function renderTree(){
  rootLabel.textContent = `EXPLORER — ${state.topic}`;
  treeList.innerHTML = "";

  if (!state.tree.length){
    treeList.innerHTML = `<li class="empty-hint">No topic yet.</li>`;
    updateProgress();
    return;
  }

  state.tree.forEach(section => {
    const sectionLi = document.createElement("li");
    const sectionHead = document.createElement("div");
    sectionHead.className = "tree-item section-head";
    sectionHead.innerHTML = `<span class="branch-glyph">▸</span><span class="title" style="font-weight:600;color:var(--ink)">${escapeHtml(section.title)}</span>`;
    sectionLi.appendChild(sectionHead);

    const subUl = document.createElement("ul");
    subUl.style.listStyle = "none";
    subUl.style.margin = "0";
    subUl.style.padding = "0 0 0 14px";

    section.children.forEach(node => {
      const li = document.createElement("li");
      const item = document.createElement("div");
      item.className = "tree-item" + (node.done ? " done" : "") + (node.id === state.activeNodeId ? " active" : "");
      item.dataset.nodeId = node.id;

      const checkbox = document.createElement("span");
      checkbox.className = "checkbox" + (node.done ? " checked" : "");
      checkbox.textContent = node.done ? "✓" : "";
      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
        node.done = !node.done;
        renderTree();
      });

      const titleSpan = document.createElement("span");
      titleSpan.className = "title";
      titleSpan.textContent = node.title;

      item.appendChild(checkbox);
      item.appendChild(titleSpan);
      item.addEventListener("click", () => loadNote(section, node));

      li.appendChild(item);
      subUl.appendChild(li);
    });

    sectionLi.appendChild(subUl);
    treeList.appendChild(sectionLi);
  });

  updateProgress();
}

function updateProgress(){
  const all = state.tree.flatMap(s => s.children);
  const total = all.length;
  const done = all.filter(n => n.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressPct.textContent = `${pct}%`;
  progressFill.style.width = `${pct}%`;
}

/* ---------- Load note for a subtopic ---------- */
async function loadNote(section, node){
  state.activeNodeId = node.id;
  renderTree();

  const tabName = slugify(node.title) + ".md";
  activeTab.textContent = tabName;

  if (state.notesCache[node.id]){
    renderNote(state.notesCache[node.id]);
    setStatus(`loaded ${tabName} (cached)`);
    return;
  }

  if (!requireKey()) return;

  editorBody.innerHTML = `<p class="loading-note">// fetching explanation for "${escapeHtml(node.title)}"...</p>`;
  setStatus(`generating notes for "${node.title}"...`);

  const sys = `You are an expert technical tutor who explains concepts in a way that anyone can understand. You give FULL, DETAILED explanations — not brief summaries.
Return ONLY valid JSON, no prose outside JSON, matching:
{
  "summary": "A clear 2-3 line summary of what this concept is and why it matters. Written in simple language.",
  "keyConcepts": ["concept1", "concept2", "concept3"],
  "types": "If this concept has types/categories/variations, list and explain each one briefly (e.g., 'var vs let vs const', 'for vs while vs do-while'). If not applicable, write 'N/A'.",
  "whyImportant": "Explain WHY this concept is important. Where is it used? Why should a student learn it? What happens if you don't know it? 2-4 sentences.",
  "detailedExplanation": "A FULL detailed explanation of the concept. Cover how it works, its syntax, its behavior, edge cases, and anything important. Write at least 5-8 sentences. Use simple Hindi-English mixed language style if the topic allows, to make it super easy to understand.",
  "realWorldExample": "A concrete real-world analogy or use case that makes the concept click. For example: 'Think of variables like labeled boxes — you put a value inside and can change it later.' 2-4 sentences.",
  "code": "A COMPLETE working code example that demonstrates the concept clearly. Include comments explaining each important line. The code should be practical and show multiple aspects of the concept. Make it at least 10-20 lines.",
  "language": "language name for the code block, e.g. javascript, python",
  "commonMistakes": "List 2-4 common mistakes beginners make with this concept and how to avoid them.",
  "proTips": "2-3 pro tips or best practices that experienced developers follow for this concept."
}`;

  const userMsg = `Topic: ${state.topic}\nSection: ${section.title}\nSubtopic: ${node.title}\nExplain this subtopic with a real-world example and a working code snippet.`;

  try {
    const raw = await callGroq(
      [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      { json: true }
    );
    const parsed = JSON.parse(raw);
    state.notesCache[node.id] = { title: node.title, ...parsed };
    renderNote(state.notesCache[node.id]);
    setStatus(`loaded ${tabName}`);
  } catch (err){
    console.error(err);
    editorBody.innerHTML = `<p class="error-note">Failed to load notes: ${escapeHtml(err.message)}</p>`;
    setStatus("error generating notes");
  }
}

function renderNote(note){
  // Build key concepts chips
  let conceptsHtml = '';
  if (note.keyConcepts && Array.isArray(note.keyConcepts) && note.keyConcepts.length > 0) {
    conceptsHtml = `<div class="note-section">
      <h4>🔑 Key Concepts</h4>
      <div class="key-concepts">${note.keyConcepts.map(c => `<span class="concept-chip">${escapeHtml(c)}</span>`).join('')}</div>
    </div>`;
  }

  // Build types section
  let typesHtml = '';
  if (note.types && note.types !== 'N/A' && note.types.trim()) {
    typesHtml = `<div class="note-section">
      <h4>📂 Types & Categories</h4>
      <div class="types-box"><p>${escapeHtml(note.types)}</p></div>
    </div>`;
  }

  // Build common mistakes
  let mistakesHtml = '';
  if (note.commonMistakes && note.commonMistakes.trim()) {
    mistakesHtml = `<div class="note-section">
      <h4>⚠️ Common Mistakes</h4>
      <div class="mistakes-box"><p>${escapeHtml(note.commonMistakes)}</p></div>
    </div>`;
  }

  // Build pro tips
  let tipsHtml = '';
  if (note.proTips && note.proTips.trim()) {
    tipsHtml = `<div class="note-section">
      <h4>💡 Pro Tips</h4>
      <div class="tips-box"><p>${escapeHtml(note.proTips)}</p></div>
    </div>`;
  }

  editorBody.innerHTML = `
    <h3 class="note-title">${escapeHtml(note.title)}</h3>

    <div class="note-section">
      <h4>📋 Summary</h4>
      <div class="summary-box"><p>${escapeHtml(note.summary || note.explanation || "")}</p></div>
    </div>

    ${conceptsHtml}

    ${typesHtml}

    <div class="note-section">
      <h4>❓ Why Important</h4>
      <p>${escapeHtml(note.whyImportant || "")}</p>
    </div>

    <div class="note-section">
      <h4>📖 Detailed Explanation</h4>
      <p>${escapeHtml(note.detailedExplanation || "")}</p>
    </div>

    <div class="note-section">
      <h4>🌍 Real-World Example</h4>
      <div class="example-box"><p>${escapeHtml(note.realWorldExample || "")}</p></div>
    </div>

    <div class="note-section">
      <h4>💻 Code Example</h4>
      <pre class="code-block"><code>${escapeHtml(note.code || "")}</code></pre>
    </div>

    ${mistakesHtml}

    ${tipsHtml}
  `;
}

function resetEditor(){
  activeTab.textContent = "welcome.md";
  editorBody.innerHTML = `
    <div class="welcome">
      <p class="line1">// select a subtopic from the tree to load its notes</p>
      <p class="line2">// AI will explain it with a real-world example + working code</p>
    </div>`;
}

/* ---------- utils ---------- */
function escapeHtml(str){
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function slugify(str){
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}