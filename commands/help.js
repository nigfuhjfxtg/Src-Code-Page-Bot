const fs = require('fs');
const path = require('path');

// تخزين مؤقت للأوامر
let commandCache = null;

// دالة لتحميل الأوامر مع معالجة الأخطاء
function loadCommands() {
  const commandsDir = path.join(__dirname, '../commands');
  
  try {
    // التحقق من وجود مجلد الأوامر
    if (!fs.existsSync(commandsDir)) {
      throw new Error('Commands directory not found!');
    }

    // قراءة الملفات مع تصفية الملفات المخفية
    const commandFiles = fs.readdirSync(commandsDir)
      .filter(file => file.endsWith('.js') && !file.startsWith('_'));

    // تحميل الأوامر والتحقق من صحة الحقول الأساسية
    commandCache = commandFiles.map(file => {
      try {
        const command = require(path.join(commandsDir, file));
        
        if (!command.name || !command.description) {
          console.warn(`Invalid command in file: ${file}`);
          return null;
        }
        
        return command;
      } catch (error) {
        console.error(`Failed to load ${file}:`, error.message);
        return null;
      }
    }).filter(Boolean);
    
  } catch (error) {
    console.error('Critical error:', error.message);
    commandCache = [];
  }
}

module.exports = {
  name: 'help',
  description: 'عرض الأوامر المتاحة مع تفاصيلها',
  usage: 'help [اسم الأمر] [رقم الصفحة]',
  author: 'System',

  // يتم تمرير sendMessage كمعامل رابع
  execute(senderId, args, pageAccessToken, sendMessage) {
    // تحميل الأوامر إذا لم تكن محملة مسبقاً
    if (!commandCache) loadCommands();

    // إذا طلب المستخدم تفاصيل أمر معين
    if (args.length > 0 && args[0].toLowerCase() !== 'page') {
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

    // إعداد عرض قائمة الأوامر باستخدام Quick Replies
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.ceil(commandCache.length / ITEMS_PER_PAGE) || 1;
    const currentPage = Math.min(parseInt(args[1]) || 1, totalPages);

    // تحديد أوامر الصفحة الحالية
    const commandsThisPage = commandCache.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    // توليد Quick Replies للأوامر
    const quickReplies = commandsThisPage.map(cmd => ({
      content_type: 'text',
      title: `📌 ${cmd.name}`,
      payload: `HELP_${cmd.name}`
    }));

    // إضافة أزرار التنقل بين الصفحات إذا لزم الأمر
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

    // إرسال الرسالة مع Quick Replies (الحد الأقصى 11 زر)
    sendMessage(senderId, {
      text: `📚 **الأوامر المتاحة (صفحة ${currentPage}/${totalPages})**\nاختر أحد الأوامر:`,
      quick_replies: quickReplies.slice(0, 11)
    }, pageAccessToken);
  }
};
