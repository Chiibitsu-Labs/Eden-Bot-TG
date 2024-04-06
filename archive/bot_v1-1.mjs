// Import statements
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { JSONFilePreset } from 'lowdb/node';

// Setup Telegram Bot
const token = process.env.TG_BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

// Initialize LowDB with JSONFilePreset
async function initDb() {
    const defaultData = { users: [], transactions: [], roles: [], usernames: [] };
    const db = await JSONFilePreset('db.json', defaultData);

    // Define and Initialize roles without duplication
    const roles = [
        { name: 'owner', level: 10 },
        { name: 'admin', level: 5 },
        { name: 'leader', level: 4 },
        { name: 'advocate', level: 3 },
        { name: 'member', level: 2 },
        { name: 'user', level: 1 },
    ];

    // Check and add roles if they don't exist
    roles.forEach((role) => {
        if (!db.data.roles.some(r => r.name === role.name)) {
            db.data.roles.push(role);
        }
    });

    await db.write();
    return db;
}

const db = await initDb();

function getUserRole(userId) {
    const user = db.data.users.find(user => user.id === userId);
    return user ? user.role : null;
}

function getRoleLevel(roleName) {
    const role = db.data.roles.find(role => role.name === roleName);
    return role ? role.level : 0;
}

// isUser
function isUser(userId) {
  const user = db.data.users.find(user => user.id === userId);
  return user && user.role === 'user';
}

// isMember
function isMember(userId) {
  const user = db.data.users.find(user => user.id === userId);
  return user && user.role === 'member';
}

// isAdvocate
function isAdvocate(userId) {
  const user = db.data.users.find(user => user.id === userId);
  return user && user.role === 'advocate';
}

// isLeader
function isLeader(userId) {
  const user = db.data.users.find(user => user.id === userId);
  return user && user.role === 'leader';
}

// isAdmin
function isAdmin(userId) {
  const user = db.data.users.find(user => user.id === userId);
  return user && user.role === 'admin';
}

// isOwner
function isOwner(userId) {
const user = db.data.users.find(user => user.id === userId);
return user && user.role === 'owner';
}

// Start Command: This command can greet users and tell them about the bot's functionalities.
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const userExists = db.data.users.find(user => user.id === userId);
  if (!userExists) {
      // User is not in the database, add them
      const newUser = { id: userId, points: 0, role: 'user', username: msg.from.username || 'N/A' };
      db.data.users.push(newUser);
      await db.write();
      bot.sendMessage(msg.chat.id, "You've been added as a new user. Use /enroll to join the community rewards program!");
  } else {
      // User already exists, update their username if missing
      if (!userExists.username && msg.from.username) {
          userExists.username = msg.from.username;
          await db.write();
      }
      bot.sendMessage(msg.chat.id, "Hello! I'm Eden, your friendly neighborhood $GOOD bot! With me, you can earn and manage $GOOD points with positive community contributions. Use /help to see all commands.");
  }
});


// Help Command: This command should list all available commands and their descriptions.
bot.onText(/\/help/, (msg) => {
  const helpText = `
  Here are the commands you can use:
  /start - Start interacting with the bot
  /good - Check your $GOOD points balance
  /give @username points - Admins can give points to users (e.g., /give @username 100)
  /take @username points - Admins can take points from users (e.g., /take @username 50)
  /transfer @username points - Transfer some or all of your points to another member (e.g., /transfer @username 50)
  /top - View the leaderboard
  /role - Check your role
  /mydata - Check your user data
  /enroll - Upgrade your role from user to member
  /help - Display this help message

  More features coming soon!
  `;
  bot.sendMessage(msg.chat.id, helpText);
});

