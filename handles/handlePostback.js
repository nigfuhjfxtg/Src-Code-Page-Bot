const { sendMessage } = require('./sendMessage');          // في نفس المجلد handles
const { handleResponse } = require('../commands/akinator'); // صعود مجلد ثم الدخول لـ commands

const handlePostback = async (event, pageAccessToken) => {
  const { id: senderId } = event.sender || {};
  // في حال كانت Quick Reply تُرسل في event.message، نلتقط الـ payload من هناك أيضاً:
  const payload = event.postback?.payload || event.message?.quick_reply?.payload;

  if (!senderId || !payload) {
    return console.error('Invalid postback event or missing payload.');
  }

  try {
    // هنا نتحقق هل الـ payload يخص أكيناتور
    const akinatorChoices = {
      "akinator_yes": 0,
      "akinator_no": 1,
      "akinator_dont_know": 2,
      "akinator_maybe": 3,
      "akinator_probably_not": 4
    };

    // إذا كان يبدأ بـ "akinator_" نمرره إلى handleResponse في ملف akinator.js
    if (payload.startsWith('akinator_')) {
      if (akinatorChoices.hasOwnProperty(payload)) {
        // استدعاء دالة معالجة رد أكيناتور
        return await handleResponse(senderId, akinatorChoices[payload], pageAccessToken);
      } else {
        // في حال كان الـ payload غير معروف
        return await sendMessage(senderId, {
          text: `Unknown Akinator payload: ${payload}`
        }, pageAccessToken);
      }
    }

    // إذا لم يكن له علاقة بأكيناتور، أرسل الرد الافتراضي
    await sendMessage(senderId, {
      text: `You sent a postback with payload: ${payload}`
    }, pageAccessToken);

  } catch (err) {
    console.error('Error handling postback:', err.message || err);
    await sendMessage(senderId, {
      text: 'Error handling your postback.'
    }, pageAccessToken);
  }
};

module.exports = { handlePostback };
