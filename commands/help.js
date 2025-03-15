const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

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
  execute(senderId, args, pageAccessToken) {
    // تحميل الأوامر إذا لم تكن محملة مسبقاً
    if (!commandCache) loadCommands();

    // في حالة طلب تفاصيل أمر معين
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

    // إعداد عرض قائمة الأوامر باستخدام قالب generic
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.ceil(commandCache.length / ITEMS_PER_PAGE) || 1;
    const currentPage = Math.min(parseInt(args[1]) || 1, totalPages);

    // توليد أزرار الأوامر للصفحة الحالية
    const commandButtons = commandCache
      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
      .map(cmd => ({
        type: 'postback',
        title: `📌 ${cmd.name}`,
        payload: `HELP_${cmd.name}`
      }));

    // توليد أزرار التنقل بين الصفحات إذا لزم الأمر
    const navButtons = [];
    if (totalPages > 1) {
      if (currentPage > 1) {
        navButtons.push({
          type: 'postback',
          title: '⏪ السابق',
          payload: `HELP_PAGE_${currentPage - 1}`
        });
      }
      if (currentPage < totalPages) {
        navButtons.push({
          type: 'postback',
          title: '⏩ التالي',
          payload: `HELP_PAGE_${currentPage + 1}`
        });
      }
    }

    // بناء عناصر الرسالة للقالب generic
    const elements = [];
    if (commandButtons.length > 0) {
      elements.push({
        title: 'قائمة الأوامر',
        subtitle: `اختر الأمر الذي تريده (صفحة ${currentPage}/${totalPages})`,
        image_url: 'https://i.ibb.co/dJzSv5Q/pagebot.jpg',
        buttons: commandButtons
      });
    }
    if (navButtons.length > 0) {
      elements.push({
        title: 'تنقل بين الصفحات',
        subtitle: `الصفحة ${currentPage} من ${totalPages}`,
        buttons: navButtons
      });
    }
    
    // إعداد رسالة القالب مع المرفق (attachment)
    const messageData = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: elements
        }
      }
    };

    // إرسال الرسالة إلى المستخدم
    sendMessage(senderId, messageData, pageAccessToken);
  }
};
