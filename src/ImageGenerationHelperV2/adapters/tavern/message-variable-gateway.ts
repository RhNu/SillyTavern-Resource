import { normalizeVariablesRecord, readVariablesRecord } from '@util/variables';

export type VariableUpdater = (variables: Record<string, unknown>) => Record<string, unknown>;

export type MessageVariableGateway = ReturnType<typeof createMessageVariableGateway>;

export function createMessageVariableGateway() {
  return {
    readScriptVariables() {
      return readVariablesRecord({ type: 'script', script_id: getScriptId() });
    },
    writeScriptVariables(payload: Record<string, unknown>) {
      return replaceVariables(payload, { type: 'script', script_id: getScriptId() });
    },
    readMessageVariables(messageId: number) {
      return readVariablesRecord({
        type: 'message',
        message_id: messageId,
      });
    },
    updateMessageVariables(messageId: number, updater: VariableUpdater) {
      return updateVariablesWith(
        variables =>
          updater(normalizeVariablesRecord(variables)),
        {
          type: 'message',
          message_id: messageId,
        },
      );
    },
  };
}
