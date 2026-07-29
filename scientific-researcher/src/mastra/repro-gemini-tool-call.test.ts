import { describe, expect, test } from 'bun:test';
import { Memory } from '@mastra/memory';

describe('Gemini Tool Call Context Desynchronization Repro', () => {
  test('naive lastMessages truncation creates orphaned toolResponse messages', () => {
    // Simulate a conversation history with 5 turns (10 messages)
    const conversation = [
      { id: '1', role: 'user', content: 'Initial prompt' },
      {
        id: '2',
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'call_1', name: 'arxiv_search', args: {} }],
      },
      {
        id: '3',
        role: 'tool',
        content: 'Result 1',
        toolCallId: 'call_1',
      },
      { id: '4', role: 'assistant', content: 'Thinking...' },
      { id: '5', role: 'user', content: 'Follow up prompt' },
      {
        id: '6',
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'call_2', name: 'github_search', args: {} }],
      },
      {
        id: '7',
        role: 'tool',
        content: 'Result 2',
        toolCallId: 'call_2',
      },
    ];

    // If lastMessages is set to 5, we keep messages from index 2 to 6:
    // Index 2: tool response for call_1
    // Index 3: assistant
    // Index 4: user
    // Index 5: assistant with call_2
    // Index 6: tool response for call_2
    const lastMessagesCount = 5;
    const truncatedHistory = conversation.slice(-lastMessagesCount);

    const firstMessage = truncatedHistory[0];
    const isOrphanedToolResponse =
      firstMessage.role === 'tool' &&
      !truncatedHistory.some(
        msg =>
          msg.role === 'assistant' &&
          msg.toolCalls?.some(tc => tc.id === firstMessage.toolCallId)
      );

    // Expect that naive slice creates an orphaned tool response
    expect(isOrphanedToolResponse).toBe(true);
  });
});
