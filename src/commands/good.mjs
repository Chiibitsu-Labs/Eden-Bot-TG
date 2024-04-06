// src/commands/good.mjs
export const goodCommand = (msg, bot, db) => {
  const chatId = msg.chat.id.toString();
  const usernameQuery = msg.text.match(/\/points(?:\s+@(\w+))?/);
  let targetUsername = usernameQuery && usernameQuery[1] ? usernameQuery[1] : msg.from.username;

  if (!db.data.communities[chatId]) {
    return bot.sendMessage(msg.chat.id, "This community has no data.");
  }

  const pointsName = db.data.communities[chatId].settings.pointsName || "points"; // Fetching the dynamic points name
  const user = db.data.communities[chatId].users.find(user => user.username === targetUsername);

  if (user) {
      bot.sendMessage(msg.chat.id, `${targetUsername}'s ${pointsName}: ${user.points}`);
  } else {
      bot.sendMessage(msg.chat.id, `${targetUsername} hasn't been added to the system yet.`);
  }
};
