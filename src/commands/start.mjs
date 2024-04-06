// src/commands/start.mjs
export const startCommand = async (msg, bot, db) => {
    const chatId = msg.chat.id.toString(); // Ensure community ID is a string
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name; // Fallback to first name if username is not set

    // Ensure the community exists in the db
    if (!db.data.communities[chatId]) {
        db.data.communities[chatId] = { users: [], transactions: [], roles: [], settings: {}, pointsName: "GOOD" }; // Initialize with default pointsName if needed
    }
    const communityData = db.data.communities[chatId];

    // Check if the user already exists in this community
    let userExists = communityData.users.find(user => user.id === userId);

    // If user does not exist, add them to the community
    if (!userExists) {
        userExists = { id: userId, username, points: 0, role: 'user' }; // Default role and points
        communityData.users.push(userExists);
        await db.write();
        console.log(`Starting /start command (new) for user ${username} in chat ${chatId}`);
        bot.sendMessage(chatId, `Welcome, ${username}! You've been added as a new user. Type /enroll to join our Community Rewards Program!`);
    } else {
        console.log(`Starting /start command (existing) for user ${username} in chat ${chatId}`);
        bot.sendMessage(chatId, `Welcome back, ${username}! Use /help to see all available commands.`);
    }
};
