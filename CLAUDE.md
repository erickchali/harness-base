# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mini agent runtime, called the **harness**. It wraps a plain LLM loop and makes it
production-grade by owning state, events, tools, policies, and observability.

The agent is deliberately boring: a domain-neutral task agent. The harness is what matters.
**Agent systems are workflow systems:** the LLM decides the next semantic step, and the harness
owns execution.

The project has two parts:

- **Harness server** (Express + `ws`): runs the agent and streams its events over one WebSocket.
- **Inspector UI** (Vite + React): a web dashboard that renders that event stream live.

## Commands

```bash
npm install
cp .dev.vars.example .dev.vars   # then add your LLM provider key (e.g. OPENAI_API_KEY)

npm run dev         # harness server (:8787) + inspector UI (:5173)
npm run typecheck   # tsc --noEmit across server/shared/harness/web
```

`runAgent` in `harness/runtime.ts` is a stub at first. The app still runs end-to-end
(browser → ws → server → bus → browser), and the agent loop is the part left to fill in.

## Code Style

- **Simple and readable:** write code that is easy to type and follow.
- **No clever abstractions:** prefer straightforward, explicit code over DRY.
- **Easy to follow:** clarity beats elegance.

## Git Commits

Do not add co-author lines to commits.
