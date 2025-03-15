const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

let commandCache = null;

function loadCommands() {
  try {
    const commandsDir = path.join(__dirname, '../commands');
    if (!fs.existsSync(commandsDir)) {
      console.error('[ERROR] Commands directory not found!');
      return [];
    }
    
    const commandFiles = fs.readdirSync(commandsDir)
      .filter(file => file.endsWith('.js') && !file.startsWith('_'));

    commandCache = commandFiles.reduce((acc, file) => {
      try {
        const command = require(path.join(commandsDir, file));
        if (command.name && command.description) {
          acc.push(command);
        } else {
          console.warn(`[WARNING] Invalid command in file: ${file}`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed to load ${file}:`, error.message);
      }
      return acc;
    }, []);

    console.log(`[SUCCESS] Loaded ${commandCache.length} commands`);
    return commandCache;
  } catch (error) {
    console.error('[CRITICAL] Command loader failed:', error);
    return [];
  }
}

module.exports = {
  name: 'help',
  description: 'عرض الأوامر مع أزرار تفاعلية',
  usage: 'help',
  author: 'System',
  execute(senderId, args, pageAccessToken) {
    // التحميل الأولي مع التحقق من وجود الأوامر
    if (!commandCache || commandCache.length === 0) {
      commandCache = loadCommands();
    }

    // حالة عدم وجود أوامر
    if (commandCache.length === 0) {
      return sendMessage(senderId, {
        text: '⚠️ لا توجد أوامر متاحة حالياً!'
      }, pageAccessToken);
    }

    // معالجة طلب صفحة معينة
    const currentPage = parseInt(args[1]) || 1;
    const ITEMS_PER_PAGE = 7;
    const totalPages = Math.ceil(commandCache.length / ITEMS_PER_PAGE);
    
    // استخراج الأوامر للصفحة الحالية
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageCommands = commandCache.slice(startIdx, endIdx);

    // إنشاء الأزرار الأساسية
    const quickReplies = pageCommands.map(cmd => ({
      content_type: 'text',
      title: `🔹 ${cmd.name}`, // إضافة رمز قبل اسم الأمر
      payload: `HELP_CMD_${cmd.name.toUpperCase()}`
    }));

    // أزرار التنقل بين الصفحات
    if (totalPages > 1) {
      if (currentPage > 1) {
        quickReplies.unshift({
          content_type: 'text',
          title: '⏪ الصفحة السابقة',
          payload: `HELP_PAGE_${currentPage - 1}`
        });
      }
      
      if (currentPage < totalPages) {
        quickReplies.push({
          content_type: 'text',
          title: '⏩ الصفحة التالية',
          payload: `HELP_PAGE_${currentPage + 1}`
        });
      }
    }

    // إضافة زر المساعدة والإغلاق
    quickReplies.push(
      {
        content_type: 'text',
        title: '❔ مساعدة',
        payload: 'GENERAL_HELP'
      },
      {
        content_type: 'text',
        title: '❌ إغلاق',
        payload: 'CLOSE_HELP'
      }
    );

    // إرسال الرسالة مع التحقق النهائي
    if (quickReplies.length > 0) {
      sendMessage(senderId, {
        text: `📂 **الأوامر المتاحة - الصفحة ${currentPage}/${totalPages}**\n` +
              '▸ اختر أحد الأوامر:',
        quick_replies: quickReplies.slice(0, 11) // الحد الأقصى لعدد الأزرار
      }, pageAccessToken);
    } else {
      sendMessage(senderId, {
        text: '⚠️ حدث خطأ غير متوقع في تحميل الأوامر!'
      }, pageAccessToken);
    }
  }
};
