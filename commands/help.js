const fs = require('fs');
const path = require('path');

// لا نستورد sendMessage هنا
// const { sendMessage } = require('../handles/sendMessage');

// تخزين مؤقت للأوامر
let commandCache = null;

// دالة لتحميل الأوامر مع معالجة الأخطاء
function loadCommands() {
  const commandsDir = path.join(__dirname, '../commands');
  try {
    if (!fs.existsSync(commandsDir)) {
      throw new Error('Commands directory not found!');
    }

    const commandFiles = fs.readdirSync(commandsDir)
      .filter(file => file.endsWith('.js') && !file.startsWith('_'));

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

  // لاحظ أننا أضفنا sendMessage كمعامل رابع
  execute(senderId, args, pageAccessToken, sendMessage) {
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

    // تقسيم الأوامر إلى صفحات
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.ceil(commandCache.length / ITEMS_PER_PAGE) || 1;
    const currentPage = Math.min(parseInt(args[1]) || 1, totalPages);

    // أوامر الصفحة الحالية
    const commandsThisPage = commandCache.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    // توليد أزرار الأوامر (Postback)
    const commandButtons = commandsThisPage.map(cmd => ({
      type: 'postback',
      title: `📌 ${cmd.name}`,
      payload: `HELP_${cmd.name}`
    }));

    // توليد أزرار التنقل بين الصفحات
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

    // لضمان عدم تجاوز 3 أزرار في كل عنصر
    function chunkArray(array, chunkSize) {
      const chunks = [];
      for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
      }
      return chunks;
    }

    // تقسيم commandButtons إلى مجموعات حجم كل منها 3
    const buttonGroups = chunkArray(commandButtons, 3);

    // إنشاء عناصر الـGeneric Template
    const elements = [];

    // إضافة كل مجموعة من الأزرار كعنصر مستقل
    buttonGroups.forEach((group, index) => {
      elements.push({
        title: `قائمة الأوامر (مجموعة ${index + 1})`,
        subtitle: `صفحة ${currentPage}/${totalPages}`,
        image_url: 'https://i.ibb.co/dJzSv5Q/pagebot.jpg',
        buttons: group
      });
    });

    // عنصر خاص لأزرار التنقل إذا وجدت
    if (navButtons.length > 0) {
      elements.push({
        title: 'تنقل بين الصفحات',
        subtitle: `الصفحة ${currentPage} من ${totalPages}`,
        buttons: navButtons
      });
    }

    // إعداد رسالة القالب
    const messageData = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements
        }
      }
    };

    // إرسال الرسالة
    sendMessage(senderId, messageData, pageAccessToken);
  }
};
