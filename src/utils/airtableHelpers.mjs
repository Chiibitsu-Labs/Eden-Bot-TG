// utils/airtableHelpers.mjs
import axios from 'axios';

// Assuming these environment variables are set in your environment
const airtableBaseUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
const airtableApiKey = `Bearer ${process.env.AIRTABLE_PAT}`;

export async function checkUserExists(userId) {
  const config = {
    headers: { Authorization: airtableApiKey },
    params: {
      filterByFormula: `AND({User ID} = '${userId}', {Community ID} = '${communityId}')`,
    },
  };

  try {
    const response = await axios.get(`${airtableBaseUrl}/Users`, config);
    return response.data.records.length > 0;
  } catch (error) {
    console.error('Error checking user in Airtable:', error);
    return false; // Assume user doesn't exist if there's an error
  }
}

export async function addUserToAirtable(user) {
  const config = {
    headers: {
      Authorization: airtableApiKey,
      'Content-Type': 'application/json',
    },
  };

  const userData = {
    fields: {
      UserID: user.id.toString(),
      Username: user.username || 'No username',
      Role: 'user',
    },
  };

  try {
    const response = await axios.post(`${airtableBaseUrl}/Users`, userData, config);
    console.log('User added to Airtable:', response.data);
  } catch (error) {
    console.error('Error adding user to Airtable:', error);
  }
}

// Assuming you have a function to find the user by ID and update the status
export async function updateUserStatusInAirtable(userId, communityId, newStatus) {
  const userRecordId = await findUserRecordIdInAirtable(userId, communityId);
  if (userRecordId) {
    const config = {
      headers: {
        Authorization: airtableApiKey,
        'Content-Type': 'application/json',
      },
    };
  
    const updateData = {
      fields: {
        Status: newStatus,
      },
    };
  
    try {
      await axios.patch(`${airtableBaseUrl}/Points/${userRecordId}`, updateData, config);
      console.log(`User status updated to ${newStatus} in Airtable for record ID ${userRecordId}`);
    } catch (error) {
      console.error(`Error updating user status in Airtable: ${error}`);
    }
  } else {
    console.log(`Base URL: ${airtableBaseUrl}`);
    console.log(`API Key: ${airtableApiKey}`);
    console.error(`Could not find record ID for user ID ${userId} and community ID ${communityId}`);
  }
}

async function findUserRecordIdInAirtable(userId, communityId) {
  const config = {
    headers: { Authorization: airtableApiKey },
    params: {
      // Adjust the filter formula to check for both User ID and Community ID.
      filterByFormula: `AND({User ID} = '${userId}', {Community ID} = '${communityId}')`,
    },
  };

  try {
    const response = await axios.get(`${airtableBaseUrl}/Points`, config);
    const records = response.data.records;
    // Return the first record's ID that matches the criteria.
    return records.length > 0 ? records[0].id : null;
  } catch (error) {
    console.error(`Error updating user status in Airtable: ${error}`);
    console.error(error.response || error); // This will log the full error response
  }
      return null;
}