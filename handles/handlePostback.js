const { sendMessage } = require('./sendMessage');
const { handleAkinatorResponse } = require('../commands/akinator');

const handlePostback = async (event, pageAccessToken) => {
  const senderId = event?.sender?.id;
  // التقاط الـ payload سواء من postback أو quick_reply
  const payload = event.postback?.payload || event.message?.quick_reply?.payload;

  if (!senderId || !payload) {
    console.error('Invalid postback event or missing payload.');
    return;
  }

  try {
    // إذا كان الـ payload يبدأ بـ "AKINATOR", نمرره مباشرةً لمعالجة رد أكيناتور
    if (payload.startsWith("AKINATOR")) {
      await handleAkinatorResponse(senderId, payload, pageAccessToken);
      return;
    }

    // في حال payload غير مرتبط بأكيناتور، إرسال رد افتراضي:
    await sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` }, pageAccessToken);
  } catch (err) {
    console.error('Error handling postback:', err.message || err);
    await sendMessage(senderId, { text: 'Error handling your postback.' }, pageAccessToken);
  }
};

module.exports = { handlePostback };
