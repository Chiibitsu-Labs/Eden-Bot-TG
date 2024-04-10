// src/utils/airtableClient.mjs
import axios from 'axios';

const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID; // check .env
const AIRTABLE_PAT = process.env.AIRTABLE_PAT; // check .env

// Function to initialize Axios for Airtable API calls
const airtableAxios = axios.create({
  baseURL: `${AIRTABLE_BASE_URL}/${AIRTABLE_BASE_ID}`,
  headers: {
    'Authorization': `Bearer ${AIRTABLE_PAT}`,
    'Content-Type': 'application/json'
  }
});

// Function to log transaction to Airtable
export const logTransactionToAirtable = async (transaction) => {
  try {
    const response = await airtableAxios.post('/Transactions', { // 'Transactions' as actual table name
      fields: {
        'TXID': transaction.txid,
        'Datetime': transaction.datetime,
        'Community ID': transaction.communityId,
        'Sender ID': transaction.senderId,
        'Sender Role': transaction.senderRole,
        'Recipient ID': transaction.recipientId,
        'Amount': transaction.amount,
        'Note': transaction.note
      }
    });
    console.log('Transaction logged to Airtable:', response.data);
  } catch (error) {
    console.error('Error logging transaction to Airtable:', error);
    console.error('Airtable Error Message:', error.response.data);
  }
}
