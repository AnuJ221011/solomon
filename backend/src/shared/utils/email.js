import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from './logger.js';

const resend = new Resend(env.RESEND_API_KEY);

export const send = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    logger.error('Email send failed', { to, subject, error: err.message });
    throw err;
  }
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const sendOtpEmail = (to, otp) =>
  send({
    to,
    subject: 'Your Solomon Bharat verification code',
    html: `
      <p>Your verification code is:</p>
      <h2 style="letter-spacing:4px;font-size:32px">${otp}</h2>
      <p>This code expires in ${env.OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.</p>
    `,
  });

export const sendWelcomeEmail = (to, name) =>
  send({
    to,
    subject: 'Welcome to Solomon Bharat',
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Your account is ready. Start exploring Indian wholesale brands at solomonbharat.com.</p>
      <p>Browse thousands of unique Indian artisan products and place your first wholesale order today.</p>
    `,
  });

export const sendBrandApprovalEmail = (to, brandName) =>
  send({
    to,
    subject: 'Your brand has been approved on Solomon Bharat',
    html: `
      <h1>Congratulations, ${brandName}!</h1>
      <p>Your brand application has been approved. You can now publish your listings and start receiving international wholesale orders.</p>
      <p>Log in to your dashboard to complete your profile and add products.</p>
    `,
  });

export const sendAchievementEmail = (to, brandName, levelName) =>
  send({
    to,
    subject: `🎉 ${brandName} has reached ${levelName} on Solomon Bharat!`,
    html: `
      <h1>${brandName} is now ${levelName}!</h1>
      <p>You've unlocked new platform benefits. Log in to your dashboard to see what's new and share your achievement.</p>
    `,
  });

// ── Orders ───────────────────────────────────────────────────────────────────

export const sendOrderConfirmationBuyer = (to, { buyerName, orderIds, brandName, totalBuyerCurrency, currency }) =>
  send({
    to,
    subject: `Your Solomon Bharat order is confirmed`,
    html: `
      <h1>Order confirmed, ${buyerName}!</h1>
      <p>Your order from <strong>${brandName}</strong> has been confirmed.</p>
      <p><strong>Total:</strong> ${currency} ${totalBuyerCurrency}</p>
      <p>Order ID(s): ${orderIds.join(', ')}</p>
      <p>The brand will prepare and dispatch your order within the stated lead time. You'll receive a tracking notification once it ships.</p>
    `,
  });

export const sendOrderConfirmationBrand = (to, { brandName, orderId, buyerBusinessName, itemCount, totalInr }) =>
  send({
    to,
    subject: `New wholesale order received — ${buyerBusinessName}`,
    html: `
      <h1>New order for ${brandName}!</h1>
      <p><strong>${buyerBusinessName}</strong> has placed a wholesale order.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Items:</strong> ${itemCount}</p>
      <p><strong>Order value:</strong> ₹${totalInr}</p>
      <p>Log in to your dashboard to review and confirm the order.</p>
    `,
  });

export const sendDispatchNotificationBuyer = (to, { buyerName, brandName, orderId, trackingNumber, trackingCarrier, estimatedDelivery }) =>
  send({
    to,
    subject: `Your order from ${brandName} has been dispatched`,
    html: `
      <h1>Your order is on its way, ${buyerName}!</h1>
      <p><strong>${brandName}</strong> has dispatched your order.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      ${trackingNumber ? `<p><strong>Tracking number:</strong> ${trackingNumber}</p>` : ''}
      ${trackingCarrier ? `<p><strong>Carrier:</strong> ${trackingCarrier}</p>` : ''}
      ${estimatedDelivery ? `<p><strong>Estimated delivery:</strong> ${estimatedDelivery}</p>` : ''}
    `,
  });

// ── Returns ───────────────────────────────────────────────────────────────────

export const sendReturnRequestedEmail = (to, { brandName, orderId, reason }) =>
  send({
    to,
    subject: `Return requested for order ${orderId}`,
    html: `
      <h1>Return request received</h1>
      <p>A return has been requested for order <strong>${orderId}</strong> from <strong>${brandName}</strong>.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Our team will review and respond within 2 business days.</p>
    `,
  });

export const sendReturnStatusEmail = (to, { buyerName, orderId, status, adminNotes }) =>
  send({
    to,
    subject: `Return update for order ${orderId} — ${status}`,
    html: `
      <h1>Return status update, ${buyerName}</h1>
      <p>Your return for order <strong>${orderId}</strong> has been updated to <strong>${status}</strong>.</p>
      ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ''}
    `,
  });

// ── Referrals ─────────────────────────────────────────────────────────────────

export const sendReferralRewardEmail = (to, { buyerName, brandName, creditAmountInr }) =>
  send({
    to,
    subject: `You've earned ₹${creditAmountInr} store credit!`,
    html: `
      <h1>Referral reward, ${buyerName}!</h1>
      <p><strong>${brandName}</strong> — a brand you referred — has completed their first sale.</p>
      <p>We've added <strong>₹${creditAmountInr}</strong> store credit to your wallet. It will be applied automatically on your next order.</p>
    `,
  });

// ── Marketing ─────────────────────────────────────────────────────────────────

export const sendWeeklyDigest = (to, { buyerName, products }) => {
  const productRows = products.map((p) =>
    `<li><a href="https://solomonbharat.com/products/${p.slug}">${p.name}</a> by ${p.brandName} — ₹${p.wholesalePriceInr}</li>`
  ).join('');

  return send({
    to,
    subject: `New arrivals on Solomon Bharat this week`,
    html: `
      <h1>Hi ${buyerName}, here's what's new this week</h1>
      <p>Curated picks based on your preferences:</p>
      <ul>${productRows}</ul>
      <p><a href="https://solomonbharat.com">Browse all products →</a></p>
    `,
  });
};
