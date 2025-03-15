const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// كائن لتخزين جلسات لعبة أكيناتور لكل مستخدم
const sessions = {};

module.exports = {
  name: 'akinator',
  description: 'بدء لعبة أكيناتور باستخدام API TILMN AKINATOR',
  usage: 'akinator',
  author: 'YourName',

  // تُمرر sendMessage كمعامل رابع من ملف الهاندل
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      // استدعاء نقطة بدء اللعبة (حدد اللغة "ar" للغة العربية، يمكنك تغييرها إلى "en" أو "fr" حسب الحاجة)
      const startUrl = 'https://tilmn-akinator-api.onrender.com/api/start?lang=ar';
      const response = await axios.get(startUrl);
      const data = response.data;
      
      // التأكد من صحة البيانات المستلمة
      if (!data || !data.question || !data.sessionId) {
        return await sendMessage(
          senderId,
          { text: 'حدث خطأ أثناء بدء اللعبة. يرجى المحاولة مرة أخرى.' },
          pageAccessToken
        );
      }
      
      // تخزين معرف الجلسة للمستخدم
      sessions[senderId] = {
        sessionId: data.sessionId
        // يمكن إضافة معلومات إضافية مثل خطوة اللعبة إذا احتجت لذلك
      };

      // تعريف الإجابات الممكنة حسب توثيق API:
      // 0 = نعم، 1 = لا، 2 = لا أعلم، 3 = ربما، 4 = على الأرجح لا
      const answers = [
        { label: 'نعم', value: 0 },
        { label: 'لا', value: 1 },
        { label: 'لا أعلم', value: 2 },
        { label: 'ربما', value: 3 },
        { label: 'على الأرجح لا', value: 4 }
      ];

      // توليد أزرار Quick Replies لكل إجابة
      const quickReplies = answers.map(answer => ({
        content_type: 'text',
        title: answer.label,
        // يتم إرسال الـ payload بصيغة "AKINATOR_<sessionId>_<choice>"
        payload: `AKINATOR_${data.sessionId}_${answer.value}`
      }));

      // إرسال السؤال الأول للمستخدم مع Quick Replies
      const messageData = {
        text: data.question,
        quick_replies: quickReplies
      };

      await sendMessage(senderId, messageData, pageAccessToken);

    } catch (error) {
      console.error('Error in akinator command:', error.message);
      await sendMessage(
        senderId,
        { text: 'حدث خطأ أثناء بدء لعبة أكيناتور. يرجى المحاولة لاحقًا.' },
        pageAccessToken
      );
    }
  }
};
