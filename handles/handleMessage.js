const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');

const commands = new Map();
const prefix = '-';

// تحميل الأوامن من المجلد
const loadCommands = () => {
  fs.readdirSync(path.join(__dirname, '../commands'))
    .filter(file => file.endsWith('.js'))
    .forEach(file => {
      const command = require(`../commands/${file}`);
      commands.set(command.name.toLowerCase(), command);
    });
};
loadCommands(); // التحميل الأولي

async function handleMessage(event, pageAccessToken) {
  const senderId = event?.sender?.id;
  if (!senderId) return;

  const messageText = event?.message?.text?.trim();
  if (!messageText) return;

  // حالة طلب الأمر help
  if (messageText.toLowerCase() === prefix + 'help') {
    const quickReplies = Array.from(commands.values()).map(cmd => ({
      content_type: 'text',
      title: `🎮 ${cmd.name}`,
      payload: `CMD_${cmd.name.toUpperCase()}`
    }));

    await sendMessage(senderId, {
      text: '📚 **الأوامر المتاحة:**',
      quick_replies: quickReplies.slice(0, 11) // 11 زر كحد أقصى
    }, pageAccessToken);
    return;
  }

  // معالجة الأوامر الأخرى...
  const [commandName, ...args] = messageText.startsWith(prefix)
    ? messageText.slice(prefix.length).split(' ')
    : messageText.split(' ');

  try {
    if (commands.has(commandName.toLowerCase())) {
      await commands.get(commandName.toLowerCase()).execute(senderId, args, pageAccessToken);
    } else {
      await commands.get('gpt4').execute(senderId, [messageText], pageAccessToken);
    }
  } catch (error) {
    console.error(`Error:`, error);
    await sendMessage(senderId, { text: '⚠️ خطأ في تنفيذ الأمر!' }, pageAccessToken);
  }
}

module.exports = { handleMessage };
