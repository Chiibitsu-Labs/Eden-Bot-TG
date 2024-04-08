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
    txid: Date.now(), // Simple timestamp-based ID, consider a more robust ID system
    datetime: new Date().toISOString(),
    communityId: chatId,
    senderId: senderId,
    senderRole: senderRole,
    recipientId: user.id,
    amount: pointsAdjustment,
    note: note
  };
  community.transactions.push(transaction);

  await db.write();
  return { success: true, message: "Points adjusted successfully.", transaction };
};

// Function to delete user from the database and their points
export const deleteUser = async (username, db) => {
  const userIndex = db.data.users.findIndex(user => user.username === username);
  if (userIndex === -1) return false; // User not found

  db.data.users.splice(userIndex, 1); // Remove the user from the array
  await db.write(); // Save the database
  return true; // User was found and deleted
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
