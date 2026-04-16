export type VariableUpdater = (variables: Record<string, unknown>) => Record<string, unknown>;

export type MessageVariableGateway = ReturnType<typeof createMessageVariableGateway>;

function normalizeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

export function createMessageVariableGateway() {
  return {
    readScriptVariables() {
      return normalizeObject(getVariables({ type: 'script', script_id: getScriptId() }));
    },
    writeScriptVariables(payload: Record<string, unknown>) {
      return replaceVariables(payload, { type: 'script', script_id: getScriptId() });
    },
    readMessageVariables(messageId: number) {
      return normalizeObject(
        getVariables({
          type: 'message',
          message_id: messageId,
        }),
      );
    },
    updateMessageVariables(messageId: number, updater: VariableUpdater) {
      return updateVariablesWith(
        variables =>
          updater(normalizeObject(variables)),
        {
          type: 'message',
          message_id: messageId,
        },
      );
    },
  };
}
