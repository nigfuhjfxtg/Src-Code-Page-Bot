const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const akinatorSessions = {};

module.exports = {
  name: 'akinator',
  description: 'لعب لعبة أكيناتور',
  usage: 'akinator',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    try {
      // بدء اللعبة إذا لم يكن هناك جلسة
      if (!akinatorSessions[senderId]) {
        const response = await axios.get('https://tilmn-akinator-api.onrender.com/api/start?lang=ar');
        const { session, question } = response.data;

        akinatorSessions[senderId] = session;

        // إرسال السؤال الأول مع الأزرار السريعة
        return sendAkinatorQuestion(senderId, question, session, pageAccessToken);
      }

      sendMessage(senderId, { text: 'أنت تلعب بالفعل! أجب على السؤال أو أرسل "إعادة" لبدء لعبة جديدة.' }, pageAccessToken);

    } catch (error) {
      console.error('خطأ في بدء أكيناتور:', error.message);
      sendMessage(senderId, { text: 'حدث خطأ أثناء بدء اللعبة. حاول مرة أخرى لاحقًا.' }, pageAccessToken);
    }
  }
};

// إرسال السؤال مع الأزرار السريعة
async function sendAkinatorQuestion(senderId, question, sessionId, pageAccessToken) {
  const quickReplies = [
    { content_type: 'text', title: 'نعم', payload: `AKINATOR_${sessionId}_0` },
    { content_type: 'text', title: 'لا', payload: `AKINATOR_${sessionId}_1` },
    { content_type: 'text', title: 'لا أعلم', payload: `AKINATOR_${sessionId}_2` },
    { content_type: 'text', title: 'ربما', payload: `AKINATOR_${sessionId}_3` },
    { content_type: 'text', title: 'على الأرجح لا', payload: `AKINATOR_${sessionId}_4` }
  ];

  await sendMessage(senderId, { text: question, quick_replies: quickReplies }, pageAccessToken);
}

// معالجة الردود على الأسئلة
async function handleAkinatorAnswer(senderId, payload, pageAccessToken) {
  const parts = payload.split('_');
  if (parts.length !== 3 || parts[0] !== 'AKINATOR') return;

  const sessionId = parts[1];
  const choice = parts[2];

  try {
    const response = await axios.get(`https://tilmn-akinator-api.onrender.com/api/answer?choice=${choice}&session=${sessionId}`);
    
    if (response.data.endGame) {
      delete akinatorSessions[senderId];
      return sendMessage(senderId, { text: `أعتقد أن الشخصية هي: ${response.data.character}` }, pageAccessToken);
    }

    sendAkinatorQuestion(senderId, response.data.question, sessionId, pageAccessToken);

  } catch (error) {
    console.error('خطأ في إرسال الإجابة:', error.message);
    sendMessage(senderId, { text: 'حدث خطأ أثناء التفاعل مع أكيناتور. حاول مرة أخرى.' }, pageAccessToken);
  }
}

module.exports.handleAkinatorAnswer = handleAkinatorAnswer;
