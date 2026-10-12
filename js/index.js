import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db, configured, showConfigError } from "./firebase.js";
import { esc, formatDate, surveyUrl } from "./shared.js";

const list = document.querySelector("#survey-list");
const count = document.querySelector("#survey-count");
const notice = document.querySelector("#notice");

if (!configured) showConfigError(list, " and publish your Firestore rules");
else try {
  const snapshot = await getDocs(query(collection(db, "surveys"), orderBy("createdAt", "desc")));
  const surveys = snapshot.docs.filter(item => !item.data().removedAt);
  updateCount(surveys.length);
  renderSurveys(surveys);

  list.addEventListener("click", async event => {
    const copyButton = event.target.closest(".copy-survey");
    if (copyButton) {
      try {
        await navigator.clipboard.writeText(surveyUrl(copyButton.dataset.id));
        notice.textContent = "Survey link copied to clipboard.";
      } catch {
        notice.textContent = surveyUrl(copyButton.dataset.id);
      }
      return;
    }

    const removeButton = event.target.closest(".remove-survey");
    if (!removeButton || !confirm(`Remove “${removeButton.dataset.title}” from My surveys? Its public link will stop accepting responses. Existing responses will remain stored.`)) return;

    removeButton.disabled = true;
    try {
      await updateDoc(doc(db, "surveys", removeButton.dataset.id), { removedAt: serverTimestamp() });
      removeButton.closest(".survey-card").remove();
      const remaining = list.querySelectorAll(".survey-card").length;
      updateCount(remaining);
      notice.textContent = "Survey removed. Existing responses are still stored.";
      if (!remaining) renderEmpty();
    } catch (error) {
      removeButton.disabled = false;
      notice.textContent = `Couldn’t remove survey: ${error.message}`;
    }
  });
} catch (error) {
  list.innerHTML = `<div class="error-state"><h2>Couldn’t load your surveys</h2><p>${esc(error.message)}. Check your Firebase settings and Firestore rules.</p><button class="button button-secondary" onclick="location.reload()">Try again</button></div>`;
}

function updateCount(total) {
  count.textContent = `${total} ${total === 1 ? "survey" : "surveys"}`;
}

function renderSurveys(surveys) {
  if (!surveys.length) return renderEmpty();
  list.innerHTML = surveys.map(item => {
    const survey = item.data();
    return `<article class="survey-card" data-id="${esc(item.id)}">
      <div class="survey-card-top"><span class="card-icon">✳</span><span class="date-label">${esc(formatDate(survey.createdAt))}</span></div>
      <h3>${esc(survey.title)}</h3><p class="card-description">${esc(survey.description || "No description added.")}</p>
      <div class="survey-meta"><span>${survey.questions?.length || 0} questions</span><span>·</span><span>${survey.responseCount || 0} responses</span></div>
      <div class="card-actions">
        <a class="button button-secondary" href="results.html?id=${encodeURIComponent(item.id)}">View results</a>
        <button class="button button-quiet copy-survey" data-id="${esc(item.id)}" type="button">Copy link</button>
        <button class="button button-danger remove-survey" data-id="${esc(item.id)}" data-title="${esc(survey.title)}" type="button">Remove</button>
      </div>
    </article>`;
  }).join("");
}

function renderEmpty() {
  list.innerHTML = `<div class="empty-state"><span class="empty-icon">✦</span><h2>No surveys here</h2><p>Create a survey in minutes, then share the link to collect responses.</p><a class="button button-primary" href="builder.html">Create a survey</a></div>`;
}
