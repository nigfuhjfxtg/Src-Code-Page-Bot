const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

let commandCache = null;

function loadCommands() {
  const commandsDir = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
  
  commandCache = commandFiles.map(file => {
    try {
      const command = require(path.join(commandsDir, file));
      if (!command.name || !command.description) {
        console.warn(`Command file ${file} is missing required fields.`);
        return null;
      }
      return command;
    } catch (error) {
      console.error(`Error loading command ${file}:`, error);
      return null;
    }
  }).filter(Boolean);
}

module.exports = {
  name: 'help',
  description: 'عرض الأوامر المتاحة كأزرار',
  usage: 'help\nhelp [اسم الأمر]',
  author: 'System',
  execute(senderId, args, pageAccessToken) {
    if (!commandCache) loadCommands();

    // إذا كان هناك أمر معين مطلوب
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const command = commandCache.find(cmd => cmd.name.toLowerCase() === commandName);

      if (command) {
        const commandDetails = {
          text: `
━━━━━━━━━━━━━━
🛠️ **${command.name}**
📝 ${command.description}
⚡ الاستخدام: ${command.usage || 'لا يوجد'}
━━━━━━━━━━━━━━`,
          quick_replies: [
            {
              content_type: 'text',
              title: '🔙 الرجوع',
              payload: 'help',
            }
          ]
        };
        sendMessage(senderId, commandDetails, pageAccessToken);
      } else {
        sendMessage(senderId, { text: `⚠️ الأمر "${commandName}" غير موجود.` }, pageAccessToken);
      }
      return;
    }

    // إنشاء أزرار Quick Replies لكل أمر
    const quickReplies = commandCache.map(cmd => ({
      content_type: 'text',
      title: `⚡ ${cmd.name}`,
      payload: `help ${cmd.name}`, // إرسال الأمر عند النقر
    }));

    // إضافة زر "إغلاق" اختياري
    quickReplies.push({
      content_type: 'text',
      title: '❌ إغلاق',
      payload: 'CLOSE_HELP',
    });

    const helpMessage = {
      text: `
━━━━━━━━━━━━━━
🎮 **قائمة الأوامر المتاحة**
▸ اختر أحد الأوامر بالأسفل:
━━━━━━━━━━━━━━`,
      quick_replies: quickReplies
    };

    sendMessage(senderId, helpMessage, pageAccessToken);
  }
};
