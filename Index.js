import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_API_ENV = process.env.PINECONE_API_ENV;
const { Pinecone } = require('langchain.vectorstores');
const { OpenAIEmbeddings } = require('langchain.embeddings.openai');
const pinecone = require('pinecone');

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

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;
  
  // Check if the message mentions the bot
  const botMentioned = message.mentions.has(client.user);

  if (botMentioned) {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are like a helpful friend who answers succinctly" },
          { role: "user", content: message.content }
        ],
      });

      const content = response.data.choices[0].message;
      return message.reply(content);

    } catch (err) {
      return message.reply("I do not know.");
    }
  }
});

client.login(process.env.BOT_TOKEN);