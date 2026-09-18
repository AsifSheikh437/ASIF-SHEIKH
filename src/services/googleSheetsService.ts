import { getDriveAccessToken } from './googleDriveService';

const SHEETS_ID_STORAGE_KEY = 'food_erp_sheets_analytics_id';

export const getOrCreateAnalyticsSheet = async (accessToken: string, companyName: string): Promise<string> => {
  const cachedSheetId = localStorage.getItem(SHEETS_ID_STORAGE_KEY);
  if (cachedSheetId) {
    try {
      const verifyRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cachedSheetId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (verifyRes.ok) {
        return cachedSheetId;
      }
    } catch (e) {
      // Ignore and recreate if not found
    }
  }

  // Create new spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `${companyName} - Financial Analytics [ERP]`,
      },
      sheets: [
        { properties: { title: 'Live Dashboard' } },
        { properties: { title: 'Monthly Ledger' } }
      ]
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${errText}`);
  }

  const data = await createRes.json();
  const spreadsheetId = data.spreadsheetId;
  localStorage.setItem(SHEETS_ID_STORAGE_KEY, spreadsheetId);
  return spreadsheetId;
};

export const pushFinancialDataToSheet = async (
  companyName: string,
  dashboardData: any[][],
  ledgerData: any[][]
): Promise<{ success: boolean; spreadsheetId: string; url: string }> => {
  const accessToken = await getDriveAccessToken();
  if (!accessToken) {
    throw new Error('Google Workspace is not connected. Please connect from settings.');
  }

  const spreadsheetId = await getOrCreateAnalyticsSheet(accessToken, companyName);

  // Update Live Dashboard Sheet
  const updateDashboard = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Live Dashboard!A1:Z1000?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Live Dashboard!A1',
        majorDimension: 'ROWS',
        values: dashboardData,
      }),
    }
  );

  if (!updateDashboard.ok) throw new Error('Failed to update Live Dashboard sheet.');

  // Update Monthly Ledger Sheet
  const updateLedger = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Monthly Ledger!A1:Z1000?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Monthly Ledger!A1',
        majorDimension: 'ROWS',
        values: ledgerData,
      }),
    }
  );

  if (!updateLedger.ok) throw new Error('Failed to update Monthly Ledger sheet.');

  return {
    success: true,
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
};

export const exportToGoogleSheets = async (
  title: string,
  headers: string[],
  rows: any[][]
): Promise<string> => {
  const accessToken = await getDriveAccessToken();
  if (!accessToken) {
    throw new Error('Google Workspace is not connected. Please connect from settings.');
  }

  // Create new spreadsheet for the export
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${errText}`);
  }

  const data = await createRes.json();
  const spreadsheetId = data.spreadsheetId;

  // Insert data
  const values = [headers, ...rows];
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z1000?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Sheet1!A1',
        majorDimension: 'ROWS',
        values: values,
      }),
    }
  );

  if (!updateRes.ok) {
    throw new Error('Failed to update Google Sheet data.');
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
};
