import { Client, GatewayIntentBits, MessageManager,TextChannel } from "discord.js";
import * as fs from "fs";
import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import dotenv from "dotenv";
import "dotenv/config";
import { channel } from "diagnostics_channel";
const data = JSON.parse(fs.readFileSync('id.json', 'utf8'));

dotenv.config();

const uidwa = ""; //your whatsapp number to use command bot
const uiddc = ""; //your discord user id to use command bot
const allowedRoleIds = ["", ""]; // Add role IDs if needed

// doing changes in here VVV only the connection doing changes maybe?
sock.ev.on("connection.update", handleConnectionUpdate);
async function handleConnectionUpdate(update: any) {
    const { qr, connection, lastDisconnect } = update;
    if (qr) {
        qrcode.generate(qr, { small: true });
        console.log("Scan the QR code above to log in to WhatsApp.");
    }
    if (connection == "close") {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
        console.log("Connection closed. Reconnecting...", shouldReconnect);
        if (shouldReconnect) {
            const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
            const newSock = makeWASocket({ syncFullHistory: false, auth: state });
            newSock.ev.on("creds.update", saveCreds);
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
        console.log("Received message Form whatsapp:", message.message.extendedTextMessage.text);
    }
    if(message.key.remoteJid == data.wagi) {
        if (!message.key.fromMe && message.message?.extendedTextMessage?.text) {
            const text = message.message.extendedTextMessage.text;
            const channel = client.channels.cache.get(data.dcClID);
            const sender = message.key.participant || message.key.remoteJid || "unknown";
            const name = message.pushName || sender?.split("@")[0] || "Unknown User";
            
            if (channel?.isTextBased()) {
                (channel as TextChannel).send(`${name}: ${text}`);
            }
        }
    }
    if(message.message.extendedTextMessage?.text == "!set") {
        if (message.key.remoteJid) {
        if (!uidwa || message.key.remoteJid === uidwa + "@c.us") {
        sock.sendMessage(message.key.remoteJid, { text: "You do not have permission to use this command." });
    }
    else {
            const id = message.key.remoteJid;
            data.wagi = id;
            fs.writeFileSync('id.json', JSON.stringify(data, null, 4));
            sock.sendMessage(message.key.remoteJid, { text: "GroupID set to: " + id });
        }
    }
}});

client.on("messageCreate", async (message) => {
    console.log(`Received message Form Discord: ${message.content}`);
    if (message.author.id == client.user?.id) return;
    if (message.channel.id == data.dcClID) {
        console.log("Message received discord!");
        
        // Handle messages with embeds
        let messageText = message.content;
        if (message.embeds.length > 0) {
            const embed = message.embeds[0];
            const author = embed?.author?.name ? `${embed.author.name}\n` : '';
            const title = embed?.title || "";
            const desc = embed?.description || "";
            const fields = embed?.fields?.map(f => `${f.name}: ${f.value}`).join('\n') || "";
            const footer = embed?.footer?.text || "";
            
            messageText = `${author}${title}\n${desc}\n${fields}\n${footer}`.trim();
        }
        const userInfo = `${message.author.username} `;
        sock.sendMessage(data.wagi, { text: userInfo + messageText });
    }
    if (message.content == "!set") {
        const channelId = message.channel.id;
        if (!message.guild) {
            message.channel.send("This command can only be used in a server.");
            return;
        }
        const member = message.guild.members.cache.get(message.author.id);
        if (!member) {
            message.channel.send("Could not retrieve member information.");
            return;
        }
        const hasAllowedRole = member.roles.cache.some(role => allowedRoleIds.includes(role.id));
        const isAllowedUser = uiddc === message.author.id; // Assuming `uiddc` is the allowed user ID
        if (!isAllowedUser && !hasAllowedRole) {
            message.channel.send("You do not have permission to use this command.");
            return;
        }
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
whatsappconnection()
