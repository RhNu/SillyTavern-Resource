import { useStreamingMessageContext } from '@util/streaming';
import { useEffect, useMemo, useState } from 'react';
import RoleplayOptions from '../前端界面示例/选择框';
import Segment from './分段';
import SearchBar from './搜索框';
import Highlighter from './高亮';

export default function App() {
  const context = useStreamingMessageContext();
  const [query, setQuery] = useState('');

  const beforeIndex = useMemo(() => context.message.lastIndexOf('<roleplay_options>'), [context.message]);
  const beforeHtml = useMemo(
    () =>
      formatAsDisplayedMessage(context.message.slice(0, beforeIndex === -1 ? undefined : beforeIndex).trim(), {
        message_id: context.message_id,
      }),
    [beforeIndex, context.message, context.message_id],
  );

  const afterIndex = useMemo(() => context.message.lastIndexOf('</roleplay_options>'), [context.message]);
  const afterHtml = useMemo(() => {
    if (afterIndex === -1) {
      return null;
    }
    return formatAsDisplayedMessage(context.message.slice(afterIndex + 19).trim(), {
      message_id: context.message_id,
    });
  }, [afterIndex, context.message, context.message_id]);

  const middleHtml = useMemo(() => {
    if (beforeIndex !== -1 && afterIndex === -1) {
      return formatAsDisplayedMessage(context.message.slice(beforeIndex).trim(), {
        message_id: context.message_id,
      });
    }
    return null;
  }, [afterIndex, beforeIndex, context.message, context.message_id]);

  useEffect(() => {
    if (!context.during_streaming) {
      toastr.success(`第 ${context.message_id} 楼流式传输已完成`);
    }
  }, [context.during_streaming, context.message_id]);

  useEffect(() => {
    toastr.success(`成功挂载第 ${context.message_id} 条消息的流式楼层界面`);
  }, [context.message_id]);

  return (
    <>
      <SearchBar query={query} onQueryChange={setQuery} />

      {beforeHtml ? <Segment query={query} html={beforeHtml} /> : null}

      {beforeIndex !== -1 ? (
        middleHtml ? (
          <Segment query={query} html={middleHtml} />
        ) : (
          <Highlighter query={query}>
            <RoleplayOptions message={context.message} />
          </Highlighter>
        )
      ) : null}

      {afterHtml ? <Segment query={query} html={afterHtml} /> : null}
    </>
  );
}
