// src/commands/enroll.mjs
import { isOwnerOrAdmin, getRoleLevel, updateUserRole } from '../utils/roleChecks.mjs';

export const enrollCommand = async (msg, bot, db) => {
    const chatId = msg.chat.id.toString();
    // Ensure community initialization here, if not already done elsewhere
    if (!db.data.communities[chatId]) {
        db.data.communities[chatId] = { users: [], transactions: [], roles: db.data.globalRoles, settings: {} };
    }
    const community = db.data.communities[chatId];

    // Check if a username is specified in the command
    const match = msg.text.match(/\/enroll\s+@?(\w+)/i);
    let targetUsername;
    let targetUserId;

    if (match) {
        // If a username is provided, set it as the target username
        targetUsername = match[1];
        // Attempt to find the user by username
        const targetUser = community.users.find(user => user.username === targetUsername);
        if (targetUser) {
            targetUserId = targetUser.id; // If user exists, use their ID
        } else {
            // If the user does not exist, we need a method to resolve their ID (which may not be possible without their interaction due to Telegram's API limitations)
            return bot.sendMessage(msg.chat.id, "Cannot enroll user by username alone. The user needs to interact with the bot first.");
        }
    } else {
        // If no username is specified, default to the sender's information
        targetUserId = msg.from.id;
        targetUsername = msg.from.username || msg.from.first_name; // Use username or first name as a fallback
    }

    let targetUser = community.users.find(user => user.id === targetUserId);

    // Default role for enrollment
    const specifiedRole = 'member';

    // If the user is not found in the community database, add them as a new user with 'member' role
    if (!targetUser) {
        community.users.push({ id: targetUserId, username: targetUsername, points: 0, role: specifiedRole });
        await db.write();
        bot.sendMessage(msg.chat.id, `@${targetUsername} has been enrolled as ${specifiedRole}.`);
        return;
    }

    // Existing users: check and update role if necessary
    const currentRoleLevel = getRoleLevel(targetUser.role, db, chatId);
    const newRoleLevel = getRoleLevel(specifiedRole, db, chatId);

    if (currentRoleLevel < newRoleLevel) {
        await updateUserRole(targetUsername, specifiedRole, db, chatId);
        bot.sendMessage(msg.chat.id, `@${targetUsername}, your role has been upgraded to ${specifiedRole}.`);
    } else {
        // If the user already has 'member' role or higher, inform them without changing their role
        bot.sendMessage(msg.chat.id, `@${targetUsername}, you are already enrolled with a role of ${targetUser.role}. No changes were made.`);
    }
};