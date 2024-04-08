// src/commands/give.mjs

import { isOwnerOrAdmin } from '../utils/roleChecks.mjs';
import { adjustUserPoints } from '../utils/userOps.mjs';
import { logTransactionToSheet } from '../utils/googleSheetsClient.mjs'; // Import the logging function

export const giveCommand = async (msg, bot, db) => {
    const chatId = msg.chat.id.toString();
    const senderId = msg.from.id;
    const sender = db.data.communities[chatId]?.users.find(user => user.id === senderId);
    const senderRole = sender ? sender.role : "undefined role";  // Default to "undefined role" if not found
    const [, username, pointsStr, note] = msg.text.match(/\/give (@\w+) (\d+)\s*(.*)/) || [];
    const points = parseInt(pointsStr, 10);
    const pointsName = db.data.communities[chatId]?.settings?.pointsName || "points";

    if (!username || isNaN(points) || points <= 0) {
        return bot.sendMessage(msg.chat.id, `Correct format: /give @username amount [note], where amount is a positive number of ${pointsName}.`);
    }

    if (!db.data.communities[chatId]) {
        return bot.sendMessage(msg.chat.id, "This community has no data.");
    }

    if (!isOwnerOrAdmin(msg.from.id, db, chatId)) {
        return bot.sendMessage(msg.chat.id, "You're not authorized to use this command.");
    }


    
    const result = await adjustUserPoints(username.replace('@', ''), points, db, chatId, senderId, note);
    if (result.success) {
        console.log(`Preparing to log transaction: ${JSON.stringify(result.transaction)}, Sender Role: ${senderRole}`);
        try {
            await logTransactionToSheet({...result.transaction, senderRole: senderRole, note: note}, db); // Ensure logTransactionToSheet is updated to accept transaction object and db instance
            bot.sendMessage(msg.chat.id, `Successfully gave ${points} ${pointsName} to ${username}. ${note ? 'Note: ' + note : ''}`);
        } catch (error) {
            console.error("Failed to log transaction to Google Sheets:", error);
            // Optionally notify the user or take additional action
        }
    } else {
        bot.sendMessage(msg.chat.id, result.message || "Failed to give points. User not found.");
    }
};