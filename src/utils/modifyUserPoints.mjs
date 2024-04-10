// src/utils/modifyUserPoints.mjs
import { isOwnerOrAdmin } from './roleChecks.mjs'; // Ensure correct path
import { adjustUserPoints } from './userOps.mjs'; // Ensure correct path
import { logTransactionToSheet } from './googleSheetsClient.mjs'; // Ensure correct path
import { logTransactionToAirtable } from './airtableClient.mjs'; // Ensure correct path

export const modifyUserPoints = async (msg, bot, db, amount, note, isGiving = true) => {
    const chatId = msg.chat.id.toString();
    const username = msg.text.split(' ')[1]; // Assuming the username is always the first argument
    const senderId = msg.from.id;
    const sender = db.data.communities[chatId]?.users.find(user => user.id === senderId);
    const senderRole = sender ? sender.role : "undefined role"; // Fetch the sender's role
    const pointsName = db.data.communities[chatId]?.settings?.pointsName || "points";
    const transactionType = isGiving ? 'give' : 'take';
    const points = isGiving ? parseInt(amount, 10) : -parseInt(amount, 10);

    if (!username || isNaN(points) || (isGiving && points <= 0) || (!isGiving && points >= 0)) {
        return bot.sendMessage(msg.chat.id, `Correct format: /${transactionType} <@username> <# of ${pointsName}>, where <# of ${pointsName}> is a positive number.`);
    }

    if (!db.data.communities[chatId]) {
        return bot.sendMessage(msg.chat.id, "This community has no data.");
    }

    if (!await isOwnerOrAdmin(msg.from.id, db, chatId)) { // Assuming isOwnerOrAdmin returns a Promise
        return bot.sendMessage(msg.chat.id, "You're not authorized to use this command.");
    }

    const result = await adjustUserPoints(username.replace('@', ''), points, db, chatId, senderId, senderRole, note);
    if (result.success) {
        console.log(`Preparing to log transaction: ${JSON.stringify(result.transaction)}`);
        bot.sendMessage(msg.chat.id, `Successfully ${isGiving ? 'gave' : 'took'} ${Math.abs(points)} ${pointsName} ${isGiving ? 'to' : 'from'} ${username}. ${note ? 'Note: ' + note : ''}`);

        try {
            await logTransactionToSheet(result.transaction, db);
            await logTransactionToAirtable(result.transaction);
        } catch (error) {
            console.error("Failed to log transaction:", error);
        }
    } else {
        bot.sendMessage(msg.chat.id, result.message || "Operation failed. User not found or other error.");
    }
};
