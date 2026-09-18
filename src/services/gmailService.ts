import { getAccessToken } from './googleDriveService';

export const sendEmailViaGmail = async (
  to: string,
  subject: string,
  bodyText: string
): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error('Google Workspace is not connected. Please connect from Settings.');

  // Create RFC 2822 email format base64 encoded
  const emailLines = [];
  emailLines.push(`To: ${to}`);
  emailLines.push('Content-Type: text/html; charset=utf-8');
  emailLines.push('MIME-Version: 1.0');
  emailLines.push(`Subject: ${subject}`);
  emailLines.push('');
  emailLines.push(bodyText);

  const email = emailLines.join('\r\n');
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64EncodedEmail,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    console.error('Gmail error:', errorData);
    throw new Error('ইমেইল পাঠাতে সমস্যা হয়েছে।');
  }
};