// Enroll Command to Upgrade Role of a User
bot.onText(/\/enroll (@\w+)(?: (\w+))?/, async (msg, match) => {
  const fromId = msg.from.id;
  const fromUser = db.data.users.find(user => user.id === fromId);
  
  // Check if the user is authorized to enroll users
  if (!fromUser || (fromUser.role !== 'owner' && fromUser.role !== 'admin')) {
    bot.sendMessage(msg.chat.id, "You're not authorized to enroll users.");
    return;
  }

  const toUsername = match[1].replace('@', ''); // Remove "@" from the username
  const role = match[2] || 'member'; // Default role is 'member' if not specified

  // Find the user by username
  let toUser = db.data.users.find(user => user.username === toUsername);

  // Add the user if not found
  if (!toUser) {
    toUser = { username: toUsername, points: 0, role };
    db.data.users.push(toUser);
    await db.write();
    bot.sendMessage(msg.chat.id, `User ${toUsername} has been enrolled as ${role}.`);
  } else {
    // Update the role if the user already exists
    toUser.role = role;
    await db.write();
    bot.sendMessage(msg.chat.id, `Role of user ${toUsername} has been updated to ${role}.`);
  }
});

// Combining isAdmin and isOwner checks for simplicity
function isAdminOrOwner(userId) {
  const userRole = getUserRole(userId);
  const roleLevel = getRoleLevel(userRole);
  // Assuming 'admin' role is correctly set up in your roles array
  // and using direct comparison for simplicity
  return roleLevel >= getRoleLevel('admin'); // True for admins and owners
}

// The /give Command for Admins and Owners
bot.onText(/\/give (@\w+) (\d+)/, async (msg, match) => {
  const fromId = msg.from.id;
  const fromUser = db.data.users.find(user => user.id === fromId);
  const toUsername = match[1].replace('@', ''); // Remove "@" from the username
  const points = parseInt(match[2], 10);

  // Check if the user is authorized and validate inputs
  if (!fromUser || !(fromUser.role === 'admin' || fromUser.role === 'owner') || isNaN(points) || points <= 0) {
    bot.sendMessage(msg.chat.id, "You're not authorized to give points or invalid points value.");
    return;
  }

  // Find the recipient user by username
  const toUser = db.data.users.find(user => user.username === toUsername);
  if (!toUser) {
    bot.sendMessage(msg.chat.id, `User with username ${toUsername} not found.`);
    return;
  }

  // Update the recipient user's points
  toUser.points += points;
  await db.write();

  bot.sendMessage(msg.chat.id, `Successfully gave ${points} GOOD points to ${toUsername}.`);
});

// The /take Command for Admins and Owners
bot.onText(/\/take (@\w+) (\d+)/, async (msg, match) => {
  const fromId = msg.from.id;
  const fromUser = db.data.users.find(user => user.id === fromId);
  const toUsername = match[1].replace('@', ''); // Remove "@" from the username
  const points = parseInt(match[2], 10);

  // Check if the user is authorized and validate inputs
  if (!fromUser || !(fromUser.role === 'admin' || fromUser.role === 'owner') || isNaN(points) || points <= 0) {
    bot.sendMessage(msg.chat.id, "You're not authorized to take points or invalid points value.");
    return;
  }

  // Find the target user by username
  const toUser = db.data.users.find(user => user.username === toUsername);
  if (!toUser) {
    bot.sendMessage(msg.chat.id, `User with username ${toUsername} not found.`);
    return;
  }

  // Check if there are enough points to take
  if (toUser.points < points) {
    bot.sendMessage(msg.chat.id, `User ${toUsername} does not have enough points to take.`);
    return;
  }

  // Update the target user's points
  toUser.points -= points;
  await db.write();

  bot.sendMessage(msg.chat.id, `Successfully took ${points} GOOD points from ${toUsername}.`);
});

