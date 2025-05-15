import { Client,GatewayIntentBits } from "discord.js";

var dctoken = "";
var wagid = "";
var dcClID = "";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.once("ready", () => {
    console.log("Bot is ready!");
});

client.on("error", (error) => {
    console.error("An error occurred:", error);
});

client.login(dctoken);