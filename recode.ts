import { clientTimeout } from "@hapi/boom";
import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { client, GatewayIntentBits } from "discord.js";
import { start } from "repl";
const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");


import client = new client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

var discord_channel_id = "";
var discord_token = "";
var whatsapp_gruopid = "";

const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
});

sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
        console.log("Connection closed, reconnecting...");
(async () => {
    const sock = await startWabot();
    await client.login(discord_token);
})();
        console.log("Connection opened");
    }
});

function startWabot() {
    const sock = await startWabot();
    client.login(discord_token);
}

