// commands/setpointsname.mjs
import { isOwnerOrAdmin } from '../utils/roleChecks.mjs';

export const setPointsNameCommand = async (msg, bot, db) => {
  const chatId = msg.chat.id.toString();
  // Ensure community exists in the database
  if (!db.data.communities[chatId]) {
    return bot.sendMessage(msg.chat.id, "Community not found.");
  }

  if (!isOwnerOrAdmin(msg.from.id, db, chatId)) {
    return bot.sendMessage(msg.chat.id, "You're not authorized to perform this action.");
  }

  const [, newPointsName] = msg.text.match(/\/setpointsname (.+)/) || [];
  db.data.communities[chatId].settings.pointsName = newPointsName;
  await db.write();
  bot.sendMessage(msg.chat.id, `Points name updated to ${newPointsName} for this community.`);
};
