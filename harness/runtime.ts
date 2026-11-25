import { streamText, tool } from 'ai';
import type { JSONValue, ModelMessage } from 'ai';
import { DBOS } from '@dbos-inc/dbos-sdk';
import { model } from './model';
import { runTool, tools } from './tools';
import { SYSTEM_PROMPT } from './system-prompt';
import { randomUUID } from "node:crypto";
import { EventType, type Emit } from "@shared/events";
import { emit } from './bus';

// This is the seam the whole course lives in.
//
// Right now it is a STUB: it announces a workflow, logs that nothing is wired
// up yet, and finishes. The starter app runs end-to-end (browser → socket →
// server → bus → browser) with this hole in the middle.

// if we fall into an infinite tool call loop we can stop after the max count is reached
const MAX_ALLOWED_STEPS = 10;

type ToolCall = { toolCallId: string; toolName: string; input: Record<string, unknown> };
type Turn = { text: string; toolCalls: ToolCall[]; responseMessages: ModelMessage[] };


async function modelTurn(workflowId: string, messages: ModelMessage[]): Promise<Turn> {
  const result = streamText({ model, messages, tools });

  for await (const part of result.stream) {
    if (part.type === "text-delta") {
      await emit({ type: EventType.ModelDelta, workflowId, text: part.text });
    }
  }

  const rawCalls = await result.toolCalls;
  return {
    text: await result.text,
    toolCalls: rawCalls.map((c) => ({
      toolCallId: c.toolCallId,
      toolName: c.toolName,
      input: c.input as Record<string, unknown>,
    })),
    responseMessages: await result.responseMessages,
  };
}


async function toolStep(
  workflowId: string,
  call: ToolCall
): Promise<Record<string, unknown>> {
  await emit({
    type: EventType.ToolRequested,
    workflowId,
    toolCallId: call.toolCallId,
    name: call.toolName,
    args: call.input,
  });
  const output = await runTool(call.toolName, call.input);
  await emit({
    type: EventType.ToolCompleted,
    workflowId,
    toolCallId: call.toolCallId,
    result: output,
  });
  return output;
}

// the orchestrator of the workflow
export async function agentWorkflow(input: string): Promise<string> {

  const workflowId = DBOS.workflowID ?? 'unknown';

  await DBOS.runStep(() => emit({ type: EventType.WorkflowStarted, workflowId, input }), { name: 'tool call started' });

  const messages: ModelMessage[] = [
    { role: 'user', content: input }
  ];

  let step = 0;
  while (step < MAX_ALLOWED_STEPS) {
    const result = streamText({ model, messages, tools, instructions: SYSTEM_PROMPT })
    const turn = await DBOS.runStep(() => modelTurn(workflowId, messages), {
      name: `model-${step}`,
    });
    const responseMessages = await turn.responseMessages;
    // for await (const part of result.stream) {
    //   switch (part.type) {
    //     case 'text-delta':
    //       emit({ type: EventType.ModelDelta, workflowId, text: part.text })
    //       break;
    //     case "tool-call":
    //       emit({
    //         type: EventType.ToolRequested,
    //         workflowId,
    //         toolCallId: part.toolCallId,
    //         name: part.toolName,
    //         args: part.input,
    //       });
    //       break;
    //     case "tool-result":
    //       emit({
    //         type: EventType.ToolCompleted,
    //         workflowId,
    //         toolCallId: part.toolCallId,
    //         result: part.output,
    //       });
    //       break;
    //     case "error":
    //       emit({ type: EventType.WorkflowFailed, workflowId, error: String(part.error) });
    //       return;
    //   }
    // }

    console.log(JSON.stringify(responseMessages));
    messages.push(...(responseMessages));

    // no more tool calls, then it means we already have everything we need.
    if (turn.toolCalls.length === 0) {
      const text = await result.text;
      await DBOS.runStep(
        () => emit({ type: EventType.ModelCompleted, workflowId, text: turn.text }),
        { name: `model-done-${step}` },
      );
      await DBOS.runStep(
        () => emit({ type: EventType.WorkflowCompleted, workflowId, output: turn.text }),
        { name: "completed" },
      );

      console.log(`Total steps: ${step}`)
      return turn.text;
    }

    for (const call of turn.toolCalls) {
      // step, the tool was called 
      const output = await DBOS.runStep(() => toolStep(workflowId, call), {
        name: `tool-${call.toolCallId}`,
      });
      messages.push({
        role: 'tool',
        content: [{
          type: 'tool-result',
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          output: { type: 'json', value: output as JSONValue }
        }]
      });
    }

    step++;
    console.log(`Current step: ${step}`)
  }
  await DBOS.runStep(
      () =>
        emit({
          type: EventType.WorkflowFailed,
          workflowId,
          error: `Hit the ${MAX_ALLOWED_STEPS}-step limit without finishing.`,
        }),
      { name: "failed" },
    );
    return "";
}

export const runAgentWorkflow = DBOS.registerWorkflow(agentWorkflow, {
  name: "agentWorkflow",
});