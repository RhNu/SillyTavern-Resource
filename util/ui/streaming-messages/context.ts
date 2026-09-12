import { createContext, useContext } from 'react';

/**
 * 通过 `mountStreamingMessages` 挂载的流式界面将会得到的响应式数据
 */
export type StreamingMessageContext = {
  prefix: string;
  host_id: string;

  message_id: number;
  message: string;
  during_streaming: boolean;
};

const context = createContext<StreamingMessageContext | null>(null);
export const StreamingMessageProvider = context.Provider;

export function useStreamingMessageContext(): Readonly<StreamingMessageContext> {
  const value = useContext(context);
  if (!value) {
    throw new Error(`useStreamingMessageContext must be used inside mountStreamingMessages provider.`);
  }
  return value;
}
