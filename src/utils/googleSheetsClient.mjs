// src/utils/googleSheetsClient.mjs
import { google } from 'googleapis';

/**
 * Initializes and returns the Google Sheets API client.
 */
export async function getGoogleSheetsClient() {
    try {
        // Parse the credentials from the environment variable
        const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
        const { client_email, private_key } = credentials;

        // Create a JWT client with the credentials
        const client = new google.auth.JWT(
            client_email,
            null,
            private_key.replace(/\\n/g, '\n'), // Ensure line breaks are correctly formatted
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        // Authenticate the client
        await client.authorize();

        // Initialize and return the Google Sheets API client
        const sheets = google.sheets({ version: 'v4', auth: client });
        return sheets;
    } catch (error) {
        console.error('Failed to initialize Google Sheets API client:', error);
        throw error;
    }
}

/**
 * Logs a transaction to a Google Sheet, creating headers if necessary.
 */
 export async function logTransactionToSheet(transaction) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.SPREADSHEET_ID;  // Use environment variable for the spreadsheet ID
  
  let sheetName = `Community_${transaction.communityId}`;
  
  try {
    // Check if the sheet exists
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(title))',
    });

    const sheetTitles = sheetMetadata.data.sheets.map(sheet => sheet.properties.title);
    if (!sheetTitles.includes(sheetName)) {
      // Create the sheet with headers if it doesn't exist
      await createSheetWithHeaders(sheets, spreadsheetId, sheetName);
    }

    // Append the transaction data
    await appendTransactionData(sheets, spreadsheetId, sheetName, transaction);

    console.log('Transaction logged successfully.');
  } catch (error) {
    console.error('Failed to log transaction to Google Sheet:', error);
  }
}

/**
 * Creates a new sheet and adds a header row.
 */
async function createSheetWithHeaders(sheets, spreadsheetId, sheetName) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [{
        addSheet: {
          properties: {
            title: sheetName,
          },
        },
      }],
    },
  });

  // Define headers
  const headers = [
    ['Transaction ID', 'Date and Time', 'Community ID', 'Sender ID', 'Sender Role', 'Recipient ID', 'Amount', 'Note'],
  ];

  // Insert headers
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: headers,
    },
  });

  console.log(`New sheet created and headers added for community ID ${sheetName}.`);
}

/**
 * Appends transaction data to the sheet.
 */
async function appendTransactionData(sheets, spreadsheetId, sheetName, transaction) {
  const values = [[
    transaction.txid,
    transaction.datetime,
    transaction.communityId,
    transaction.senderId,
    transaction.senderRole,
    transaction.recipientId,
    transaction.amount,
    transaction.note,
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:H`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values,
    },
    insertDataOption: 'INSERT_ROWS',
  });
}
