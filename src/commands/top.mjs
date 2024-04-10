import axios from 'axios';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_PAT;
const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Points`;

export const topCommand = async (msg, bot, db) => {
  const chatId = msg.chat.id.toString();
  const chatType = msg.chat.type;
  let communityName = "Community";

  const pointsName = db.data.communities[chatId].settings.pointsName || "points"; // Fetching the dynamic points name

  if (chatType === 'group' || chatType === 'supergroup') {
    communityName = msg.chat.title;
  } else if (chatType === 'private') {
    communityName = msg.from.first_name;
  }

  // Constructing the Airtable API request
  const config = {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    params: {
      filterByFormula: `AND({Community ID} = '${chatId}', {Status} = 'Active')`,
      sort: [{field: "Points", direction: "desc"}]
    },
  };

  try {
    const response = await axios.get(airtableUrl, config);
    if (response.data.records.length === 0) {
      return bot.sendMessage(chatId, "This community has no leaderboard data.");
    }

    const leaderboard = response.data.records
      .map((record, index) => `${index + 1}. ${record.fields.Username || 'Anonymous'}: ${record.fields.Points} Points`)
      .join('\n');

    const leaderboardMessage = `${communityName}'s ${pointsName} Leaderboard\n` + leaderboard;
    bot.sendMessage(chatId, leaderboardMessage);
  } catch (error) {
    console.error('Error fetching leaderboard from Airtable:', error);
    bot.sendMessage(chatId, "Failed to fetch the leaderboard.");
  }
};
