import { escapeHtml } from './request.js';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'myTrip';
const PROBLEM_REPORT_EMAIL = process.env.PROBLEM_REPORT_EMAIL || BREVO_SENDER_EMAIL;
const BREVO_SENDER = { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME };
const BREVO_REPLY_TO_EMAILS = (process.env.BREVO_REPLY_TO_EMAIL || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
const BREVO_REPLY_TO_LIST = BREVO_REPLY_TO_EMAILS.map((email) => ({ email }));

function buildEmailPayload(payload) {
    if (!BREVO_REPLY_TO_LIST.length) {
        return payload;
    }

    const replyPayload = {
        ...payload,
        replyTo: BREVO_REPLY_TO_LIST[0],
    };

    if (BREVO_REPLY_TO_LIST.length > 1) {
        replyPayload.replyToList = BREVO_REPLY_TO_LIST;
    }

    return replyPayload;
}

async function sendBrevoEmail(payload) {
    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
        console.error('Brevo email not sent: missing BREVO_API_KEY or BREVO_SENDER_EMAIL');
        return;
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': BREVO_API_KEY,
            },
            body: JSON.stringify(buildEmailPayload(payload)),
        });

        const text = await response.text();
        if (!response.ok) {
            console.error('Brevo error', response.status, text);
        }
    } catch (error) {
        console.error('Email send failed', error);
    }
}

export async function sendInvitationEmail(email, signupUrl, name, tripName, role) {
    return sendBrevoEmail({
        sender: BREVO_SENDER,
        to: [{ email, name }],
        subject: `Invitation to ${tripName || 'myTrip'}`,
        htmlContent: `
          <p>Hello${name ? ` ${escapeHtml(name)}` : ''},</p>
          <p>You have been invited to join the trip <strong>${escapeHtml(tripName || 'myTrip')}</strong> as a <strong>${escapeHtml(role)}</strong> on myTrip.</p>
          <p>Please sign up using the link below. This invitation will expire in 7 days.</p>
          <p><a href="${signupUrl}">${signupUrl}</a></p>
          <p>Best regards,<br/>myTrip Team</p>
        `,
    });
}

export async function sendProblemReportEmail(name, fromEmail, message) {
    if (!PROBLEM_REPORT_EMAIL) {
        console.error('Problem report email not sent: missing PROBLEM_REPORT_EMAIL or BREVO_SENDER_EMAIL');
        return;
    }

    return sendBrevoEmail({
        sender: BREVO_SENDER,
        to: [{ email: PROBLEM_REPORT_EMAIL }],
        subject: 'myTrip problem report',
        htmlContent: `
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(fromEmail)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
        `,
    });
}

export async function sendPasswordResetEmail(email, resetUrl) {
    return sendBrevoEmail({
        sender: BREVO_SENDER,
        to: [{ email }],
        subject: 'myTrip password reset',
        htmlContent: `<p>To reset your password, click <a href="${resetUrl}">here</a>.</p>`,
    });
}

export async function sendMessageEmail(toUser, content) {
    if (!toUser?.email) {
        return;
    }

    return sendBrevoEmail({
        sender: BREVO_SENDER,
        to: [{ email: toUser.email }],
        subject: 'New trip message',
        htmlContent: `<p>You have a new message regarding your trip:</p><p>${escapeHtml(content).replace(/\n/g, '<br/>')}</p>`,
    });
}
