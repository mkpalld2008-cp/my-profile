# Formcraft — Survey Tool with Form Builder

A responsive, dark themed survey builder made with HTML, CSS, and vanilla JavaScript ES modules. Firebase Firestore stores surveys and responses; Chart.js renders choice summaries. There is no build step.

**Live demo:** [https://mkpalld2008-cp.github.io/my-profile/](https://mkpalld2008-cp.github.io/my-profile/)

## Run locally

Because the app uses ES modules, open it through a local HTTP server rather than `file://`. For example, from the repository root run `python -m http.server 8000`, then visit `http://localhost:8000/`.

## Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/) and add a Web app.
2. Copy the web app configuration into `js/firebase-config.js`, replacing each `YOUR_…` placeholder. Firebase web config is public client configuration; do not put service account keys or other private credentials in this file.
3. In Firebase Console, create a Cloud Firestore database.
4. Publish the rules from `firestore.rules` in Firestore → Rules. This client-only demo allows public survey reads, public response creation, and public response reads so its unauthenticated dashboard can display results. It disallows deletes and response updates. Survey creation/update is also public to support the no-auth builder; use Firebase Authentication and tighter rules before collecting sensitive data.
5. In Firebase Authentication → Settings → Authorized domains, ensure your GitHub Pages domain is listed if the app needs it for any later auth additions.

## Deploy to GitHub Pages

1. Push this repository to GitHub with the default branch named `main`.
2. In the repo, open **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**, and save.
3. The workflow at `.github/workflows/deploy.yml` deploys the repository root on every push to `main`. Its permissions are limited to `contents: read`, `pages: write`, and `id-token: write`.
4. Open the **Actions** tab and inspect **Deploy to GitHub Pages**. After it succeeds, the workflow's deployment environment shows the live URL.
5. The live project site is [https://mkpalld2008-cp.github.io/my-profile/](https://mkpalld2008-cp.github.io/my-profile/).

No secrets are needed by the deployment workflow. If you later add private CI credentials, store them under **Settings → Secrets and variables → Actions**; do not commit them.

## Feature checklist

- [x] **Custom survey:** add, remove, reorder, and edit short text, paragraph, multiple choice, checkboxes, dropdown, and 1–5 rating questions; required toggle; survey title and description.
- [x] **Shareable link:** saving creates a Firestore ID, a `survey.html?id=<id>` link, and a copy-link control. Links are relative and work under a GitHub Pages project subpath.
- [x] **Collect responses:** public survey page, required-field checks, confirmation screen, and Firestore response storage.
- [x] **Results dashboard:** total response count, choice bar charts, average ratings, text-answer lists, and CSV export.

## Files

- `index.html`, `builder.html`, `survey.html`, `results.html`: app pages.
- `js/`: Firebase setup and page modules.
- `css/styles.css`: responsive dark UI.
- `firestore.rules`: Firestore access rules.
- `.github/workflows/deploy.yml`: GitHub Pages deployment.
