const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// تعريف كائن لتخزين المحادثات
const conversations = {};

module.exports = {
  name: 'gpt4',
  description: 'التفاعل مع GPT-4o',
  usage: 'gpt4 [رسالتك]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) {
      return await sendMessage(senderId, { text: "استخدام: gpt4 <سؤالك>" }, pageAccessToken);
    }

    // استرجاع المحادثة أو إنشاء جديدة للمستخدم
    let userMessages = conversations[senderId] || [];

    // تحديد سعة المحادثة (مثلاً: آخر 10 رسائل)
    if (userMessages.length >= 10) {
      userMessages = userMessages.slice(-9);
    }

    userMessages.push({ role: 'user', content: prompt });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const { data } = await axios.post(
        'https://kaiz-apis.gleeze.com/api/gpt-4o',
        {
          messages: userMessages,
          uid: senderId,
          webSearch: 'off'
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const botResponse = data.response || 'لم أتلقَ ردًا.';
      userMessages.push({ role: 'bot', content: botResponse });

      // تحديث المحادثة في الكائن الجلوبال
      conversations[senderId] = userMessages.slice(-10); 

      await sendMessage(senderId, { text: botResponse }, pageAccessToken);

    } catch (error) {
      console.error('خطأ في الاتصال بالخادم:', error.message);
      let errorMessage = 'حدث خطأ. يرجى المحاولة لاحقًا.';

      if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        errorMessage = "انتهت مهلة الطلب. يرجى إعادة المحاولة بطلب أقصر.";
      }

      await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
    }
  }
};
