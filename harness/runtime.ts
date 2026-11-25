import { streamText, tool } from 'ai';
import type { ModelMessage } from 'ai';
import { model } from './model';
import { tools } from './tools';
import { SYSTEM_PROMPT } from './system-prompt';
import { randomUUID } from "node:crypto";
import { EventType, type Emit } from "@shared/events";

// This is the seam the whole course lives in.
//
// Right now it is a STUB: it announces a workflow, logs that nothing is wired
// up yet, and finishes. The starter app runs end-to-end (browser → socket →
// server → bus → browser) with this hole in the middle.
export async function runAgent(opts: { input: string; emit: Emit }): Promise<void> {
  const { input, emit } = opts;
  const workflowId = randomUUID();

  emit({ type: EventType.WorkflowStarted, workflowId, input });

  const messages: ModelMessage[] = [
    { role: 'user', content: input }
  ];

  let step = 0;
  while (step < 10) {
    const result = streamText({ model, messages, tools, instructions: SYSTEM_PROMPT })

    for await (const part of result.stream) {
      switch (part.type) {
        case 'text-delta':
          emit({ type: EventType.ModelDelta, workflowId, text: part.text })
          break;
        case "tool-call":
          emit({
            type: EventType.ToolRequested,
            workflowId,
            toolCallId: part.toolCallId,
            name: part.toolName,
            args: part.input,
          });
          break;
        case "tool-result":
          emit({
            type: EventType.ToolCompleted,
            workflowId,
            toolCallId: part.toolCallId,
            result: part.output,
          });
          break;
        case "error":
          emit({ type: EventType.WorkflowFailed, workflowId, error: String(part.error) });
          return;
      }
    }
    const responseMessages = await result.responseMessages;
    console.log(responseMessages);
    messages.push(...(responseMessages));

    const toolCalls = await result.toolCalls;
    // no more tool calls, then it means we already have everything we need.
    if (toolCalls.length === 0) {
      const text = await result.text;
      emit({ type: EventType.ModelCompleted, workflowId, text });
      emit({ type: EventType.WorkflowCompleted, workflowId, output: text });
      console.log(`Total steps: ${step}`)
      return;
    }

    step++;
    console.log(`Current step: ${step}`)
  }

  emit({
    type: EventType.Log,
    workflowId,
    level: "warn",
    message:
      "No agent yet. Adapt (harness/runtime.ts).",
  });

  emit({ type: EventType.WorkflowCompleted, workflowId, output: "(no agent implemented yet)" });
}
