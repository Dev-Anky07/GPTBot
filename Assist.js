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

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;

  try {
    // Your custom code starts here
    const { UnstructuredPDFLoader, OnlinePDFLoader, PyPDFLoader } = require('langchain/document_loaders');
    const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
    const pinecone = require('pinecone');

    const loader = new PyPDFLoader("/workspace/Apecoin.pdf");
    const data = loader.load();

    console.log(`You have ${data.length} document(s) in your data`);
    console.log(`There are ${data[30].page_content.length} characters in your document`);

    const text_splitter = new RecursiveCharacterTextSplitter(1000, 0);
    const texts = text_splitter.splitDocuments(data);

    console.log(`Now you have ${texts.length} documents`);

    const { Pinecone } = require('langchain/vectorstores');
    const { OpenAIEmbeddings } = require('langchain/embeddings/openai');

    const embeddings = new OpenAIEmbeddings(process.env.OPENAI_API_KEY);

    // Initialize Pinecone
    pinecone.init({
      api_key: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_API_ENV
    });
    const index_name = "ape"; // Ape Assistant

    const docsearch = Pinecone.fromTexts(texts.map(t => t.page_content), embeddings, { index_name });

    const query = message.content;
    const docs = docsearch.similaritySearch(query);

    // Example of the first document that was returned
    console.log(docs[0].page_content.substring(0, 450));

    const { OpenAI } = require('langchain/llms');
    const { loadQAChain } = require('langchain/chains/question_answering');

    const llm = new OpenAI({ temperature: 0.1, openai_api_key: process.env.OPENAI_API_KEY });
    const chain = loadQAChain(llm, { chain_type: "stuff" });

    chain.run({ input_documents: docs, question: query });
    // Your custom code ends here

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are using a custom model that acts as a helpful assistant for a specific product. This assistant has been trained on all the relevant data around the product to provide accurate and detailed information. It is designed to answer any questions new users may have. Imagine you are a new user of this product and ask any questions you have. The assistant will utilize its extensive knowledge to provide you with informative and helpful responses." },
        { role: "user", content: message.content }
      ],
    });

    const content = response.data.choices[0].message;
    return message.reply(content);

  } catch (err) {
    return message.reply(
      "I'm sorry, I don't know."
    );
  }
});

client.login(process.env.BOT_TOKEN);
