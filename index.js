const { Client, Intents, MessageEmbed } = require("discord.js");

// Create a new Discord client
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Event listener for when the bot is ready
client.once("ready", () => {
  console.log("Bot is ready!");
});

// Function to send logs in chunks if the content length exceeds 2000 characters
async function sendLogsInChunks(user, logChunks) {
  for (const chunk of logChunks) {
    try {
      await user.send(chunk);
    } catch (error) {
      console.error(`Failed to send log to ${user.tag}:`, error);
      return false;
    }
  }
  return true;
}

// Event listener for when a message is sent
client.on("messageCreate", async (message) => {
  // Check if the message starts with the command prefix and is from a non-bot user
  if (!message.content.startsWith("!") || message.author.bot) return;

  // Parse the command and arguments
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Handle the log command
  if (command === "save") {
    // Check if the user has permission to manage messages
    if (!message.member.permissions.has("MANAGE_MESSAGES")) {
      return message.reply("you need admin to use this command");
    }

    // Check if the user specified the number of messages to log
    let numMessages = 50; // Default to 50 messages
    if (args.length > 0) {
      numMessages = parseInt(args[0]);
      if (isNaN(numMessages) || numMessages < 1 || numMessages > 50) {
        return message.reply("Please specify a number between 1 and 50.");
      }
    }

    // Fetch the last 'numMessages' messages
    const messages = await message.channel.messages.fetch({
      limit: numMessages,
    });

    // Filter out bot messages
    const nonBotMessages = messages.filter((msg) => !msg.author.bot);

    // Create an array to hold chunks of log messages
    const logChunks = [];
    let currentChunk = "";

    // Construct the log content
    nonBotMessages.forEach((msg) => {
      const msgString = `**${msg.author.tag}**: ${msg.content}\n`;
      // If adding the next message exceeds the character limit, push the current chunk to the logChunks array and start a new chunk
      if (currentChunk.length + msgString.length > 2000) {
        logChunks.push(currentChunk);
        currentChunk = "";
      }
      // Append the message to the current chunk
      currentChunk += msgString;
    });

    // Push the last chunk
    logChunks.push(currentChunk);

    // Send the log to the user's DM
    try {
      const success = await sendLogsInChunks(message.author, logChunks);
      if (success) {
        message.reply(`Last ${numMessages} messages saved to your DMs.`);
      } else {
        message.reply("Failed to send log to your DMs.");
      }
    } catch (error) {
      console.error(`Failed to send log to ${message.author.tag}:`, error);
      message.reply("Failed to send log to your DMs.");
    }
  }
});

// Log in to Discord with your bot token
client.login(process.env.DISCORD_TOKEN);
