// src/commands/transfer.mjs
import { adjustUserPoints } from '../utils/userOps.mjs';
import { isOwnerOrAdmin } from '../utils/roleChecks.mjs';

export const transferCommand = async (msg, bot, db) => {
    const chatId = msg.chat.id.toString(); // Community-specific identifier
    const [, username, pointsStr] = msg.text.match(/\/transfer (@\w+) (\d+)/) || [];
    const points = parseInt(pointsStr, 10);
    const pointsName = db.data.communities[chatId].settings.pointsName || "points"; // Fetching the dynamic points name

    if (!username || isNaN(points)) {
        return bot.sendMessage(msg.chat.id, `Correct format: /transfer <@username> <# of ${pointsName}>`);
    }

    // Ensure community exists in the db
    if (!db.data.communities[chatId]) {
        return bot.sendMessage(msg.chat.id, "This community has no data.");
    }

    const fromUser = db.data.communities[chatId].users.find(user => user.id === msg.from.id);
    const toUser = db.data.communities[chatId].users.find(user => user.username === username.replace('@', ''));

    if (!fromUser) {
        return bot.sendMessage(msg.chat.id, "You're not registered in this community.");
    }
    if (!toUser) {
        return bot.sendMessage(msg.chat.id, `User ${username} not found in this community.`);
    }
    if (fromUser.points < points) {
        return bot.sendMessage(msg.chat.id, `You do not have enough ${pointsName}.`);
    }

    // Adjust points for both users
    fromUser.points -= points;
    toUser.points += points;
    await db.write();

    bot.sendMessage(msg.chat.id, `You've successfully transferred ${points} ${pointsName} to ${username}.`);
};
