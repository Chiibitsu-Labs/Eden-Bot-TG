// commands/role.mjs
import { isOwnerOrAdmin, updateUserRole, getRoleLevel } from '../utils/roleChecks.mjs';

export const roleCommand = async (msg, bot, db) => {
  const chatId = msg.chat.id.toString();
  const match = msg.text.match(/\/role(?:\s+@(\w+))?(?:\s+(\w+))?/);
  const targetUsername = match && match[1] ? match[1] : (msg.from.username || msg.from.first_name);
  const newRole = match && match[2];

  // Ensure community data is available
  if (!db.data.communities[chatId]) {
    return bot.sendMessage(msg.chat.id, "This community has no data.");
  }

  const communityData = db.data.communities[chatId];
  const fromUser = communityData.users.find(user => user.id === msg.from.id);
  const targetUser = communityData.users.find(user => user.username === targetUsername);

  if (!newRole) {
    // Display current role of the user
    if (targetUser) {
      bot.sendMessage(msg.chat.id, `${targetUsername}'s role: ${targetUser.role}`);
    } else {
      bot.sendMessage(msg.chat.id, "User not found.");
    }
  } else {
    // Check permission and update role
    if (isOwnerOrAdmin(msg.from.id, db, chatId)) {
      if (targetUser) {
        // Prevent non-owners from assigning 'owner' role
        if (getRoleLevel(newRole, db, chatId) > getRoleLevel(fromUser.role, db, chatId)) {
          return bot.sendMessage(msg.chat.id, "You cannot assign roles higher than your own.");
        }

        // Apply the role update
        await updateUserRole(targetUsername, newRole, db, chatId);
        bot.sendMessage(msg.chat.id, `${targetUsername}'s role updated to ${newRole}.`);
      } else {
        bot.sendMessage(msg.chat.id, "User not found.");
      }
    } else {
      bot.sendMessage(msg.chat.id, "You don't have permission to change roles.");
    }
  }
};
