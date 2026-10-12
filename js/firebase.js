import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const configured = !firebaseConfig.apiKey.startsWith("YOUR_") && !firebaseConfig.projectId.startsWith("YOUR_");
export const db = configured ? getFirestore(initializeApp(firebaseConfig)) : null;

export function showConfigError(target, extra = "") {
  target.innerHTML = `<div class="empty-state"><span class="empty-icon">⚙</span><h2>Connect Firebase to continue</h2><p>Add your Firebase web app settings to <code>js/firebase-config.js</code>${extra}.</p><a class="button button-secondary" href="README.md">View setup steps</a></div>`;
}
