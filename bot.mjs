import { startWebServer } from './src/utils/webserver.mjs';
import 'dotenv/config';
import { logTransactionToSheet } from './src/utils/googleSheetsClient.mjs';
import { addUserToAirtable, checkUserExists, updateUserStatusInAirtable } from './src/utils/airtableHelpers.mjs'; // Updated import
import TelegramBot from 'node-telegram-bot-api';
import { initDb } from './src/db/db.mjs';
import { startCommand } from './src/commands/start.mjs';
import { helpCommand } from './src/commands/help.mjs';
import { goodCommand } from './src/commands/good.mjs';
import { enrollCommand } from './src/commands/enroll.mjs';
import { giveCommand } from './src/commands/give.mjs';
import { takeCommand } from './src/commands/take.mjs';
import { transferCommand } from './src/commands/transfer.mjs';
import { topCommand } from './src/commands/top.mjs';
import { roleCommand } from './src/commands/role.mjs';
import { mydataCommand } from './src/commands/mydata.mjs';
import { deleteUserCommand } from './src/commands/deleteUser.mjs';
import { setPointsNameCommand } from './src/commands/setpointsname.mjs';
import { welcomeCommand, setWelcomeCommand } from './src/commands/welcome.mjs';

const token = process.env.TG_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

(async () => {
  startWebServer(); // Starts the web server

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
  bot.onText(/\/deleteuser/, (msg) => deleteUserCommand(msg, bot, db));
  bot.onText(/\/setpointsname (.+)/, (msg) => setPointsNameCommand(msg, bot, db));
  bot.onText(/\/welcome$/, (msg) => welcomeCommand(msg, bot, db)); // For viewing and basic toggling of welcome messages
  bot.onText(/\/welcome\s+(.+)/, (msg) => welcomeCommand(msg, bot, db)); // Handles all welcome-related actions
  bot.onText(/\/setwelcome\s+(.+)/, (msg) => setWelcomeCommand(msg, bot, db)); // For setting custom welcome messages


    // Welcome new members and add them to Airtable if they don't exist
    bot.on('message', async (msg) => {
      if (msg.new_chat_members && msg.new_chat_members.length > 0) {
          const chatId = msg.chat.id.toString();
          const welcomeMessage = db.data.communities[chatId]?.welcomeMessage || "Welcome to the community! Type /enroll to join the Community Rewards Program.";

          for (const newMember of msg.new_chat_members) {
            try {
                if (!(await checkUserExists(newMember.id, chatId))) { // Pass chatId as communityId
                    console.log("Attempting to add user to Airtable with ID:", targetUserId);
                    await addUserToAirtable({
                        id: newMember.id,
                        username: newMember.username || '',
                        role: 'user', // Default role when new member joins
                        chatId, 
                    }, chatId); // Pass chatId as communityId
                    console.log(`Added new member ${newMember.username || newMember.id} to Airtable.`);
                } else {
                    console.log(`Member ${newMember.username || newMember.id} already exists in Airtable.`);
                }
            } catch (error) {
                console.error(`Error handling new member ${newMember.username || newMember.id}:`, error);
            }
          }

          bot.sendMessage(chatId, welcomeMessage);
      }
  });

})();