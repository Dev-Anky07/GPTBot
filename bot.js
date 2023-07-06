import fs from "fs";
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

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

// Add Context to the bot using your content library

client.on("messageCreate", async function (message) {
    if (message.author.bot) return;
    
    try {
      const response = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
              {role: "system", content: "You are like a friend who gives sarcastic, leg pulling responses but all in good fun"},
              {role: "user", content: message.content}
          ],
        });
  
      const content = response.data.choices[0].message;
      return message.reply(content);
  
    } catch (err) {
      return message.reply(
        "I'm sorry, I'm not smart enogh to tell you that."
      );
    }
  });

client.login(process.env.BOT_TOKEN);