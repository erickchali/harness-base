# Harness Engineering & Agent Orchestration

> Stop building scripts. Start building durable multi-agent systems.

Infrastructure layer around an LLM — the **harness** — that makes agents survive production.
Move past basic while-loops and API wrappers and learn the patterns that keep agents durable,
isolated, memory-aware, and coordinated.

## Setup

### 1. Clone and install

```bash
git clone <this repo url>
cd harness-base
npm install
```

### 2. Configure environment variables

Copy `.dev.vars.example` to `.dev.vars` and fill in your keys. An OpenAI API key is the only
hard requirement

```
OPENAI_API_KEY=sk-...
```

### 3. Run things

```bash
npm run dev    # start the app: harness server (:8787) + inspector UI (:5173)
npm run typecheck
```

`npm run dev` boots the **Harness Inspector** — a chat pane on the left and a live
event-stream pane on the right. Out of the box the agent is a stub: submit a task and
you'll see the harness emit `workflow.started` → a "no agent yet" log → `workflow.completed`.
