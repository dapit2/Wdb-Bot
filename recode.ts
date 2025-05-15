import { Client, GatewayIntentBits } from "discord.js";
import * as fs from "fs";

const dctoken = ""

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    console.log(`Received message: ${message.content}`);
    


client.once("ready", () => {
    console.log("Bot is ready!");
});

client.on("error", (error) => {
    console.error("An error occurred:", error);
});

client.login(dctoken);