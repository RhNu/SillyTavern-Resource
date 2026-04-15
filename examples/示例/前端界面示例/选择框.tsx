import { useMemo } from 'react';
import './选择框.scss';

type Props = {
  message: string;
};

type RoleplayOption = {
  title: string;
  content: string;
};

export default function RoleplayOptions({ message }: Props) {
  const options = useMemo<RoleplayOption[]>(() => {
    const text = message.match(/<roleplay_options>(.*?)<\/roleplay_options>/s)?.[1] ?? '';

    return [...text.matchAll(/(.+?)[:：]\s*(.+)/gm)].map(match => ({
      title: match[1],
      content: match[2].replace(/^\$\{(.+)\}$/, '$1').replace(/^「(.+)」$/, '$1'),
    }));
  }, [message]);

  async function handleClick(item: RoleplayOption) {
    await createChatMessages([{ role: 'user', message: item.content }]);
    triggerSlash('/trigger');
  }

  return (
    <div className="roleplay_options">
      <div className="roleplay_options_back">
        {options.map(option => (
          <div key={option.title} className="roleplay_options_item" tabIndex={1} onClick={() => handleClick(option)}>
            <span className="roleplay_options_title">
              <strong>{option.title}</strong>
            </span>
            <hr className="roleplay_options_hr" />
            <span className="roleplay_options_content">{option.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
