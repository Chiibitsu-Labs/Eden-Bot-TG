import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
const token = process.env.TG_BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

// Initialize LowDB
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db.defaults({ users: [], transactions: [], roles: [] })
  .write();

// Roles list and levels
db.get('roles')
  .push({ name: 'owner', level: 10 })
  .push({ name: 'admin', level: 5 })
  .push({ name: 'leader', level: 4 })
  .push({ name: 'advocate', level: 3 })
  .push({ name: 'member', level: 2 })
  .push({ name: 'user', level: 1 })
  .write();

// Check if the roles already exist to avoid duplicate roles on restart
roles.forEach(role => {
  if (!db.get('roles').find({ name: role.name }).value()) {
    db.get('roles').push(role).write();
  }
});

// Checking user roles
function getUserRole(userId) {
  const user = db.get('users').find({ id: userId }).value();
  return user ? user.role : null;
}

function getRoleLevel(roleName) {
  const role = db.get('roles').find({ name: roleName }).value();
  return role ? role.level : 0;
}

// isUser
function isUser(userId) {
  const role = getUserRole(userId);
  return role && db.get('roles')
    .find({ name: role })
    .value().level === 1; // Level 1 is User
}

// isMember
function isMember(userId) {
  const role = getUserRole(userId);
  return role && db.get('roles')
    .find({ name: role })
    .value().level === 2; // Level 2 is Member
}

// isAdvocate
function isAdvocate(userId) {
  const role = getUserRole(userId);
  return role && db.get('roles')
    .find({ name: role })
    .value().level === 3; // Level 3 is Advocate
}

// isLeader
function isLeader(userId) {
  const role = getUserRole(userId);
  return role && db.get('roles')
    .find({ name: role })
    .value().level === 4; // Level 4 is Leader
}

// isAdmin
function isAdmin(userId) {
  const role = getUserRole(userId);
  return role && db.get('roles')
    .find({ name: role })
    .value().level === 5; // Level 4 is Admin
}

// isOwner
function isOwner(userId) {
  const role = getUserRole(userId);
  return role && db.get('roles')
    .find({ name: role })
    .value().level === 10; // Level 5 is Owner
}

// Start Command: This command can greet users and tell them about the bot's functionalities.
bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;
  const userExists = db.get('users').find({ id: userId }).value();
  if (!userExists) {
      db.get('users').push({ id: userId, points: 0, role: 'user' }).write();
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
bot.onText(/\/enroll/, (msg) => {
  try {
    const userId = msg.from.id;
    if (isUser(userId)) {
      db.get('users')
        .find({ id: userId })
        .assign({ role: 'member' })
        .write();
      bot.sendMessage(msg.chat.id, "You are now enrolled and have become a member. Welcome to Eden!");
    } else {
      bot.sendMessage(msg.chat.id, "You're already enrolled.");
    }
  } catch (error) {
    console.error('Enroll command failed:', error);
    bot.sendMessage(msg.chat.id, "Sorry, there was an error processing your request.");
  }
});

// Combining isAdmin and isOwner checks for simplicity
function isAdminOrOwner(userId) {
  const userRole = getUserRole(userId);
  const roleLevel = getRoleLevel(userRole);
  return roleLevel >= getRoleLevel('admin'); // True for admins and owners, adjust as needed
}

// The /give Command for Admins and Owners
bot.onText(/\/give (\d+) (\d+)/, (msg, match) => {
  const fromId = msg.from.id;

  // Check if the user is authorized (Admin or Owner)
  if (!isAdminOrOwner(fromId)) {
    bot.sendMessage(msg.chat.id, "Sorry, you're not authorized to give points.");
    return;
  }

  const toId = parseInt(match[1], 10);
  const points = parseInt(match[2], 10);

  // Validate the points to ensure they are a positive number
  if (isNaN(points) || points <= 0) {
    bot.sendMessage(msg.chat.id, "Please specify a valid number of points to give. Points must be a positive number.");
    return;
  }

  // Check if the recipient user ID is valid and different from the sender's
  if (isNaN(toId) || toId === fromId) {
    bot.sendMessage(msg.chat.id, "Please specify a valid recipient ID and it should not be your own ID.");
    return;
  }

  // Add or update user with points
  let user = db.get('users').find({ id: toId }).value();
  if (user) {
    db.get('users')
      .find({ id: toId })
      .assign({ points: (user.points || 0) + points }) // Ensure existing points are incremented
      .write();
    bot.sendMessage(msg.chat.id, `Successfully gave ${points} GOOD points to user ${toId}.`);
  } else {
    // If the user does not exist in the database, add them as a new member with the given points
    db.get('users')
      .push({ id: toId, points: points, role: 'member' })
      .write();
    bot.sendMessage(msg.chat.id, `User was not in the database; they have been added as a member and given ${points} GOOD points.`);
  }
});

// The /transfer Command for Points Transfer Among Users
bot.onText(/\/transfer (\d+) (\d+)/, async (msg, match) => {
  const fromId = msg.from.id;
  const toId = parseInt(match[1], 10);
  const points = parseInt(match[2], 10);

  try {
    if (fromId === toId) {
      bot.sendMessage(msg.chat.id, "You cannot transfer points to yourself.");
      return;
    }
    if (isNaN(points) || points <= 0) {
      bot.sendMessage(msg.chat.id, "Please specify a valid number of points to transfer.");
      return;
    }

    const fromUser = db.get('users').find({ id: fromId }).value();
    const toUser = db.get('users').find({ id: toId }).value();

    if (!fromUser || fromUser.role === 'user' || fromUser.points < points) {
      bot.sendMessage(msg.chat.id, "You do not have enough points to transfer or are not authorized to transfer points.");
      return;
    }

    // Deduct points from sender
    db.get('users')
      .find({ id: fromId })
      .assign({ points: fromUser.points - points })
      .write();
    
    // Add points to receiver, adding as a member if not exist
    if (toUser) {
      db.get('users')
        .find({ id: toId })
        .assign({ points: (toUser.points || 0) + points })
        .write();
    } else {
      db.get('users')
        .push({ id: toId, points: points, role: 'member' })
        .write();
    }

    bot.sendMessage(msg.chat.id, `You've successfully transferred ${points} GOOD points to user ${toId}.`);
  } catch (error) {
    console.error('Transfer command failed:', error);
    bot.sendMessage(msg.chat.id, "Sorry, there was an error processing your transfer.");
  }
});