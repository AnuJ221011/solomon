import crypto from 'crypto';
import { env } from '../../config/env.js';
import { handleInboundMessage } from './conversation.service.js';
import { createBroadcast, listBroadcasts, getBroadcastDetail, getContacts } from './broadcast.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { createError } from '../../shared/utils/createError.js';
import { logger } from '../../shared/utils/logger.js';

// GET /api/whatsapp/webhook — Meta verification handshake
export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verified by Meta');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
};

// POST /api/whatsapp/webhook — inbound messages from Meta
export const receiveWebhook = async (req, res) => {
  // Must respond 200 immediately — Meta retries on non-2xx
  res.sendStatus(200);

  try {
    // Verify HMAC signature when app secret is configured
    if (env.WHATSAPP_APP_SECRET && req.rawBody) {
      const sig = req.headers['x-hub-signature-256'] ?? '';
      const expected = `sha256=${crypto
        .createHmac('sha256', env.WHATSAPP_APP_SECRET)
        .update(req.rawBody)
        .digest('hex')}`;
      if (sig !== expected) {
        logger.warn('WhatsApp webhook: signature mismatch — ignoring payload');
        return;
      }
    }

    const body = req.body;
    if (body?.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;
        for (const message of change.value?.messages ?? []) {
          // Handle each message async — we've already returned 200
          handleInboundMessage(message.from, message).catch((err) =>
            logger.error('Inbound message handling failed', { from: message.from, err: err.message })
          );
        }
      }
    }
  } catch (err) {
    logger.error('Webhook processing error', { err: err.message });
  }
};

// POST /api/whatsapp/broadcast
export const startBroadcast = async (req, res) => {
  const { name, templateName, languageCode, components, recipientGroup, phones } = req.body;
  if (!name || !templateName) throw createError('name and templateName are required', 400);
  if (!recipientGroup && !phones?.length) throw createError('recipientGroup or phones[] required', 400);
  const result = await createBroadcast({ name, templateName, languageCode, components, recipientGroup, phones });
  sendSuccess(res, result, 'Broadcast started', 202);
};

// GET /api/whatsapp/contacts?type=brands|buyers
export const getContactList = async (req, res) => {
  const { type } = req.query;
  if (!['brands', 'buyers'].includes(type)) throw createError('type must be brands or buyers', 400);
  sendSuccess(res, await getContacts(type));
};

// GET /api/whatsapp/broadcasts
export const getBroadcasts = async (req, res) => {
  sendSuccess(res, await listBroadcasts());
};

// GET /api/whatsapp/broadcasts/:id
export const getBroadcast = async (req, res) => {
  const broadcast = await getBroadcastDetail(req.params.id);
  if (!broadcast) throw createError('Broadcast not found', 404);
  sendSuccess(res, broadcast);
};
