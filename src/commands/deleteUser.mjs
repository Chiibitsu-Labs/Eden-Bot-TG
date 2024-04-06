// src/commands/deleteUser.mjs
import { isOwner } from '../utils/roleChecks.mjs';
import { deleteUser } from '../utils/userOps.mjs';

export const deleteUserCommand = async (msg, bot, db) => {
    const userId = msg.from.id;
    const match = msg.text.match(/\/delete (@\w+)/);
    if (!match) return bot.sendMessage(msg.chat.id, "Invalid command format.");
    const username = match[1].replace('@', '');
    const chatId = msg.chat.id.toString(); // Community-specific identifier

    if (!isOwner(userId, db, chatId)) {
        return bot.sendMessage(msg.chat.id, "Only the owner can delete users from the leaderboard.");
    }

    const success = await deleteUser(username, db, chatId);
    if (success) {
        bot.sendMessage(msg.chat.id, `User ${username} has been deleted from the leaderboard.`);
    } else {
        bot.sendMessage(msg.chat.id, `User ${username} not found.`);
    }
};
