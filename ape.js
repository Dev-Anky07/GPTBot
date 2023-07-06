import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const conversationCache = {};

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;

  const conversationId = message.channel.id;
  const conversation = conversationCache[conversationId];

  // Check if the message mentions the bot
  const botMentioned = message.mentions.has(client.user);

  try {
    let messages = [
      { role: "system", content: "You are like a friend who gives sarcastic, leg pulling responses but all in good fun" },
    ];

    if (conversation) {
      messages = [...messages, ...conversation];
    }

    messages.push({ role: "user", content: message.content });

    if (botMentioned) {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });

      const content = response.data.choices[0].message;
      await message.reply(content);
    }

    // Cache the conversation history
    conversationCache[conversationId] = messages;

  } catch (err) {
    console.error(err);
    await message.reply("As an AI robot, I errored out.");
  }
});

client.login(process.env.BOT_TOKEN);
