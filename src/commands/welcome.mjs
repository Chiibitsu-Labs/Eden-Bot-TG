// commands/welcome.mjs
import { isOwnerOrAdmin } from '../utils/roleChecks.mjs';

export const welcomeCommand = async (msg, bot, db) => {
    const chatId = msg.chat.id.toString();

    // This is the entry point for all welcome-related commands
    // Split the command to understand the action
    const parts = msg.text.split(' ');
    const action = parts[1] ? parts[1].toLowerCase() : '';

    if (!isOwnerOrAdmin(msg.from.id, db, chatId)) {
        return bot.sendMessage(msg.chat.id, "You're not authorized to modify welcome messages.");
    }

    switch (action) {
        case 'on':
            db.data.communities[chatId].settings.welcomeEnabled = true;
            await db.write();
            bot.sendMessage(msg.chat.id, "Welcome messages enabled.");
            break;
        case 'off':
            db.data.communities[chatId].settings.welcomeEnabled = false;
            await db.write();
            bot.sendMessage(msg.chat.id, "Welcome messages disabled.");
            break;
        case 'noformat':
            // Assuming this function shows the raw welcome message
            viewWelcomeMessage(msg, bot, db, chatId, true);
            break;
        case '':
            // Assuming this function shows the formatted welcome message
            viewWelcomeMessage(msg, bot, db, chatId, false);
            break;
        default:
            // Any other text is assumed to be part of a custom welcome message setup
            setWelcomeCommand(msg, bot, db, chatId);
            break;
    }
};

export const setWelcomeCommand = async (msg, bot, db) => {
    const chatId = msg.chat.id.toString();
    
    if (!isOwnerOrAdmin(msg.from.id, db, chatId)) {
        // This message should only be sent if the user is indeed not an owner or admin
        return bot.sendMessage(msg.chat.id, "You're not authorized to set the welcome message.");
    }

    // Extract the welcome message text, assuming the command is structured as /setwelcome <message>
    const newWelcomeMessage = msg.text.slice('/setwelcome'.length).trim();

    // Assuming your database structure supports storing a welcome message per community
    if (!db.data.communities[chatId]) {
        db.data.communities[chatId] = { ...defaultCommunitySettings, welcomeMessage: newWelcomeMessage };
    } else {
        db.data.communities[chatId].settings.welcomeMessage = newWelcomeMessage;
    }
    
    await db.write();
    bot.sendMessage(msg.chat.id, "Welcome message updated successfully for this community.");
};

const viewWelcomeMessage = async (msg, bot, db, chatId, raw) => {
    const welcomeMessage = db.data.communities[chatId]?.settings.welcomeMessage || "Welcome to the community! Type /start to get started.";
    bot.sendMessage(msg.chat.id, raw ? `Raw welcome message: \`${welcomeMessage}\`` : welcomeMessage, { parse_mode: 'Markdown' });
};