import { useStreamingMessageContext } from '@util/ui/streaming-messages/context';

export default function App() {
  const context = useStreamingMessageContext();

  return <div>{context.message}</div>;
}
