# FONOSAUR

An interactive world — Listen, Explore, Create, Collect (coming soon) and Follow —
with Field Notes managed in Keystatic and two embedded playgrounds (Create + the
Dino Sling game).

## Stack
- **Next.js (App Router)** on a Node runtime (Vercel) — not static export.
- **Keystatic** for Field Notes (editable from a phone browser).
- **Markdoc** for note bodies.

## What's wired
- `src/components/FonosaurSite.jsx` — the interactive shell (client component).
- `src/app/page.tsx` — server page; reads the latest Field Notes, passes them in.
- `src/app/explore/[slug]/page.tsx` — a single Field Note page.
- **Create** and **Dino Sling** are self-contained pages in `public/`
  (`create.html`, `dino-sling.html`) loaded in-frame — so they're easy to iterate
  on independently.
- `keystatic.config.ts` — the Field Note schema.

## Run locally
```bash
npm install
npm run dev
```
- Site: http://localhost:3000
- Content admin: http://localhost:3000/keystatic  (local mode — writes files on disk)

## Deploy order  (preview-first — switch the domain LAST)

1. **Push** this folder to a new repo on your `fonosaur` GitHub account.
2. **Vercel:** import the repo → it builds and gives you a `*.vercel.app` **preview URL**.
   *(This is the link to share with Nelson.)*
3. **Keystatic GitHub mode + Cloud (phone posting):**
   - set the production `repo` in `keystatic.config.ts`;
   - create a free project at keystatic.cloud, add its `KEYSTATIC_*` env vars in Vercel.
4. **Test on the preview URL:** open `<preview>.vercel.app/keystatic` on your phone,
   sign in, post a test Field Note, confirm it appears in Explore.
5. **Add real launch content** (still on preview): real Traversal links on Listen;
   wire Follow to Buttondown; a couple of genuine Field Notes; delete the sample.
6. **Final step — point the domain:** once it all checks out, point `fonosaur.com`
   (Namecheap) at Vercel.

## Still to wire (placeholders)
- Listen → real DSP links on the streaming chips.
- Follow → connect the email field to Buttondown.
- Create → pads play synthesised stand-ins until you drop in real one-shots
  (the seeded-palette / record / share-link machinery stays the same).
- Collect → intentionally "coming soon" until the EP.

## Build note
The interactive shell and both playgrounds are verified to compile, the TypeScript
was reviewed, and all dependencies resolve at the pinned versions above. A full
`next build` should be run on your machine first (it couldn't be completed in the
assembly sandbox). `npm install` pulls the patched Next 14.2.x automatically.
