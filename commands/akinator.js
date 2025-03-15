const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const akinatorSessions = {};

module.exports = {
  name: 'akinator',
  description: 'لعب لعبة أكيناتور باستخدام API TILMN AKINATOR',
  usage: 'akinator',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    try {
      // بدء اللعبة إذا لم تكن هناك جلسة حالياً
      if (!akinatorSessions[senderId]) {
        const response = await axios.get('https://tilmn-akinator-api.onrender.com/api/start?lang=ar');
        const { session, question } = response.data;
        akinatorSessions[senderId] = session;
        return sendAkinatorQuestion(senderId, question, session, pageAccessToken);
      }
      // إذا كانت اللعبة مستمرة
      await sendMessage(senderId, { text: 'أنت تلعب بالفعل! أجب على السؤال أو أرسل "إعادة" لبدء لعبة جديدة.' }, pageAccessToken);
    } catch (error) {
      console.error('خطأ في بدء أكيناتور:', error.message);
      await sendMessage(senderId, { text: 'حدث خطأ أثناء بدء اللعبة. حاول مرة أخرى لاحقًا.' }, pageAccessToken);
    }
  }
};

// دالة لإرسال السؤال باستخدام قالب Generic مع عناصر بها أزرار Postback
async function sendAkinatorQuestion(senderId, question, sessionId, pageAccessToken) {
  // تقسيم الإجابات إلى مجموعتين بسبب حد 3 أزرار لكل عنصر:
  const buttonsGroup1 = [
    { type: 'postback', title: 'نعم', payload: `AKINATOR_${sessionId}_0` },
    { type: 'postback', title: 'لا', payload: `AKINATOR_${sessionId}_1` },
    { type: 'postback', title: 'لا أعلم', payload: `AKINATOR_${sessionId}_2` }
  ];

  const buttonsGroup2 = [
    { type: 'postback', title: 'ربما', payload: `AKINATOR_${sessionId}_3` },
    { type: 'postback', title: 'على الأرجح لا', payload: `AKINATOR_${sessionId}_4` }
  ];

  const elements = [
    {
      title: 'اختر إجابة (1)',
      subtitle: question,
      buttons: buttonsGroup1
    },
    {
      title: 'اختر إجابة (2)',
      subtitle: '', // يمكن تركه فارغاً أو إضافة توضيح
      buttons: buttonsGroup2
    }
  ];

  const messageData = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: elements
      }
    }
  };

  await sendMessage(senderId, messageData, pageAccessToken);
}

// دالة لمعالجة الردود على أسئلة أكيناتور
async function handleAkinatorAnswer(senderId, payload, pageAccessToken) {
  const parts = payload.split('_');
  if (parts.length !== 3 || parts[0] !== 'AKINATOR') return;

  const sessionId = parts[1];
  const choice = parts[2];

  try {
    const response = await axios.get(`https://tilmn-akinator-api.onrender.com/api/answer?choice=${choice}&session=${sessionId}`);
    
    // إذا انتهت اللعبة
    if (response.data.endGame) {
      delete akinatorSessions[senderId];
      return sendMessage(senderId, { text: `أعتقد أن الشخصية هي: ${response.data.character}` }, pageAccessToken);
    }

    // إرسال السؤال التالي
    await sendAkinatorQuestion(senderId, response.data.question, sessionId, pageAccessToken);

  } catch (error) {
    console.error('خطأ في إرسال الإجابة:', error.message);
    await sendMessage(senderId, { text: 'حدث خطأ أثناء التفاعل مع أكيناتور. حاول مرة أخرى.' }, pageAccessToken);
  }
}

module.exports.handleAkinatorAnswer = handleAkinatorAnswer;
