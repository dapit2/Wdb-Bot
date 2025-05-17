import { channel } from "diagnostics_channel";
import { Client, GatewayIntentBits } from "discord.js";
import * as fs from "fs";
import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";

const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
const sock = makeWASocket({ 
    printQRInTerminal: true,
    auth: state
 });
sock.ev.on("creds.update", saveCreds);



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
    if (message.content === "!set") {
        const channelId = message.channel.id;
        try {
            const data = JSON.parse(fs.readFileSync('id.json', 'utf8'));
            data.dcClID = channelId;
            fs.writeFileSync('id.json', JSON.stringify(data, null, 4));
            message.channel.send(`Channel ID set to: ${channelId}`);
        } catch (error) {
            console.error("Error updating id.json:", error);
            message.channel.send("An error occurred while setting the channel ID.");
        }
    }
});

client.once("ready", () => {
    console.log("Bot is ready!");
});

client.on("error", (error) => {
    console.error("An error occurred:", error);
});

client.login(dctoken);