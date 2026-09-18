import { getDriveAccessToken } from './googleDriveService';

export const addEventToGoogleCalendar = async (
  summary: string,
  description: string,
  startDateTime: string, // ISO format e.g., "2026-09-14T10:00:00-07:00"
  endDateTime: string
) => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Google Calendar সংযুক্ত নেই। অনুগ্রহ করে অ্যাকাউন্ট কানেক্ট করুন।');
  }

  const event = {
    summary,
    description,
    start: {
      dateTime: startDateTime,
    },
    end: {
      dateTime: endDateTime,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Calendar API Error: ${errText}`);
  }

  const result = await response.json();
  return result;
};
