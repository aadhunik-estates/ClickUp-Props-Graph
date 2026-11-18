# Aadhunik Inventory Explorer – live ClickUp sync
Customers open the link; the page asks `/api/inventory`; a Netlify function reads ClickUp with your secret token and returns only public fields. Changes in ClickUp show up within ~5 minutes automatically.

## Deploy (one time)
1. ClickUp: avatar > Settings > Apps > API Token > Generate. Copy the `pk_...` key. Never paste it in chat or in code.
2. GitHub: create a free account > New repository (private is fine) > "uploading an existing file" > drag in ALL files and folders from this project > Commit.
3. Netlify: Add new project > Import an existing project > GitHub > pick the repo. Leave build command empty; publish directory `public` (already set). Deploy.
4. Netlify > Site configuration > Environment variables > add `CLICKUP_API_TOKEN` = your key (optional: `VISIBLE_STATUSES` = `available,self`). Then Deploys > Trigger deploy.
5. Open `https://YOUR-SITE.netlify.app/api/inventory` – you should see JSON. Then open the site on your phone. Share that link.

## Change things
- Price brackets and WhatsApp number: top of `public/index.html` (`B` and `WA`).
- Refresh speed: `s-maxage` in `netlify/functions/inventory.js` (300 = 5 min).
