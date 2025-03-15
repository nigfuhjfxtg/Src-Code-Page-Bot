const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

let commandCache = null;

function loadCommands() {
  try {
    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    
    commandCache = commandFiles.map(file => {
      try {
        const command = require(path.join(commandsDir, file));
        if (!command.name || !command.description) {
          console.warn(`[WARN] Command ${file} is missing required fields`);
          return null;
        }
        return command;
      } catch (error) {
        console.error(`[ERROR] Failed to load command ${file}:`, error);
        return null;
      }
    }).filter(Boolean);
    
    console.log(`[INFO] Loaded ${commandCache.length} commands`);
  } catch (error) {
    console.error('[CRITICAL] Failed to load commands:', error);
    commandCache = [];
  }
}

module.exports = {
  name: 'help',
  description: 'عرض الأوامر كأزرار تفاعلية',
  usage: 'help\nhelp [اسم الأمر]',
  author: 'System',
  execute(senderId, args, pageAccessToken) {
    // التحميل الأولي للأوامر
    if (!commandCache) {
      loadCommands();
      if (commandCache.length === 0) {
        return sendMessage(senderId, { 
          text: '⚠️ تعذر تحميل الأوامر، الرجاء المحاولة لاحقاً.' 
        }, pageAccessToken);
      }
    }

    // حالة طلب أمر معين
    if (args.length > 0) {
      const [commandName, page] = args[0].toLowerCase().split('|');
      const command = commandCache.find(c => c.name.toLowerCase() === commandName);

      if (command) {
        const response = {
          text: `🎯 **${command.name}**\n📝 ${command.description}\n⚡ الاستخدام: ${command.usage || 'لا يوجد'}`,
          quick_replies: [
            {
              content_type: 'text',
              title: '🔙 الرجوع',
              payload: 'HELP_MAIN',
            }
          ]
        };
        return sendMessage(senderId, response, pageAccessToken);
      }
    }

    // إنشاء الأزرار الأساسية مع ترقيم الصفحات
    const MAX_BUTTONS = 10;
    const totalPages = Math.ceil(commandCache.length / MAX_BUTTONS);
    const currentPage = parseInt(args[1]) || 1;
    
    const paginatedCommands = commandCache.slice(
      (currentPage - 1) * MAX_BUTTONS,
      currentPage * MAX_BUTTONS
    );

    const quickReplies = paginatedCommands.map(cmd => ({
      content_type: 'text',
      title: `📌 ${cmd.name}`,
      payload: `HELP_${cmd.name.toUpperCase()}`,
    }));

    // أزرار التنقل بين الصفحات
    if (totalPages > 1) {
      if (currentPage > 1) {
        quickReplies.push({
          content_type: 'text',
          title: '◀️ الصفحة السابقة',
          payload: `HELP_PAGE|${currentPage - 1}`,
        });
      }
      
      if (currentPage < totalPages) {
        quickReplies.push({
          content_type: 'text',
          title: '▶️ الصفحة التالية',
          payload: `HELP_PAGE|${currentPage + 1}`,
        });
      }
    }

    // إضافة زر الإغلاق
    quickReplies.push({
      content_type: 'text',
      title: '❌ إغلاق',
      payload: 'HELP_CLOSE',
    });

    // إرسال الرسالة الرئيسية
    const message = {
      text: `📜 **القائمة الرئيسية - الصفحة ${currentPage}/${totalPages}**\n▸ اختر الأمر المطلوب:`,
      quick_replies: quickReplies
    };

    sendMessage(senderId, message, pageAccessToken);
  }
};
