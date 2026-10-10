# Hacker's Terminal — safe cybersecurity training game

Browser-based, entirely simulated cybersecurity missions with no backend, account, telemetry, or network scanning. Built with React, TypeScript, Vite, and Tailwind CSS.

## What works

- Search and navigate a simulated Linux filesystem with `ls`, `cd`, `pwd`, `cat` and `grep`.
- Decode Base64 notes with `decode`.
- Run a **simulated** `nmap` command against a fictional lab IP (no network packets sent).
- Complete four deterministic missions with tracked objective progress and XP.
- Responsive terminal, accessible keyboard and mobile input, ↑/↓ command history, local progress saving, a reset control, and a skip-intro button.
- No third-party services, cookies, sign-in, or network calls are needed at runtime. Storage access is optional and guarded against errors.

## Run locally

```bash
git clone https://github.com/ronoc2020/Hackers_Terminal_Game.git
cd Hackers_Terminal_Game
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Offline checks

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Publish

The included workflow builds once with Node 22 and uses GitHub's official Pages artifact deployment. It does **not** require a custom `apitoken` secret. Configure GitHub Pages deployment source to **GitHub Actions**.

**GitHub Actions quota notice (October 2026):** repair is staged in `repair/no-actions-20261009` while the account quota is exhausted. Creating this branch does not trigger the workflow (which listens only to pushes on `main`). Do not merge until CI usage becomes available again, or publish the built `dist/` directory through a separate authorized static host.

## Educational scope

Everything happens in local browser memory. The game makes no attacks, real scans, or outbound API calls. Commands never execute against your operating system. The lab IP is simulated.

## Current scope

Four complete missions with optional local save. No account system, backend, leaderboard, or multiplayer has been claimed or implemented.
