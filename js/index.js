import {
  collection, doc, getCountFromServer, getDocs, orderBy, query, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth, db, configured, showConfigError } from "./firebase.js";
import { esc, formatDate, surveyUrl } from "./shared.js";

const loading = document.querySelector("#auth-loading");
const gate = document.querySelector("#auth-gate");
const dashboard = document.querySelector("#dashboard");
const form = document.querySelector("#auth-form");
const message = document.querySelector("#auth-message");
const emailInput = document.querySelector("#auth-email");
const passwordInput = document.querySelector("#auth-password");
const signInButton = document.querySelector("#auth-submit");
const modeButton = document.querySelector("#auth-mode");
const resetButton = document.querySelector("#reset-password");
const signOutButton = document.querySelector("#sign-out");
const emailLabel = document.querySelector("#user-email");
const list = document.querySelector("#survey-list");
const count = document.querySelector("#survey-count");
const notice = document.querySelector("#notice");
let creatingAccount = false;

if (!configured) {
  loading.hidden = true;
  gate.hidden = false;
  showConfigError(gate);
} else {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.className = "inline-error";
    message.textContent = "";
    signInButton.disabled = true;
    try {
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (creatingAccount) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      message.textContent = friendlyAuthError(error);
    } finally {
      signInButton.disabled = false;
    }
  });

  modeButton.addEventListener("click", () => {
    creatingAccount = !creatingAccount;
    message.textContent = "";
    document.querySelector("#auth-title").textContent = creatingAccount ? "Create your account" : "Sign in to Formcraft";
    signInButton.textContent = creatingAccount ? "Create account" : "Sign in";
    modeButton.textContent = creatingAccount ? "I already have an account" : "Create an account";
    resetButton.hidden = creatingAccount;
    passwordInput.autocomplete = creatingAccount ? "new-password" : "current-password";
  });

  resetButton.addEventListener("click", async () => {
    message.textContent = "";
    if (!emailInput.value.trim()) {
      message.textContent = "Enter your email address first.";
      emailInput.focus();
      return;
    }
    try {
      await sendPasswordResetEmail(auth, emailInput.value.trim());
      message.className = "notice";
      message.textContent = "Password reset email sent.";
    } catch (error) {
      message.className = "inline-error";
      message.textContent = friendlyAuthError(error);
    }
  });

  signOutButton.addEventListener("click", () => signOut(auth).catch(error => { notice.textContent = friendlyAuthError(error); }));
  onAuthStateChanged(auth, user => {
    loading.hidden = true;
    if (!user) {
      gate.hidden = false;
      dashboard.hidden = true;
      signOutButton.hidden = true;
      emailLabel.hidden = true;
      return;
    }
    gate.hidden = true;
    dashboard.hidden = false;
    signOutButton.hidden = false;
    emailLabel.hidden = false;
    emailLabel.textContent = user.email || "Signed in";
    loadSurveys(user).catch(error => {
      list.innerHTML = `<div class="error-state"><h2>Couldn’t load your surveys</h2><p>${esc(error.message)}. Check your Firestore rules.</p></div>`;
    });
  });
}

async function loadSurveys(user) {
  const surveysRef = collection(db, "users", user.uid, "surveys");
  const snapshot = await getDocs(query(surveysRef, orderBy("createdAt", "desc")));
  const active = snapshot.docs.filter(item => item.data().status !== "removed");
  const surveys = await Promise.all(active.map(async item => {
    const responsesRef = collection(db, "users", user.uid, "surveys", item.id, "responses");
    const result = await getCountFromServer(responsesRef);
    return { item, responseCount: result.data().count };
  }));
  count.textContent = `${surveys.length} ${surveys.length === 1 ? "survey" : "surveys"}`;
  renderSurveys(surveys, user);
}

function renderSurveys(surveys, user) {
  if (!surveys.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">✦</span><h2>Your first survey starts here</h2><p>Create a survey in minutes, then share the link to collect responses.</p><a class="button button-primary" href="builder.html">Create your first survey</a></div>`;
    return;
  }
  list.innerHTML = surveys.map(({ item, responseCount }) => {
    const survey = item.data();
    return `<article class="survey-card" data-id="${esc(item.id)}">
      <div class="survey-card-top"><span class="card-icon">✳</span><span class="date-label">${esc(formatDate(survey.createdAt))}</span></div>
      <h3>${esc(survey.title)}</h3><p class="card-description">${esc(survey.description || "No description added.")}</p>
      <div class="survey-meta"><span>${survey.questions?.length || 0} questions</span><span>·</span><span>${responseCount} responses</span></div>
      <div class="card-actions"><a class="button button-secondary" href="builder.html?id=${encodeURIComponent(item.id)}">Edit</a><a class="button button-secondary" href="results.html?id=${encodeURIComponent(item.id)}">View results</a>
        <button class="button button-quiet copy-survey" data-id="${esc(item.id)}" type="button">Copy link</button>
        <button class="button button-danger remove-survey" data-id="${esc(item.id)}" data-title="${esc(survey.title)}" type="button">Remove</button>
      </div>
    </article>`;
  }).join("");

  list.onclick = async event => {
    const copyButton = event.target.closest(".copy-survey");
    if (copyButton) {
      try {
        await navigator.clipboard.writeText(surveyUrl(copyButton.dataset.id, user.uid));
        notice.textContent = "Survey link copied to clipboard.";
      } catch {
        notice.textContent = surveyUrl(copyButton.dataset.id, user.uid);
      }
      return;
    }
    const removeButton = event.target.closest(".remove-survey");
    if (!removeButton || !confirm(`Remove “${removeButton.dataset.title}” from your surveys? The public link will stop accepting responses. Existing responses remain in your account.`)) return;
    removeButton.disabled = true;
    try {
      await updateDoc(doc(db, "users", user.uid, "surveys", removeButton.dataset.id), { status: "removed", removedAt: serverTimestamp() });
      removeButton.closest(".survey-card").remove();
      const remaining = list.querySelectorAll(".survey-card").length;
      count.textContent = `${remaining} ${remaining === 1 ? "survey" : "surveys"}`;
      notice.textContent = "Survey removed. Existing responses remain stored.";
      if (!remaining) list.innerHTML = `<div class="empty-state"><span class="empty-icon">✦</span><h2>No surveys here</h2><p>Create a survey to collect responses.</p><a class="button button-primary" href="builder.html">Create a survey</a></div>`;
    } catch (error) {
      removeButton.disabled = false;
      notice.textContent = `Couldn’t remove survey: ${error.message}`;
    }
  };
}

function friendlyAuthError(error) {
  if (error.code === "auth/invalid-credential") return "Email or password is incorrect.";
  if (error.code === "auth/email-already-in-use") return "An account already uses this email. Sign in instead.";
  if (error.code === "auth/weak-password") return "Choose a password with at least 6 characters.";
  if (error.code === "auth/invalid-email") return "Enter a valid email address.";
  if (error.code === "auth/operation-not-allowed") return "Enable Email/Password in Firebase Console → Authentication → Sign-in method.";
  if (error.code === "auth/unauthorized-domain") return "Add mkpalld2008-cp.github.io to Firebase Authentication → Settings → Authorized domains.";
  return error.message || "Authentication failed. Please try again.";
}
