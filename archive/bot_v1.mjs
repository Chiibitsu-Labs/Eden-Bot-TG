// Import statements
import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { JSONFilePreset } from 'lowdb/node';

// Setup Telegram Bot
const token = process.env.TG_BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

// Initialize LowDB with JSONFilePreset
async function initDb() {
    const defaultData = { users: [], transactions: [], roles: [] };
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
      db.data.users.push({ id: userId, points: 0, role: 'user' });
      await db.write();
      bot.sendMessage(msg.chat.id, "You've been added as a new user. Use /enroll to join the community rewards program!");
  } else {
      bot.sendMessage(msg.chat.id, "Hello! I'm Eden, your friendly neighborhood $GOOD bot! With me, you can earn and manage $GOOD points with positive community contributions. Use /help to see all commands.");
  }
});

// Help Command: This command should list all available commands and their descriptions.
bot.onText(/\/help/, (msg) => {
  const helpText = `
  Here are the commands you can use:
  /start - Start interacting with the bot
  /good - Check your GOOD points balance
  /give - Admins can give points to users
  /take - Admins can take points from users
  /top - View the leaderboard
  /help - Display this help message
  
  More features coming soon!
  `;
  bot.sendMessage(msg.chat.id, helpText);
});

// Enroll Command to Upgrade Role from user to member
bot.onText(/\/enroll/, async (msg) => {
  const userId = msg.from.id;
  let user = db.data.users.find(user => user.id === userId);
  if (!user) {
    user = { id: userId, points: 0, role: 'member' };
    db.data.users.push(user);
    await db.write();
    bot.sendMessage(msg.chat.id, "You've been enrolled and have become a member. Welcome to Eden!");
  } else if (user.role === 'user') {
    user.role = 'member';
    await db.write();
    bot.sendMessage(msg.chat.id, "You are now enrolled and have become a member. Welcome to Eden!");
  } else {
    bot.sendMessage(msg.chat.id, "You're already enrolled.");
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
bot.onText(/\/give (\d+) (\d+)/, async (msg, match) => {
  const fromId = msg.from.id;
  const fromUser = db.data.users.find(user => user.id === fromId);
  const toId = parseInt(match[1], 10);
  const points = parseInt(match[2], 10);

  // Check if the user is authorized and validate inputs
  if (!fromUser || !(fromUser.role === 'admin' || fromUser.role === 'owner') || isNaN(points) || points <= 0) {
    bot.sendMessage(msg.chat.id, "You're not authorized to give points or invalid points value.");
    return;
  }

  let toUser = db.data.users.find(user => user.id === toId);
  if (!toUser) {
    toUser = { id: toId, points, role: 'member' }; // Assuming default role is 'member'
    db.data.users.push(toUser);
  } else {
    toUser.points += points; // Ensure existing points are incremented
  }
  await db.write();
  bot.sendMessage(msg.chat.id, `Successfully gave ${points} GOOD points to user ${toId}.`);
});

// The /transfer Command for Points Transfer Among Users
bot.onText(/\/transfer (\d+) (\d+)/, async (msg, match) => {
  const fromId = msg.from.id;
  const toId = parseInt(match[1], 10);
  const points = parseInt(match[2], 10);

  if (fromId === toId) {
      bot.sendMessage(msg.chat.id, "You cannot transfer points to yourself.");
      return;
  }

  if (isNaN(points) || points <= 0) {
      bot.sendMessage(msg.chat.id, "Please specify a valid number of points to transfer.");
      return;
  }

  // Ensure database is up-to-date before operation
  await db.read();

  const fromUser = db.data.users.find(user => user.id === fromId);
  let toUser = db.data.users.find(user => user.id === toId);

  // Validate sender has enough points and is eligible to transfer
  if (!fromUser || fromUser.role === 'user' || fromUser.points < points) {
      bot.sendMessage(msg.chat.id, "You do not have enough points to transfer or are not authorized to transfer points.");
      return;
  }

  // Deduct points from sender
  fromUser.points -= points;

  // If receiver doesn't exist, add them as a new user/member with the given points
  if (!toUser) {
      toUser = { id: toId, points: points, role: 'member' }; // Assuming new users are added as 'member'
      db.data.users.push(toUser);
  } else {
      // Add points to receiver
      toUser.points = (toUser.points || 0) + points; // Ensure existing points are incremented
  }

  // Persist changes
  await db.write();

  bot.sendMessage(msg.chat.id, `You've successfully transferred ${points} GOOD points to user ${toId}.`);
});

