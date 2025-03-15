const axios = require("axios");
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gpt4',
  description: 'التفاعل مع GPT-4o',
  usage: 'gpt4 [رسالتك]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) {
      return sendMessage(senderId, { text: "استخدام: gpt4 <سؤالك>" }, pageAccessToken);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // مهلة 30 ثانية

      const { data } = await axios.post(
        'https://kaiz-apis.gleeze.com/api/gpt-4o',
        {
          messages: [{ role: 'user', content: prompt }], // إرسال الرسالة فقط دون محادثات سابقة
          uid: senderId,
          webSearch: 'off'
        },
        { signal: controller.signal } // إرفاق إشارة الإلغاء
      );

      clearTimeout(timeout);

      const botResponse = data.response || 'لم أتلقَ ردًا.';
      sendMessage(senderId, { text: botResponse }, pageAccessToken);

    } catch (error) {
      console.error('خطأ في الاتصال بالخادم:', error.message);
      let errorMessage = 'حدث خطأ. يرجى المحاولة لاحقًا.';
      
      if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        errorMessage = "انتهت مهلة الطلب. يرجى إعادة المحاولة بطلب أقصر.";
      }

      sendMessage(senderId, { text: errorMessage }, pageAccessToken);
    }
  }
};
