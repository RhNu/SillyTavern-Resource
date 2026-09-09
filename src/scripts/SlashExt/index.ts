import { isSlashCommandArgumentTrue, slashCommand, slashCommandArgumentTypes } from '@util/slash-command';

function hideRange(start: number, end: number) {
  return triggerSlash(`/hide ${start}-${end}`);
}

function init() {
  // Hide-all command: Hides all messages in the current chat. Optionally jumps to the last message after hiding.
  slashCommand('hide-all')
    .aliases('ha', 'hideall')
    .help('隐藏所有消息')
    .named('jump', '跳转到最后一条消息', slashCommandArgumentTypes.bool, { defaultValue: false })
    .callback(async args => {
      const lastMessageId = getLastMessageId();
      console.log(`Hiding all messages up to ID ${lastMessageId}`);
      await hideRange(0, lastMessageId);
      if (isSlashCommandArgumentTrue(args.jump)) {
        await triggerSlash(`/chat-jump ${lastMessageId}`);
      }
    })
    .register();
  console.info('Slash command "hide-all" registered.');

  // Hide-except-last command: Hides all messages except the last one in the current chat.
  slashCommand('hide-except-last')
    .aliases('hideexceptlast')
    .help('隐藏除最后一条消息以外的所有消息')
    .callback(async () => {
      const lastMessageId = getLastMessageId();
      if (lastMessageId === 0) {
        console.log('No messages to hide.');
        return;
      }
      console.log(`Hiding all messages except the last one with ID ${lastMessageId}`);
      await hideRange(0, lastMessageId - 1);
    })
    .register();
  console.info('Slash command "hide-except-last" registered.');
}

$(() => {
  errorCatched(init)();
});
