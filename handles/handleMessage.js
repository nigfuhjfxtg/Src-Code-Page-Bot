const axios = require('axios');
const path = require('path');

const axiosPost = (url, data, params = {}) =>
  axios.post(url, data, { params }).then(res => res.data);

const sendMessage = async (senderId, { text = '', attachment = null, quickReplies = [] }, pageAccessToken) => {
  if (!text && !attachment) return;

  const url = `https://graph.facebook.com/v21.0/me/messages`;
  const params = { access_token: pageAccessToken };

  try {
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_on" }, params);

    const messagePayload = {
      recipient: { id: senderId },
      message: {}
    };

    if (text) {
      messagePayload.message.text = text;
    }

    if (quickReplies.length > 0) {
      messagePayload.message.quick_replies = quickReplies.map(reply => ({
        content_type: "text",
        title: reply.title,
        payload: reply.payload
      }));
    }

    if (attachment) {
      messagePayload.message.attachment = attachment;
    }

    await axiosPost(url, messagePayload, params);
    await axiosPost(url, { recipient: { id: senderId }, sender_action: "typing_off" }, params);
  } catch (e) {
    const errorMessage = e.response?.data?.error?.message || e.message;
    console.error(`Error in ${path.basename(__filename)}: ${errorMessage}`);
  }
};

module.exports = { sendMessage };
