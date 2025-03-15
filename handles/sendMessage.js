const axios = require('axios');
const path = require('path');

const sendMessage = async (senderId, { text = '', attachment = null, quick_replies = [] }, pageAccessToken) => {
  const url = `https://graph.facebook.com/v21.0/me/messages`;
  const params = { access_token: pageAccessToken };

  try {
    // تشغيل مؤشر الكتابة
    await axios.post(url, { 
      recipient: { id: senderId }, 
      sender_action: "typing_on" 
    }, { params });

    // بناء حمولة الرسالة
    const messagePayload = {
      recipient: { id: senderId },
      message: {}
    };

    if (text) messagePayload.message.text = text;
    if (attachment) messagePayload.message.attachment = attachment;
    if (quick_replies.length > 0) messagePayload.message.quick_replies = quick_replies;

    // إرسال الرسالة
    await axios.post(url, messagePayload, { params });

    // إيقاف مؤشر الكتابة
    await axios.post(url, { 
      recipient: { id: senderId }, 
      sender_action: "typing_off" 
    }, { params });

  } catch (e) {
    const errorMessage = e.response?.data?.error?.message || e.message;
    console.error(`SendMessage Error: ${errorMessage}`);
  }
};

module.exports = { sendMessage };
