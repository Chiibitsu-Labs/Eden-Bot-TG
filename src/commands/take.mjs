// src/commands/take.mjs
import { adjustUserPoints } from '../utils/userOps.mjs';
import { isOwnerOrAdmin } from '../utils/roleChecks.mjs';

export const takeCommand = async (msg, bot, db) => {
    const chatId = msg.chat.id.toString(); // Community-specific identifier
    const [, username, pointsStr] = msg.text.match(/\/take (@\w+) (\d+)/) || [];
    const points = -parseInt(pointsStr, 10); // Making points negative for subtraction
    const pointsName = db.data.communities[chatId].settings.pointsName || "points"; // Fetching the dynamic points name

    // Ensuring command format is correct and points are valid
    if (!username || isNaN(points) || points >= 0) {
        return bot.sendMessage(msg.chat.id, `Correct format: /take <@username> <# of ${pointsName}>, where ${pointsName} is a positive number.`);
    }

    // Ensure the community data exists
    if (!db.data.communities[chatId]) {
        return bot.sendMessage(msg.chat.id, "This community has no data.");
    }

    // Checking if the user issuing the command is authorized to do so
    if (!isOwnerOrAdmin(msg.from.id, db, chatId)) {
        return bot.sendMessage(msg.chat.id, "You're not authorized to use this command.");
    }

    // Attempting to take points and handling the outcome
    const success = await adjustUserPoints(username.replace('@', ''), points, db, chatId);
    if (success.success) {
        bot.sendMessage(msg.chat.id, `Successfully took ${Math.abs(points)} ${pointsName} from ${username}.`);
    } else {
        bot.sendMessage(msg.chat.id, `Failed to take ${pointsName} from ${username}. ${success.message || "User not found (or not yet enrolled)."}`);
    }
};
