import { useStreamingMessageContext } from '@util/streaming';

export default function App() {
  const context = useStreamingMessageContext();

  return <div>{context.message}</div>;
}
