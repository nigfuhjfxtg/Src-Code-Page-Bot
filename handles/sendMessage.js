const axios = require('axios');
const path = require('path');

// دالة مساعدة لإجراء طلبات POST
const axiosPost = (url, data, params = {}) =>
  axios.post(url, data, { params }).then(res => res.data);

const sendMessage = async (senderId, { text = '', attachment = null }, pageAccessToken) => {
  if (!text && !attachment) return;

  const url = `https://graph.facebook.com/v21.0/me/messages`;
  const params = { access_token: pageAccessToken };

  try {
    // تشغيل مؤشر الكتابة
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_on" }, params);

    // إعداد حمولة الرسالة بناءً على المحتوى
    const messagePayload = {
      recipient: { id: senderId },
      message: {}
    };

    if (text) {
      messagePayload.message.text = text;
    }

    if (attachment) {
      // التحقق مما إذا كان المرفق من نوع template
      if (attachment.type === 'template') {
        // استخدام المرفق كما هو دون تعديل
        messagePayload.message.attachment = attachment;
      } else if (attachment.payload && attachment.payload.url) {
        // التعامل مع المرفقات التي تحتوي على رابط
        messagePayload.message.attachment = {
          type: attachment.type,
          payload: {
            url: attachment.payload.url,
            is_reusable: true
          }
        };
      } else {
        // في حالة عدم توفر مفتاح payload.url، نضيف المرفق كما هو
        messagePayload.message.attachment = attachment;
      }
    }

    // إرسال الرسالة
    await axiosPost(url, messagePayload, params);

    // إيقاف مؤشر الكتابة
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_off" }, params);

  } catch (e) {
    // استخراج رسالة الخطأ بشكل مختصر
    const errorMessage = e.response?.data?.error?.message || e.message;
    console.error(`Error in ${path.basename(__filename)}: ${errorMessage}`);
  }
};

module.exports = { sendMessage };
