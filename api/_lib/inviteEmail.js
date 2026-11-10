import { BRAND_MARK_PNG } from './brandMark.js';

/** Box Theory brand colours — the same values as the @theme tokens in src/index.css. */
const COLOR = {
  umber: '#4a3831',
  umberMuted: '#cbbcae',
  gold: '#b99a60',
  goldInk: '#86682f',
  goldSoft: '#f6f0e4',
  goldLine: '#e3d3b0',
  canvas: '#f6f4f1',
  line: '#e8e2da',
  ink: '#2b211d',
  muted: '#6e625b',
  faint: '#a2958b',
};

const SANS = "'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const DISPLAY = "'Saira', 'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const LOGO_CID = 'box-theory-mark';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/**
 * The Box Theory team invitation as { subject, html, text, attachments } for nodemailer.
 * The logo travels as an inline (CID) image, so it shows without loading anything remote.
 */
export function buildInviteEmail({ name, email, title, inviterName, inviteUrl }) {
  const firstName = name.split(/\s+/)[0] || name;
  const subject = inviterName ? `${inviterName} invited you to join Box Theory` : 'You’re invited to join Box Theory';
  const intro = inviterName ? `${inviterName} has added you to the Box Theory team` : 'You’ve been added to the Box Theory team';
  const preheader = `Accept your invitation and sign in with Google using ${email}.`;

  const safe = {
    firstName: escapeHtml(firstName),
    email: escapeHtml(email),
    url: escapeHtml(inviteUrl),
    intro: escapeHtml(intro),
    who: escapeHtml(inviterName || 'an admin'),
  };
  const asTitle = title ? ` as <strong style="color:${COLOR.ink};font-weight:700;">${escapeHtml(title)}</strong>` : '';
  const strong = (text) => `<strong style="color:${COLOR.ink};font-weight:700;">${text}</strong>`;
  const steps = [
    `Click ${strong('Accept invitation')}.`,
    `Choose ${strong('Continue with Google')}.`,
    `Pick ${strong(safe.email)} when Google asks.`,
  ];

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700&family=Saira:wght@600;700&display=swap');
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
  @media (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .headline { font-size: 26px !important; line-height: 32px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COLOR.canvas};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}${'&#847;&zwnj;&nbsp;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.canvas};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
        <tr>
          <td class="px" style="background-color:${COLOR.umber};border-radius:16px 16px 0 0;padding:26px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;padding-right:14px;">
                  <img src="cid:${LOGO_CID}" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border:0;outline:none;">
                </td>
                <td style="vertical-align:middle;">
                  <div style="font-family:${DISPLAY};font-size:22px;line-height:24px;font-weight:700;color:#ffffff;">Box Theory</div>
                  <div style="padding-top:3px;font-family:${SANS};font-size:12px;line-height:16px;font-weight:500;color:${COLOR.umberMuted};">Packaging Intelligence</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="px" style="background-color:#ffffff;padding:40px 40px 6px;">
            <div style="font-family:${SANS};font-size:12px;line-height:16px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${COLOR.goldInk};">Team invitation</div>
            <h1 class="headline" style="margin:10px 0 0;font-family:${DISPLAY};font-size:30px;line-height:36px;font-weight:700;color:${COLOR.ink};">You’re invited to Box&nbsp;Theory</h1>
            <p style="margin:20px 0 0;font-family:${SANS};font-size:16px;line-height:26px;color:${COLOR.ink};">Hi ${safe.firstName},</p>
            <p style="margin:8px 0 0;font-family:${SANS};font-size:16px;line-height:26px;color:${COLOR.ink};">${safe.intro}${asTitle}. Box Theory is where the team runs every packaging job — clients, jobs, team and vendors, from enquiry to delivery.</p>
            <p style="margin:10px 0 0;font-family:${SANS};font-size:16px;line-height:26px;color:${COLOR.ink};">You’ll have <strong style="font-weight:700;">full access</strong>, so you can invite people and manage the team too.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;background-color:${COLOR.goldSoft};border:1px solid ${COLOR.goldLine};border-radius:12px;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="font-family:${SANS};font-size:12px;line-height:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${COLOR.goldInk};">Sign in with Google as</div>
                  <div style="padding-top:4px;font-family:${SANS};font-size:17px;line-height:24px;font-weight:700;word-break:break-all;"><a href="mailto:${safe.email}" style="color:${COLOR.ink};text-decoration:none;">${safe.email}</a></div>
                </td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
              <tr>
                <td align="center" bgcolor="${COLOR.gold}" style="border-radius:10px;background-color:${COLOR.gold};">
                  <a href="${safe.url}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${SANS};font-size:16px;line-height:20px;font-weight:700;color:${COLOR.ink};text-decoration:none;border-radius:10px;">Accept invitation</a>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;">
              ${steps
                .map(
                  (step, index) => `<tr>
                <td style="width:24px;vertical-align:top;padding:0 0 12px;">
                  <div style="width:22px;height:22px;border-radius:11px;background-color:${COLOR.umber};font-family:${SANS};font-size:12px;line-height:22px;font-weight:700;color:#ffffff;text-align:center;">${index + 1}</div>
                </td>
                <td style="vertical-align:top;padding:2px 0 12px 10px;font-family:${SANS};font-size:14px;line-height:20px;color:${COLOR.muted};">${step}</td>
              </tr>`,
                )
                .join('\n              ')}
            </table>
          </td>
        </tr>
        <tr>
          <td class="px" style="background-color:#ffffff;border-radius:0 0 16px 16px;padding:16px 40px 34px;">
            <div style="border-top:1px solid ${COLOR.line};padding-top:20px;font-family:${SANS};font-size:13px;line-height:20px;color:${COLOR.muted};">
              Button not working? Paste this link into your browser:<br>
              <a href="${safe.url}" target="_blank" style="color:${COLOR.goldInk};word-break:break-all;">${safe.url}</a>
            </div>
          </td>
        </tr>
        <tr>
          <td class="px" style="padding:24px 40px 6px;text-align:center;font-family:${SANS};font-size:12px;line-height:18px;color:${COLOR.muted};">
            This invitation was sent to ${safe.email} because ${safe.who} added you to Box&nbsp;Theory.<br>
            Not expecting it? You can safely ignore this email.
          </td>
        </tr>
        <tr>
          <td style="padding:6px 40px 0;text-align:center;font-family:${DISPLAY};font-size:12px;line-height:18px;font-weight:600;letter-spacing:0.5px;color:${COLOR.faint};">Box Theory · Packaging Intelligence</td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    `Hi ${firstName},`,
    '',
    `${intro}${title ? ` as ${title}` : ''}.`,
    'Box Theory is where the team runs every packaging job — clients, jobs, team and vendors, from enquiry to delivery.',
    "You'll have full access, so you can invite people and manage the team too.",
    '',
    'Accept your invitation:',
    inviteUrl,
    '',
    `Choose "Continue with Google" and sign in as ${email} — other Google accounts won't get in.`,
    '',
    'Not expecting this? You can safely ignore this email.',
    '',
    'Box Theory · Packaging Intelligence',
  ].join('\n');

  return {
    subject,
    html,
    text,
    attachments: [{ filename: 'box-theory.png', content: Buffer.from(BRAND_MARK_PNG, 'base64'), contentType: 'image/png', cid: LOGO_CID }],
  };
}
