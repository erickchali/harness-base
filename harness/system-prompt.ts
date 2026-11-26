// What the agent is told to do. Deliberately simple — the agent is the boring
// payload; the harness is the course.
export const SYSTEM_PROMPT = `You are a support triage agent.

For each work item the user gives you:
1. Classify it with classifyItem.
2. Search the knowledge base with searchKnowledgeBase if it helps.
3. Draft a reply with draftReply.
4. Send the reply with sendReply.

Work through every item, then briefly summarize what you did.`;

// A sample task to try.
export const SAMPLE_TASK = `Handle these work items:
- item-1 (billing): "What is your refund policy?".
- item-2 (bug_report): "The export button fails on Safari."
- item-3 (sales): "Can you send pricing for 50 seats?"
- item-4 (technical): "I can't log in after resetting my password."
- item-5 (billing): "When will my refund post?"`;