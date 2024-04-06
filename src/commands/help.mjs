// src/commands/help.mjs
export const helpCommand = async (msg, bot, db) => {
  const chatId = msg.chat.id.toString();

  // Initialize isAdminOrOwner flag to false
  let isAdminOrOwner = false;

  // Safely check if the community exists and set isAdminOrOwner accordingly
  if (db && db.data.communities && db.data.communities[chatId]) {
    const user = db.data.communities[chatId].users.find(user => user.id === msg.from.id);
    if (user && (user.role === 'admin' || user.role === 'owner')) {
      isAdminOrOwner = true;
    }
  }

  const pointsName = db.data.communities[chatId].settings.pointsName || "points"; // Fetching the dynamic points name

  let helpText = `
Here are the commands you can use:
/start - Start interacting with the bot.
/points [@username] - Check your or another user's ${pointsName} balance.
/enroll [@username] - Join the community rewards program or enroll another user.
/mydata - Check your user data.
/transfer @username <# of ${pointsName}> - Transfer ${pointsName} to another member.
/top - View the leaderboard.
/role [@username] - Check your or another user's role.
/help - Display this help message.

More features coming soon!
  `;

  // Append admin commands if the user is an admin or owner
  if (isAdminOrOwner) {
    helpText += `

Admin Commands:
/give @username <# of ${pointsName}> - Give ${pointsName} to a user.
/take @username <# of ${pointsName}> - Take ${pointsName} from a user.
/setpointsname <name> - Set a custom name for your community points.
/setwelcome <message> - Set a custom welcome message.
/welcome on/off - Toggle welcome messages on or off.
/resetwelcome - Reset welcome message to default.

Use these commands to manage the community effectively.
    `;
  }

  bot.sendMessage(msg.chat.id, helpText.trim(), { parse_mode: "Markdown" });
};
