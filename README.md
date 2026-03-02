# OpenZoo Card Creator

Web-based card creator for the OpenZoo open-source trading card game. Design custom cards in the browser and export print-ready PNGs.

## Features

- **Editor** — upload card art, live preview, inline text formatting
- **Card Types** — Beastie, Artifact, Spell, Potion, Aura, Terra, Token (+ Special Aura, Special Terra)
- **Elements** — full dual-type support with auto-resolved colors, banners, and strengths
- **Effect Block System** — compose abilities and attacks with auto layout
- **PNG Export** — standard and print-ready (with 3.5mm bleed) at 4x resolution
- **JSON Support** — ability to export/import cards as JSON
- **Gallery** — publish, browse, and remix cards

## Tech Stack

- **Framework:** [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- **State:** [Zustand](https://zustand.docs.pmnd.rs/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **Export:** [html-to-image](https://github.com/niconi21/html-to-image) + canvas compositing
- **Backend:** [Firebase](https://firebase.google.com/) (Firestore + Storage)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A Firebase project with Firestore and Storage enabled

### Setup

```bash
# Install dependencies
npm install

# Configure Firebase
cp .env.local.example .env.local
# Fill in your Firebase project config in .env.local

# Start dev server
npm run dev
```

### Firebase CORS 

Card art remix and re-export require CORS configured on your Firebase Storage bucket:

```bash
gsutil cors set cors.json gs://YOUR_BUCKET.firebasestorage.app
```

See `cors.json` in the project root for the configuration.

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Tests + type-check + production build
npm run lint       # ESLint
npm run preview    # Preview production build
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
```

### Utility Scripts

```bash
npx tsx scripts/generate-sitemap.ts    # Generate sitemap.xml
```

## Deployment (Optional)

The project includes a deploy script for self-hosting that builds, generates a sitemap, and rsyncs to a remote server.

### Setup

```bash
cp .deploy.env.example .deploy.env
# Fill in your server credentials in .deploy.env
```

### Deploy

```bash
bash scripts/deploy.sh
```

This will:
1. Run `npm run build`
2. Generate `sitemap.xml`
3. Rsync `dist/` to the remote server
4. Deploy the nginx config

## Project Structure

```
src/
├── components/
│   ├── card-renderer/   # Core rendering engine (CardRenderer, ZoneRenderer, TextParser)
│   ├── card-editor/     # Editor UI (sidebar, controls, export)
│   ├── gallery/         # Community gallery (grid, detail modal, card viewer)
│   ├── about/           # Project info
│   └── landing/         # Home page
├── data/
│   ├── layouts/         # Layout definitions
│   ├── constants.ts     # Element, Trait, Terra lists
│   ├── inlineClasses.ts # Text styling definitions
│   └── locales.ts       # i18n translations
├── lib/
│   ├── store.ts         # Zustand state management
│   ├── firebase.ts      # Firebase initialization
│   ├── exportUtils.ts   # Shared export constants + utilities
│   ├── galleryService.ts
│   ├── effectComposer.ts
│   └── ...
├── types/               # TypeScript type definitions
├── App.tsx              # Router
└── main.tsx             # Entry point
```

## Attributions

OpenZoo symbols are created by **Jack Penman** unless otherwise noted. Original icons are sourced from [game-icons.net](https://game-icons.net/) under CC BY 3.0. SCP-themed cards reference [SCP Foundation](https://scp-wiki.wikidot.com/) content under CC BY-SA 3.0. Full attribution details are available on the About page in the app at `/about`.

## License

Code is [MIT](LICENSE) licensed. Creative assets (images, icons, templates) are [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
