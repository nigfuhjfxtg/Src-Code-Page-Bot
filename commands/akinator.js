const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const akinatorSessions = {};

module.exports = {
  name: 'akinator',
  description: 'لعب لعبة أكيناتور باستخدام Quick Replies',
  usage: 'akinator',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    try {
      // إذا لم تبدأ جلسة بعد
      if (!akinatorSessions[senderId]) {
        const response = await axios.get('https://tilmn-akinator-api.onrender.com/api/start?lang=ar');
        
        // تأكد من شكل البيانات المستلمة:
        console.log(response.data); 
        // مثال متوقع: { sessionId: "...", question: "...", progress: 0, ... }

        const { sessionId, question, progress } = response.data;
        if (!sessionId) {
          return sendMessage(senderId, { text: 'حدث خطأ أثناء بدء اللعبة.' }, pageAccessToken);
        }

        // حفظ معرّف الجلسة
        akinatorSessions[senderId] = sessionId;

        // إرسال السؤال الأول
        return sendAkinatorQuestion(senderId, question, progress, sessionId, pageAccessToken);
      }

      // إذا كانت اللعبة بدأت مسبقًا
      sendMessage(senderId, {
        text: 'أنت تلعب بالفعل! أجب على السؤال أو أرسل "إعادة" لبدء لعبة جديدة.'
      }, pageAccessToken);

    } catch (error) {
      console.error('خطأ في بدء أكيناتور:', error.message);
      sendMessage(senderId, { text: 'حدث خطأ أثناء بدء اللعبة. حاول مرة أخرى لاحقًا.' }, pageAccessToken);
    }
  }
};

// دالة لإرسال السؤال باستخدام Quick Replies
async function sendAkinatorQuestion(senderId, question, progress, sessionId, pageAccessToken) {
  const textMessage = `🧞‍♂️ | ${question}\n\n📊 التقدم: ${progress}%`;
  const quickReplies = [
    { content_type: 'text', title: 'نعم ✅', payload: `AKINATOR_${sessionId}_0` },
    { content_type: 'text', title: 'لا ❌', payload: `AKINATOR_${sessionId}_1` },
    { content_type: 'text', title: 'لا أعلم 🤔', payload: `AKINATOR_${sessionId}_2` },
    { content_type: 'text', title: 'ربما 🤷', payload: `AKINATOR_${sessionId}_3` },
    { content_type: 'text', title: 'على الأرجح لا 🚫', payload: `AKINATOR_${sessionId}_4` },
    { content_type: 'text', title: 'إنهاء اللعبة 🔚', payload: `AKINATOR_END` }
  ];

  await sendMessage(senderId, {
    text: textMessage,
    quick_replies: quickReplies
  }, pageAccessToken);
}

// دالة لمعالجة إجابات المستخدم
async function handleAkinatorAnswer(senderId, payload, pageAccessToken) {
  // إذا اختار المستخدم إنهاء اللعبة
  if (payload === 'AKINATOR_END') {
    delete akinatorSessions[senderId];
    return sendMessage(senderId, { text: 'تم إنهاء اللعبة.' }, pageAccessToken);
  }

  const parts = payload.split('_');
  // مثال على الـpayload: "AKINATOR_abc123_0"
  // parts[0] = "AKINATOR", parts[1] = sessionId, parts[2] = choice
  if (parts.length !== 3 || parts[0] !== 'AKINATOR') return;

  const sessionId = parts[1];
  const choice = parts[2];

  try {
    const response = await axios.get(`https://tilmn-akinator-api.onrender.com/api/answer?choice=${choice}&session=${sessionId}`);
    console.log(response.data);

    // إذا انتهت اللعبة
    if (response.data.endGame) {
      delete akinatorSessions[senderId];
      return sendMessage(senderId, { text: `🤖 أعتقد أن الشخصية هي: ${response.data.character}` }, pageAccessToken);
    }

    // استمر في طرح الأسئلة
    const { question, progress } = response.data;
    await sendAkinatorQuestion(senderId, question, progress, sessionId, pageAccessToken);

  } catch (error) {
    console.error('خطأ في إرسال الإجابة:', error.message);
    sendMessage(senderId, { text: 'حدث خطأ أثناء التفاعل مع أكيناتور. حاول مرة أخرى.' }, pageAccessToken);
  }
}

module.exports.handleAkinatorAnswer = handleAkinatorAnswer;
