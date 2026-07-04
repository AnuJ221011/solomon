import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../shared/utils/logger.js';

const BASE = () => `https://graph.facebook.com/${env.WHATSAPP_GRAPH_VERSION}`;
const authHeader = () => ({ Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` });

async function callMeta(method, path, data) {
  if (env.WHATSAPP_USE_MOCK) {
    logger.info('[WhatsApp MOCK]', { method, path, body: JSON.stringify(data).slice(0, 200) });
    return { messages: [{ id: `mock-${Date.now()}` }] };
  }
  const res = await axios({ method, url: `${BASE()}${path}`, headers: authHeader(), data });
  return res.data;
}

export const sendText = (to, body) =>
  callMeta('POST', `/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  });

export const sendTemplate = (to, templateName, languageCode = 'en', components = []) =>
  callMeta('POST', `/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: { name: templateName, language: { code: languageCode }, components },
  });

export async function downloadMediaBuffer(mediaId) {
  if (env.WHATSAPP_USE_MOCK) return null;
  const { url } = await callMeta('GET', `/${mediaId}`);
  const resp = await axios.get(url, {
    headers: authHeader(),
    responseType: 'arraybuffer',
  });
  return Buffer.from(resp.data);
}
