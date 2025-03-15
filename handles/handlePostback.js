const { sendMessage } = require('./sendMessage');
const { handleResponse } = require('../commands/akinator');

const handlePostback = async (event, pageAccessToken) => {
  const senderId = event?.sender?.id;
  if (!senderId) return console.error('Invalid postback event object');

  const payload = event.postback?.payload || event.message?.quick_reply?.payload;
  if (!payload) return console.error('Missing payload in postback event');

  try {
    // التعامل مع ردود Akinator
    const akinatorChoices = {
      "akinator_yes": 0,
      "akinator_no": 1,
      "akinator_dont_know": 2,
      "akinator_maybe": 3,
      "akinator_probably_not": 4
    };

    if (payload.startsWith("akinator_")) {
      return await handleResponse(senderId, akinatorChoices[payload], pageAccessToken);
    }

    // رد افتراضي في حال كان الـ payload غير مدعوم
    await sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` }, pageAccessToken);
  } catch (err) {
    console.error('Error handling postback:', err.message || err);
  }
};

module.exports = { handlePostback };
