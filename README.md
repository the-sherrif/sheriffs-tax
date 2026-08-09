# The Sheriff's Tax — GitHub Pages Starter

A $0 static website for the Sheriff's Tax experiment.

## What is included

- `index.html` — the complete single-page site
- `styles.css` — design and responsive layout
- `script.js` — small interactions: tax form, copy button, Deputy referral link generator
- `assets/x-banner.png` — the X banner supplied for the project (if included)

## Important before launch

This is a front-end starter. It does NOT process crypto payments and it does NOT have a real-time blockchain backend.

Before accepting real payments:
1. Replace `0xYOUR_TREASURY_ADDRESS` in `index.html` with the correct public Treasury address.
2. Add a real blockchain explorer link.
3. Decide how you will verify and publish payments.
4. Add the final legal/risk disclosure you need for your jurisdiction.
5. Test the entire flow with a small amount before public launch.

The current Deputy system creates shareable referral URLs, but it does not provide server-side attribution or payment tracking. That requires a backend or external data service.

## Publish on GitHub Pages

1. Create a GitHub account if you don't already have one.
2. Create a new **public** repository, e.g. `sheriffs-tax`.
3. Upload all files and the `assets` folder.
4. Open the repository's **Settings → Pages**.
5. Under "Build and deployment", choose **Deploy from a branch**.
6. Select the `main` branch and `/ (root)`.
7. Save.
8. GitHub will give you a public `github.io` URL.

You can change the site later by editing the files and committing the changes. GitHub Pages will rebuild automatically.
