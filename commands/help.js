const { sendMessage } = require('../handles/sendMessage');

// 1. قائمة الأوامر اليدوية
const manualCommands = [
  {
    name: "بينج",
    description: "فحص سرعة البوت",
    usage: "بينج",
    author: "النظام"
  },
  {
    name: "الطقس",
    description: "معرفة حالة الطقس",
    usage: "الطقس [المدينة]",
    author: "فريق الأرصاد"
  },
  {
    name: "حساب",
    description: "إجراء عمليات حسابية",
    usage: "حساب <عملية> <رقم1> <رقم2>",
    author: "فريق الرياضيات"
  }
];

module.exports = {
  name: 'مساعدة',
  description: 'عرض الأوامر المضافة يدويًا',
  usage: 'مساعدة [اسم الأمر]',
  author: 'المطور',
  execute(senderId, args, pageAccessToken) {
    
    // 2. حالة طلب أمر معين
    if (args.length > 0) {
      const cmdName = args[0].toLowerCase();
      const command = manualCommands.find(c => c.name.toLowerCase() === cmdName);
      
      if (command) {
        const response = `
⚙️ **${command.name}**
📝 ${command.description}
🔧 الاستخدام: \`${command.usage}\`
👤 المطور: ${command.author}`;
        
        return sendMessage(senderId, { text: response }, pageAccessToken);
      }
      return sendMessage(senderId, { text: "⚠️ هذا الأمر غير موجود!" }, pageAccessToken);
    }

    // 3. إنشاء أزرار للأوامر الأساسية
    const quickReplies = manualCommands.map(cmd => ({
      content_type: 'text',
      title: `🎮 ${cmd.name}`,
      payload: `HELP_${cmd.name.replace(/\s/g, '_')}` // استبدال المسافات بشرطات
    }));

    // 4. إضافة أزرار إضافية
    quickReplies.push(
      {
        content_type: 'text',
        title: '❌ إغلاق',
        payload: 'CLOSE_HELP'
      },
      {
        content_type: 'text',
        title: '📞 الدعم',
        payload: 'CONTACT_SUPPORT'
      }
    );

    // 5. إرسال الرسالة النهائية
    sendMessage(senderId, {
      text: "📜 **قائمة الأوامر الرئيسية**\n▸ اختر أحد الأوامر:",
      quick_replies: quickReplies.slice(0, 11) // الحد الأقصى للأزرار
    }, pageAccessToken);
  }
};
