// commands/top.mjs
export const topCommand = (msg, bot, db) => {
  const chatId = msg.chat.id.toString();
  const chatType = msg.chat.type;
  let communityName = "Community";

  // Check if it's a group or supergroup and use the title, otherwise use the user's first name for private chats
  if (chatType === 'group' || chatType === 'supergroup') {
      communityName = msg.chat.title;
  } else if (chatType === 'private') {
      communityName = msg.from.first_name;
  }

  if (!db.data.communities[chatId]) {
      return bot.sendMessage(msg.chat.id, "This community has no leaderboard data.");
  }

  const pointsName = db.data.communities[chatId].pointsName || "Points"; // Fallback to "Points" if not set

  const leaderboard = db.data.communities[chatId].users
      .sort((a, b) => b.points - a.points)
      .map((user, index) => `${index + 1}. ${user.username || 'Anonymous'}: ${user.points} ${pointsName}`)
      .join('\n');

  const leaderboardMessage = `${communityName}'s ${pointsName} Leaderboard\n` + leaderboard;
  bot.sendMessage(msg.chat.id, leaderboardMessage || "Leaderboard is empty.");
};
