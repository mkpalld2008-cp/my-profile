import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db, configured, showConfigError } from "./firebase.js";
import { esc, formatDate, surveyUrl } from "./shared.js";

const list = document.querySelector("#survey-list"), count = document.querySelector("#survey-count"), notice = document.querySelector("#notice");
if (!configured) showConfigError(list, " and publish your Firestore rules");
else try {
  const snap = await getDocs(query(collection(db,"surveys"), orderBy("createdAt","desc")));
  count.textContent = `${snap.size} ${snap.size === 1 ? "survey" : "surveys"}`;
  if (snap.empty) list.innerHTML = `<div class="empty-state"><span class="empty-icon">✦</span><h2>Your first survey starts here</h2><p>Create a survey in minutes, then share the link to collect responses.</p><a class="button button-primary" href="builder.html">Create your first survey</a></div>`;
  else list.innerHTML = snap.docs.map(doc => { const s=doc.data(); return `<article class="survey-card"><div class="survey-card-top"><span class="card-icon">✳</span><span class="date-label">${esc(formatDate(s.createdAt))}</span></div><h3>${esc(s.title)}</h3><p class="card-description">${esc(s.description || "No description added.")}</p><div class="survey-meta"><span>${s.questions?.length || 0} questions</span><span>·</span><span>${s.responseCount || 0} responses</span></div><div class="card-actions"><a class="button button-secondary" href="results.html?id=${encodeURIComponent(doc.id)}">View results</a><button class="button button-quiet copy-survey" data-id="${esc(doc.id)}" type="button">Copy link</button></div></article>`; }).join("");
  list.addEventListener("click", async e => { const b=e.target.closest(".copy-survey"); if(!b)return; try { await navigator.clipboard.writeText(surveyUrl(b.dataset.id)); notice.textContent="Survey link copied to clipboard."; } catch { notice.textContent=surveyUrl(b.dataset.id); } });
} catch(error) { list.innerHTML=`<div class="error-state"><h2>Couldn’t load your surveys</h2><p>${esc(error.message)}. Check your Firebase settings and Firestore rules.</p><button class="button button-secondary" onclick="location.reload()">Try again</button></div>`; }
