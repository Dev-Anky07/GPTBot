import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { Configuration, OpenAIApi } from "openai";
require('dotenv').config();

const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { Pinecone } = require('langchain/vectorstores');
const { OpenAI } = require('langchain/llms');
const { load_qa_chain } = require('langchain/chains/question_answering');

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

const conversationCache = {};

// Initialize OpenAIEmbeddings
const embeddings = new OpenAIEmbeddings({ openai_api_key: process.env.OPENAI_API_KEY });

// Initialize Pinecone
const pinecone = Pinecone.init({
  api_key: process.env.PINECONE_API_KEY2,
  environment: process.env.PINECONE_API_ENV2,
});

const index_name = 'ape'; // Ape Assistant

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;

  const conversationId = message.channel.id;
  const conversation = conversationCache[conversationId];

  // Check if the message mentions the bot
  const botMentioned = message.mentions.has(client.user);

  try {
    let messages = [
      { role: "system", content: "You are like a helpful and friendly assistant who answers succinctly" },
    ];

    if (conversation) {
      messages = [...messages, ...conversation];
    }

    messages.push({ role: "user", content: message.content });

    if (botMentioned) {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.1, // Set the temperature parameter (adjust as desired)
        maxTokens: 1000, // Set the maxTokens parameter (adjust as desired)
      });

      const content = response.data.choices[0].message;
      await message.reply(content);
    }

    // Cache the conversation history
    conversationCache[conversationId] = messages;

    // Perform document search and question answering
    const docsearch = Pinecone.from_texts(texts.map(t => t.page_content), embeddings, { index_name });

    const query = "What's AIP 239?";
    const docs = docsearch.similarity_search(query);

    // Here's an example of the first document that was returned
    console.log(docs[0].page_content.slice(0, 450));

    const llm = new OpenAI({ temperature: 0.1, openai_api_key: process.env.OPENAI_API_KEY });
    const chain = load_qa_chain(llm, { chain_type: "stuff" });

    // maxTokens=1000 is a test parameter, want to check if it works or not.
    const query2 = "What is the Ape Assembly?";
    const docs2 = docsearch.similarity_search(query2);

    chain.run({ input_documents: docs2, question: query2 });

  } catch (err) {
    console.error(err);
    await message.reply("I'm sorry, I'm not smart enough to tell you that.");
  }
});

client.login(process.env.BOT_TOKEN2);
