// userOps.mjs

// Function to adjust user points
export const adjustUserPoints = async (username, pointsAdjustment, db, chatId, senderId, senderRole, note) => {
  const community = db.data.communities[chatId];
  if (!community) return { success: false, message: "Community not found." };

  const user = community.users.find(user => user.username === username);
  if (!user) return { success: false, message: "User not found." };


  // Adjust points
  user.points += pointsAdjustment;

  // Log the transaction
  const transaction = {
    txid: Date.now().toString(), // Simple timestamp-based ID, consider a more robust ID system
    datetime: new Date().toISOString().split('.')[0]+"Z", // Remove milliseconds
    communityId: chatId,
    senderId: senderId.toString(),
    senderRole: senderRole,
    recipientId: user.id.toString(),
    amount: pointsAdjustment,
    note: note
  };
  // Right before logging the transaction
  console.log(`Note: ${note}, Sender Role: ${senderRole}`);

  community.transactions.push(transaction);

  await db.write();
  return { success: true, message: "Points adjusted successfully.", transaction };
};

// Function to delete user from the database and their points
// src/utils/userOps.mjs

// Updated deleteUser function to match your db structure
export const deleteUser = async (userId, db, chatId) => {
  const community = db.data.communities[chatId];
  if (!community || !community.users) return { success: false, message: "Community or users not found." };

  const userIndex = community.users.findIndex(user => user.id === userId);
  if (userIndex === -1) return { success: false, message: "User not found." };

  // Perform deletion
  community.users.splice(userIndex, 1);

  await db.write();
  return { success: true, message: "User deleted successfully." };
};

// Update user role
export async function updateUserRole(username, newRole, db) {
  const user = db.data.users.find(u => u.username === username);
  if (!user) {
    return { success: false, message: "User not found" };
  }

  // Here, you should include any necessary validation logic or assume it's done before calling this function

  user.role = newRole;
  await db.write();
  return { success: true, message: `User ${username}'s role updated to ${newRole}.` };
}

// Adjust user status in the local database
export const updateUserStatusLocal = (userId, db, chatId, newStatus) => {
  // Convert userId to string to ensure consistent comparison
  const userIdString = userId.toString();
  // Find the user in the community by their ID
  const user = db.data.communities[chatId].users.find(u => u.id.toString() === userIdString);
  if (user) {
    user.Status = newStatus; // Update status in the local database
    db.write(); // Make sure to persist changes
    return true;
  }
  return false; // User not found
};

