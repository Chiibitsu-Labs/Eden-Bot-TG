import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import { initDb } from './db/db.mjs';
import { startCommand } from './commands/start.mjs';
import { helpCommand } from './commands/help.mjs';
import { goodCommand } from './commands/good.mjs';
import { enrollCommand } from './commands/enroll.mjs';
import { giveCommand } from './commands/give.mjs';
import { takeCommand } from './commands/take.mjs';
import { transferCommand } from './commands/transfer.mjs';
import { topCommand } from './commands/top.mjs';
import { roleCommand } from './commands/role.mjs';
import { mydataCommand } from './commands/mydata.mjs';
import { deleteUserCommand } from './commands/deleteUser.mjs';
import { setPointsNameCommand } from './commands/setpointsname.mjs';
import { welcomeCommand, setWelcomeCommand } from './commands/welcome.mjs';

const token = process.env.TG_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

(async () => {
    const db = await initDb();

    bot.onText(/\/start/, (msg) => startCommand(msg, bot, db));
    bot.onText(/\/help/, (msg) => helpCommand(msg, bot, db));
    bot.onText(/\/points/, (msg) => goodCommand(msg, bot, db));
    bot.onText(/\/enroll/, (msg) => enrollCommand(msg, bot, db));
    bot.onText(/\/give/, (msg) => giveCommand(msg, bot, db));
    bot.onText(/\/take/, (msg) => takeCommand(msg, bot, db));
    bot.onText(/\/transfer/, (msg) => transferCommand(msg, bot, db));
    bot.onText(/\/top/, (msg) => topCommand(msg, bot, db));
    bot.onText(/\/role/, (msg) => roleCommand(msg, bot, db));
    bot.onText(/\/mydata/, (msg) => mydataCommand(msg, bot, db));
    bot.onText(/\/delete (@\w+)/, (msg) => deleteUserCommand(msg, bot, db));
    bot.onText(/\/setpointsname (.+)/, (msg) => setPointsNameCommand(msg, bot, db));
    bot.onText(/\/welcome$/, (msg) => welcomeCommand(msg, bot, db)); // For viewing and basic toggling of welcome messages
    bot.onText(/\/welcome\s+(.+)/, (msg) => welcomeCommand(msg, bot, db)); // Handles all welcome-related actions
    bot.onText(/\/setwelcome\s+(.+)/, (msg) => setWelcomeCommand(msg, bot, db)); // For setting custom welcome messages

    // Welcome new members
    bot.on('message', async (msg) => {
        if (msg.new_chat_members && msg.new_chat_members.length > 0) {
            const chatId = msg.chat.id.toString();
            const welcomeMessage = db.data.communities[chatId]?.welcomeMessage || "Welcome to the community! Type /start to get started.";
            bot.sendMessage(chatId, welcomeMessage);
        }
    });    
    
})();