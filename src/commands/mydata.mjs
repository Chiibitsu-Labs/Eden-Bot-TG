// src/commands/mydata.mjs
export const mydataCommand = (msg, bot, db) => {
  const chatId = msg.chat.id.toString();
  if (!db.data.communities[chatId]) {
    return bot.sendMessage(msg.chat.id, "This community has no data.");
  }

  const pointsName = db.data.communities[chatId].settings.pointsName || "points"; // Fetching the dynamic points name

  const user = db.data.communities[chatId].users.find(user => user.id === msg.from.id);
  if (user) {
      const userData = `Username: ${user.username || 'N/A'}\nRole: ${user.role}\n${pointsName}: ${user.points}`;
      bot.sendMessage(msg.chat.id, userData);
  } else {
      bot.sendMessage(msg.chat.id, "You're not registered.");
  }
};
