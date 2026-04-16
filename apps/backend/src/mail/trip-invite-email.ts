/**
 * Trip invite HTML/text — layout aligned with `apps/web/email-templates/supabase-*.html`
 * (hosted PNG logos, table layout, coral CTA) for consistent inbox appearance.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface TripInviteEmailParams {
  /** Site origin, no trailing slash (e.g. https://gotrippin.app) — used for logo URLs. */
  appOrigin: string;
  joinUrl: string;
  tripTitle: string;
  inviterLabel: string;
}

export function buildTripInviteEmailSubject(params: TripInviteEmailParams): string {
  return `${params.inviterLabel} invited you to "${params.tripTitle}" on gotrippin`;
}

export function buildTripInviteEmailText(params: TripInviteEmailParams): string {
  const { inviterLabel, tripTitle, joinUrl } = params;
  return [
    `${inviterLabel} invited you to collaborate on a trip on gotrippin.`,
    '',
    `Trip: ${tripTitle}`,
    '',
    `Open this link while signed in to join:`,
    joinUrl,
    '',
    'If you do not have an account yet, create one first — after signing in, open the link again to join.',
    '',
    'If you were not expecting this invite, you can ignore this email.',
  ].join('\n');
}

/**
 * Full HTML document — structure matches Supabase auth emails (confirm / reset).
 */
export function buildTripInviteEmailHtml(params: TripInviteEmailParams): string {
  const { appOrigin, joinUrl, tripTitle, inviterLabel } = params;
  const eInviter = escapeHtml(inviterLabel);
  const eTitle = escapeHtml(tripTitle);
  const eJoin = escapeHtml(joinUrl);
  const logoFull = `${escapeHtml(appOrigin)}/logo_gotrippin.png`;
  const logoSm = `${escapeHtml(appOrigin)}/logo_gotrippin_sm.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Trip invite</title>
</head>
<body style="margin:0;padding:0;background-color:#ececf0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ececf0;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:440px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 14px rgba(23,19,26,0.07);">
          <tr>
            <td style="padding:18px 24px 16px;text-align:center;background-color:#17131a;">
              <img src="${logoFull}" width="132" height="34" alt="gotrippin" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;width:132px;max-width:132px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.5;color:#17131a;">
              <h1 style="margin:0 0 10px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#17131a;">You're invited to a trip</h1>
              <p style="margin:0 0 20px;color:#52525b;font-size:15px;line-height:1.55;"><strong style="color:#17131a;font-weight:600;">${eInviter}</strong> invited you to plan together on <strong style="color:#17131a;font-weight:600;">${eTitle}</strong> in gotrippin. Use the button below to join — you'll need to be signed in.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 22px;">
                <tr>
                  <td align="center" bgcolor="#ff7670" style="border-radius:9px;">
                    <a href="${eJoin}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9px;">Join this trip</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:12px;color:#71717a;line-height:1.45;">If the button does not work, copy this link into your browser:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;border-radius:8px;">
                <tr>
                  <td style="padding:10px 12px;font-family:Consolas,'Liberation Mono',Menlo,monospace;font-size:11px;line-height:1.45;color:#3f3f46;word-break:break-all;">${eJoin}</td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-size:12px;color:#71717a;line-height:1.5;">If you do not have an account yet, create one first — then open this link again to join.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 20px;background-color:#fafafa;border-top:1px solid #ececf0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;line-height:1.5;color:#71717a;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px 0 0;vertical-align:middle;">
                    <img src="${logoSm}" width="22" height="22" alt="" style="display:block;border:0;width:22px;height:auto;" />
                  </td>
                  <td style="vertical-align:middle;font-size:12px;color:#71717a;">Trip invite</td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:11px;color:#a1a1aa;line-height:1.45;">You are receiving this because a gotrippin member sent an invite to this email address.</p>
              <p style="margin:8px 0 0;font-size:11px;color:#a1a1aa;">© gotrippin</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
