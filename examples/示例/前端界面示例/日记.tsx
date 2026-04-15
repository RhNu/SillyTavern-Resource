import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './日记.scss';

export default function Diary() {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState('');

  function captureDisplayText() {
    const characterName = substitudeMacros('{{char}}');
    const messageId = getCurrentMessageId();
    const chatMessage = getChatMessages(messageId)[0];
    const dialogue = chatMessage?.message.match(/\[查看日记[:：]\s*(.+)\]/)?.[1] ?? '';
    setDisplayText(`${characterName}: ${dialogue}`);
  }

  useEffect(() => {
    captureDisplayText();
  }, []);

  return (
    <div className="clickdiv" tabIndex={1} onClick={() => navigate('/选择框')}>
      <span className="message-content font-bold underline">{displayText}</span>
    </div>
  );
}