// The /transfer Command for Points Transfer Among Users
bot.onText(/\/transfer (@\w+) (\d+)/, async (msg, match) => {
  const fromId = msg.from.id;
  const fromUser = db.data.users.find(user => user.id === fromId);
  const toUsername = match[1].replace('@', ''); // Remove "@" from the username
  const points = parseInt(match[2], 10);

  if (isNaN(points) || points <= 0) {
      bot.sendMessage(msg.chat.id, "Please specify a valid number of points to transfer.");
      return;
  }

  // Ensure database is up-to-date before operation
  await db.read();

  // Find the sender and recipient users
  const fromUsername = fromUser.username;
  const toUser = db.data.users.find(user => user.username === toUsername);
  if (!toUser) {
      bot.sendMessage(msg.chat.id, `User with username ${toUsername} not found.`);
      return;
  }

  // Validate sender has enough points and is eligible to transfer
  if (!fromUser || fromUser.role === 'user' || fromUser.points < points) {
      bot.sendMessage(msg.chat.id, "You do not have enough points to transfer or are not authorized to transfer points.");
      return;
  }

  // Deduct points from sender
  fromUser.points -= points;

  // Add points to receiver
  toUser.points += points;

  // Persist changes
  await db.write();

  bot.sendMessage(msg.chat.id, `You've successfully transferred ${points} GOOD points to ${toUsername}.`);
});

// Check Role Command
bot.onText(/\/role (@\w+)/, (msg, match) => {
  const fromId = msg.from.id;
  const fromUser = db.data.users.find(user => user.id === fromId);
  const toUsername = match[1].replace('@', ''); // Remove "@" from the username

  // Find the user by username
  const toUser = db.data.users.find(user => user.username === toUsername);

  if (toUser) {
      bot.sendMessage(msg.chat.id, `Role of ${toUsername}: ${toUser.role}`);
  } else {
      bot.sendMessage(msg.chat.id, `User ${toUsername} not found.`);
  }
});

// Check Good Points Command
bot.onText(/\/good/, (msg) => {
  const userId = msg.from.id;
  const user = db.data.users.find(user => user.id === userId);
  if (user) {
      bot.sendMessage(msg.chat.id, `Your $GOOD points: ${user.points}`);
  } else {
      bot.sendMessage(msg.chat.id, "You haven't been added to the system yet.");
  }
});

// Leaderboard Command
bot.onText(/\/top/, (msg) => {
  const chatTitle = msg.chat.title || "Community"; // Default to "Community" if group title is not available
  const leaderboard = db.data.users.sort((a, b) => b.points - a.points);
  let leaderboardText = `${chatTitle}'s $GOOD Leaderboard:\n`;
  leaderboard.forEach((user, index) => {
      leaderboardText += `${index + 1}. ${user.username ? `@${user.username}` : `User ${user.id}`}: ${user.points} points\n`;
  });
  bot.sendMessage(msg.chat.id, leaderboardText);
});

// Command to check user data
bot.onText(/\/mydata/, async (msg) => {
  const userId = msg.from.id;
  const user = db.data.users.find(user => user.id === userId);

  if (user) {
      const userData = `
          User ID: ${user.id}
          Username: ${user.username || 'N/A'}
          Role: ${user.role}
          Points: ${user.points}
      `;
      bot.sendMessage(msg.chat.id, userData);
  } else {
      bot.sendMessage(msg.chat.id, "You haven't been added to the system yet.");
  }
});

// Remove Command to Delete a User
bot.onText(/\/remove (@\w+)/, async (msg, match) => {
  const fromId = msg.from.id;
  const fromUser = db.data.users.find(user => user.id === fromId);
  
  // Check if the user is authorized to remove users
  if (!fromUser || (fromUser.role !== 'owner' && fromUser.role !== 'admin')) {
    bot.sendMessage(msg.chat.id, "You're not authorized to remove users.");
    return;
  }

  const username = match[1].replace('@', ''); // Remove "@" from the username

  // Find the user by username
  const index = db.data.users.findIndex(user => user.username === username);

  // Remove the user if found
  if (index !== -1) {
    db.data.users.splice(index, 1);
    await db.write();
    bot.sendMessage(msg.chat.id, `User ${username} has been removed from the database.`);
  } else {
    bot.sendMessage(msg.chat.id, `User ${username} not found in the database.`);
  }
});

//MAKE MYSELF OWNER
// Assume your user ID is stored in a variable called `myUserId`

// Find your user object in the database
//const myUser = db.data.users.find(user => user.id === 559098686);

// Update your role to "owner"
//if (myUser) {
//    myUser.role = 'owner';
//    await db.write();
//    console.log("Your role has been updated to 'owner'.");
//} else {
//    console.log("User not found in the database.");
//}
