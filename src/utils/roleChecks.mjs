// src/utils/roleChecks.mjs

// This function checks if a user is an admin or owner within a specific community.
export const isOwnerOrAdmin = (userId, db, chatId) => {
  const user = db.data.communities[chatId]?.users.find(user => user.id === userId);
  if (!user) return false; // User not found in this community
  
  // Assuming 'owner' and 'admin' roles have been correctly set in your community or global settings
  return ['owner', 'admin'].includes(user.role);
};


export const getRoleLevel = (roleName, db, chatId) => {
  // Check for community-specific roles first
  const communityRoles = db.data.communities[chatId]?.roles;
  let role = communityRoles?.find(role => role.name === roleName);
  
  // If no community-specific role found, fall back to global roles
  if (!role) {
    role = db.data.globalRoles?.find(role => role.name === roleName);
  }

  return role ? role.level : null;
};

// Adjusted for community context
export const updateUserRole = async (username, newRole, db, chatId) => {
  const user = db.data.communities[chatId]?.users.find(u => u.username === username);
  if (!user) {
    return { success: false, message: "User not found" };
  }
  user.role = newRole;
  await db.write();
  return { success: true, message: `User ${username}'s role updated to ${newRole}.` };
};

// Check owner role
export const isOwner = (userId, db) => {
  const user = db.data.users.find(user => user.id === userId);
  return user && user.role === 'owner';
};