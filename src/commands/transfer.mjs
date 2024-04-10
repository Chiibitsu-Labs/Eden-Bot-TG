// src/commands/transfer.mjs
import { adjustUserPoints } from '../utils/userOps.mjs';
import { logTransactionToSheet } from '../utils/googleSheetsClient.mjs';
import { logTransactionToAirtable } from '../utils/airtableClient.mjs';

export const transferCommand = async (msg, bot, db) => {
    const chatId = msg.chat.id.toString();
    const [, username, pointsStr, note] = msg.text.match(/\/transfer (@\w+) (\d+)\s*(.*)/) || [];
    const senderId = msg.from.id;
    const sender = db.data.communities[chatId]?.users.find(user => user.id === senderId);
    const senderRole = sender ? sender.role : "undefined role";
    const points = parseInt(pointsStr, 10);
    const pointsName = db.data.communities[chatId]?.settings?.pointsName || "points";

    if (!username || isNaN(points) || points <= 0) {
        return bot.sendMessage(msg.chat.id, `Correct format: /transfer <@username> <# of ${pointsName}>, where <# of ${pointsName}> is a positive number.`);
    }

    if (!db.data.communities[chatId]) {
        return bot.sendMessage(msg.chat.id, "This community has no data.");
    }

    const fromUser = db.data.communities[chatId]?.users.find(user => user.id === msg.from.id);
    const toUser = db.data.communities[chatId]?.users.find(user => user.username === username.replace('@', ''));

    if (!fromUser || !toUser || fromUser.points < points) {
        return bot.sendMessage(msg.chat.id, `Transfer failed. Please check the users' registration status and balance.`);
    }

    try {
        const transactionFrom = await adjustUserPoints(fromUser.username, -points, db, chatId, senderId, senderRole, note);
        const transactionTo = await adjustUserPoints(toUser.username, points, db, chatId, senderId, senderRole, note);

        await Promise.all([
            logTransactionToSheet(transactionFrom),
            logTransactionToAirtable(transactionFrom),
            logTransactionToSheet(transactionTo),
            logTransactionToAirtable(transactionTo)
        ]);

        bot.sendMessage(msg.chat.id, `You've successfully transferred ${points} ${pointsName} to ${username}.`);
    } catch (error) {
        console.error("Failed to process transfer:", error);
        bot.sendMessage(msg.chat.id, "Failed to log transaction. Please contact support.");
    }
};
