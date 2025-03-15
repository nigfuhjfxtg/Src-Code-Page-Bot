const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

// 1. إنشاء تخزين مؤقت للأوامر
let commandCache = null;

// 2. دالة لتحميل الأوامر مع معالجة الأخطاء
function loadCommands() {
  const commandsDir = path.join(__dirname, '../commands');
  
  try {
    // 3. التحقق من وجود المجلد
    if (!fs.existsSync(commandsDir)) {
      throw new Error('Commands directory not found!');
    }

    // 4. قراءة الملفات مع تصفية الملفات المخفية
    const commandFiles = fs.readdirSync(commandsDir)
      .filter(file => file.endsWith('.js') && !file.startsWith('_'));

    // 5. تحميل الأوامر مع التعامل مع الأخطاء
    commandCache = commandFiles.map(file => {
      try {
        const command = require(path.join(commandsDir, file));
        
        // 6. التحقق من الحقول الأساسية
        if (!command.name || !command.description) {
          console.warn(`Invalid command in file: ${file}`);
          return null;
        }
        
        return command;
      } catch (error) {
        console.error(`Failed to load ${file}:`, error.message);
        return null;
      }
    }).filter(Boolean); // 7. إزالة الأوامر الفاشلة
    
  } catch (error) {
    console.error('Critical error:', error.message);
    commandCache = [];
  }
}

module.exports = {
  name: 'help',
  description: 'عرض الأوامر المتاحة مع تفاصيلها',
  usage: 'help [اسم الأمر]',
  author: 'System',
  execute(senderId, args, pageAccessToken) {
    // 8. تحميل الأوامر إذا لم يتم تحميلها مسبقًا
    if (!commandCache) loadCommands();

    // 9. معالجة طلب أمر معين
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const command = commandCache.find(c => c.name.toLowerCase() === commandName);

      if (command) {
        const response = `
🛠️ **${command.name}**
📝 ${command.description}
⚡ الاستخدام: ${command.usage || 'لا يوجد'}

🔍 ${command.author ? `المطور: ${command.author}` : ''}`;

        return sendMessage(senderId, { text: response }, pageAccessToken);
      }
      return sendMessage(senderId, { text: '⚠️ الأمر غير موجود!' }, pageAccessToken);
    }

    // 10. إنشاء قائمة الأوامر مع الترقيم
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.ceil(commandCache.length / ITEMS_PER_PAGE);
    const currentPage = Math.min(parseInt(args[1]) || 1, totalPages);

    // 11. توليد الأزرار التفاعلية
    const quickReplies = commandCache
      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
      .map(cmd => ({
        content_type: 'text',
        title: `📌 ${cmd.name}`,
        payload: `HELP_${cmd.name}`
      }));

    // 12. إضافة أزرار التنقل بين الصفحات
    if (totalPages > 1) {
      if (currentPage > 1) {
        quickReplies.unshift({
          content_type: 'text',
          title: '⏪ السابق',
          payload: `HELP_PAGE_${currentPage - 1}`
        });
      }
      
      if (currentPage < totalPages) {
        quickReplies.push({
          content_type: 'text',
          title: '⏩ التالي',
          payload: `HELP_PAGE_${currentPage + 1}`
        });
      }
    }

    // 13. إرسال الرسالة النهائية
    sendMessage(senderId, {
      text: `📚 **الأوامر المتاحة (الصفحة ${currentPage}/${totalPages})**\n` +
            '▸ اختر أحد الأوامر:',
      quick_replies: quickReplies.slice(0, 11) // الحد الأقصى لعدد الأزرار
    }, pageAccessToken);
  }
};
