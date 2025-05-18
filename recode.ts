import { Client, GatewayIntentBits } from "discord.js";
import * as fs from "fs";
import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import 'dotenv/config'
const data = JSON.parse(fs.readFileSync('id.json', 'utf8'));

const uidwa = ""; //your whatsapp number to use command bot
const uiddc = ""; //your discord user id to use command bot


const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
const sock = makeWASocket({ 
    syncFullHistory: false,
    auth: state
 });
sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", handleConnectionUpdate);
async function handleConnectionUpdate(update: any) {
    const { qr, connection, lastDisconnect } = update;
    if (qr) {
        qrcode.generate(qr, { small: true });
        console.log("Scan the QR code above to log in to WhatsApp.");
    }
    if (connection === "close") {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
        console.log("Connection closed. Reconnecting...", shouldReconnect);
        if (shouldReconnect) {
            const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
            const newSock = makeWASocket({ syncFullHistory: false, auth: state });
            newSock.ev.on("creds.update", saveCreds);
            // Use the named handler instead of arguments.callee
            newSock.ev.on("connection.update", handleConnectionUpdate);
        } else {
            console.log("Session ended. Delete auth_info_baileys and restart to generate a new QR.");
        }
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

sock.ev.on("messages.upsert", async (msg) => {
    const message = msg.messages[0];
    if(!message?.message) return;
    if (message.key.fromMe) return;
    if (message.message.extendedTextMessage) {
        console.log("Received message:", message.message.extendedTextMessage.text);
    }
    if(message.key.remoteJid === data.wagi) {
        sock.sendMessage(data.wagi, { text: "message received!"});
    }
    if(message.message.extendedTextMessage?.text == "!set") {
        if (message.key.remoteJid) {
            const id = message.key.remoteJid;
            data.wagi = id;
            fs.writeFileSync('id.json', JSON.stringify(data, null, 4));
            sock.sendMessage(message.key.remoteJid, { text: "GroupID set to: " + id });
        }
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    console.log(`Received message: ${message.content}`);
    if (message.channel.id === data.dcClID) {
        message.channel.send("Message received!");
    }
    if (message.content === "!set") {
        const channelId = message.channel.id;
        try {
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

client.login(process.env.dctoken)