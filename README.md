# Skola
_Note: Skola is still in early-ish development. Expect bugs, missing features, and breaking changes. Feedback is very welcome!_

<img width="1512" alt="Skola Main Interface" src="https://github.com/user-attachments/assets/466477b2-7a60-4587-b161-d17f14a1f4e2" />

A modern, open-source spaced repetition application that reimagines flashcard learning with a focus on beautiful design, local-first architecture, and thoughtful user experience. Visit [skola.cards](https://skola.cards) now.

## Running this local-only fork

This fork is based on [h16nning/skola](https://github.com/h16nning/skola), licensed under AGPL-3.0. This branch removes cloud sync and sign-in. Decks and cards stay in your browser's IndexedDB. No account is needed, and remotely hosted images in cards do not load.

My fork of Skola, modified by Eli King on Nov 18, 2026. Not official Skola. [Source for this fork](https://github.com/eli-w-king/skola).

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm start --host 127.0.0.1`.
3. Open the localhost URL printed by Vite. Reuse the same browser profile and URL, including its port, to see the same data. You can export a backup in **Settings > Database**.

For a reproducible public build, set `VITE_SOURCE_REVISION` to the source commit SHA when running `pnpm build`. The visible source link then points to that revision.

Ratings appear directly below a revealed answer. Study shortcuts and scheduling are unchanged.

During study, press **Listen** to hear the prompt. After you reveal the answer, press **Listen** again to hear the answer. Hidden cloze blanks are skipped, and nothing plays automatically. Listen uses an installed voice exposed by your browser or desktop app; if none is available, it does not use a cloud voice.

## Core Features

**Local-First Architecture** — Your data lives in your browser using IndexedDB, ensuring privacy, speed, and complete ownership of your learning materials. No account required.

**Progressive Web App** — Install Skola on any device and use it offline. Full PWA support with caching.**

**Spaced Repetition** — Skola implements the FSRS (Free Spaced Repetition Scheduler) algorithm to optimize review timing and maximize retention with minimal effort.

**Beautiful, Minimal Design** — Custom-built component system with a unique design language that introduces texture and physicality. Decks appear as real index cards.

**Cognitive Prompts** — Beyond simple memorization, Skola strives to encourage higher-order thinking by challenging you with cognitive prompts on cards you've mastered, pushing you to deeper understanding.

**Rich Content Support** — Create normal, double-sided, and cloze deletion cards with full rich text (HTML) editing capabilities.

## Philosophy

Skola is built on the belief that spaced repetition software should be open, beautiful, and focused on the core learning experience. It challenges the notion that effective learning tools must sacrifice design for functionality or be locked behind paywalls.

AI is intentionally used sparingly – there's no AI flashcard generation. The act of creating cards is part of the learning process, and Skola is designed to support that work, not bypass it.

## Current Limitations

- Statistics view temporarily disabled during UI refactor (will return with lightweight charting)
- Notebook view experimental and under evaluation
- Image occlusion not yet implemented
- Audio attachments are not supported
- Limited note explorer and management features (e.g., bulk editing, tagging)

## Stack

- **React**
- **Dexie.js**
- **FSRS.js**

## Motivation

Many learners rely on spaced repetition tools like Anki, which are powerful but often have unintuitive interfaces that don't reward the learning process. Other alternatives are expensive or closed-source. Skola aims to provide a free, open-source alternative that doesn't compromise on user experience or design quality.

## Contributing

Contributions and feedback are very welcome! If you're interested in helping shape the future of Skola, please create an issue or start a discussion. This is an active project with ongoing development.

---
