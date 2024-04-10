// src/commands/deleteUser.mjs
import { isOwner } from '../utils/roleChecks.mjs';
import { updateUserStatusLocal } from '../utils/userOps.mjs';
import { updateUserStatusInAirtable } from '../utils/airtableHelpers.mjs';

export const deleteUserCommand = async (msg, bot, db) => { // Removed communityId from parameters
  const chatId = msg.chat.id.toString();
  const args = msg.text.split(' ');
  const usernameToDelete = args[1];

  if (!usernameToDelete) {
    return bot.sendMessage(chatId, "You must specify a username. Format: /deleteuser @username");
  }

  const userToDelete = db.data.communities[chatId]?.users.find(u => `@${u.username}` === usernameToDelete);
  const userIdToDelete = userToDelete ? userToDelete.id : null;

  if (!userIdToDelete) {
    return bot.sendMessage(chatId, `User ${usernameToDelete} not found.`);
  }

  // Ensure the requester is the owner
  if (!isOwner(msg.from.id, db, chatId)) {
    return bot.sendMessage(chatId, "Only the community owner can delete users.");
  }

  // Update status in local database
  if (!updateUserStatusLocal(userIdToDelete, db, chatId, "Removed")) {
    return bot.sendMessage(chatId, `User ${userIdToDelete} not found in local database.`);
  }

  // Assuming chatId is equivalent to communityId here; adjust as needed
  const communityId = chatId; // This is the corrected line

  // Update status in Airtable
  await updateUserStatusInAirtable(userIdToDelete, communityId, "Removed");
  
  // Send a confirmation message
  bot.sendMessage(chatId, `User ${usernameToDelete} has been set to 'Removed'.`);
};
