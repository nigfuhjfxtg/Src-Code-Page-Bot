const { sendMessage } = require('./sendMessage');
const commands = new Map();

// تحميل الأوامر (مثل handleMessage.js)
require('./handleMessage').loadCommands();

const handlePostback = async (event, pageAccessToken) => {
  const { id: senderId } = event.sender || {};
  const { payload } = event.postback || {};

  if (!senderId || !payload) return;

  try {
    // معالجة الضغطات على أزرار help
    if (payload.startsWith('CMD_')) {
      const cmdName = payload.replace('CMD_', '').toLowerCase();
      const command = commands.get(cmdName);
      
      if (command) {
        await sendMessage(senderId, {
          text: `⚙️ **${command.name}**\n📝 ${command.description}\n🔧 الاستخدام: ${command.usage || 'لا يوجد'}`
        }, pageAccessToken);
      }
    }
  } catch (err) {
    console.error('Postback Error:', err);
    await sendMessage(senderId, { text: '⚠️ تعذر تحميل التفاصيل!' }, pageAccessToken);
  }
};

module.exports = { handlePostback };
