import { Client, Events, GatewayIntentBits, TextChannel } from "discord.js";
import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import readline from "readline";
import pino from "pino";
import fs from "fs";
import 'dotenv/config'
const data = JSON.parse(fs.readFileSync('id.json', 'utf8'));

const usePairingCode = false; // Set to false if you want to use QR code
const uidwa = ""; // your whatsapp number to use command bot
const uiddc = ""; // your discord user id to use command bot
const allowedRoleIds = ["", ""]; // Add role IDs if needed

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

async function question(promt: string) {
    process.stdout.write(promt)
    const r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    return new Promise((resolve) => r1.question("", (ans) => {
            r1.close()
            resolve(ans)
        }))
}

let sock: ReturnType<typeof makeWASocket>;

async function startbot() {
    console.log(chalk.blue("Starting bot..."));
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    sock = makeWASocket({
        syncFullHistory: false,
        auth: state,
        logger: pino({ level: "silent" }),
    })
    
    //jika menggunakan pairing code
    if (usePairingCode && !sock.authState.creds.registered) {
        console.log(chalk.blue("Enter Phone Number to register like 62----"))
        const phoneNumber = await question("Phone Number: ") as string;
        const code = await sock.requestPairingCode(phoneNumber.trim())
        console.log(chalk.blue(`Pairing Code: ${code}`))
    }
    
    //menyimpan hasil auth state
    sock.ev.on("creds.update", saveCreds)

    //konkesi whatsapp
    sock.ev.on("connection.update", (update) => {
        const { qr, connection, lastDisconnect } = update
        if(qr) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === "close") {
            console.log(chalk.red("Connection closed, attempting to reconnect..."));
                startbot()
            } else if ( connection === "open") {
                console.log(chalk.green("Success connected!"));
            }
        })
        
sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if(!msg?.message) return
    if(msg.key.fromMe) return
    const handlemsg = msg.message.extendedTextMessage?.text || msg.message.conversation
    const sender = msg.key.remoteJid || ""
    const channel = client.channels.cache.get(data.dcClID)
    const iduser = msg.key.participant || msg.key.remoteJid || "ukown"
    const name = msg.pushName || sender?.split("@")[0] || "Unknown User";
    console.log("type message:", Object.keys(msg.message));
    //Menampilkan Pesan yang dikirim di whatsapp
    if(handlemsg) {
        console.log("Received message Form whatsapp:", handlemsg);
    }

    //Meneruskan pesan dari whatsapp ke discord
    //check apakah id user atau id grup sama dengan id grup yang sudah diset atau kosong
        if(msg.key.remoteJid == data.wagi) {
        if(!msg.key.fromMe && handlemsg) {
            if(channel?.isTextBased()) {
                (channel as TextChannel).send(`${name}: ${handlemsg}`);
            }
        }
    }

    //command set grup whatsapp ID
    if(handlemsg == "!set"){
        //check jika variable uidwa kosong atau membandingkan variable uidwa dengan user
        if(!uidwa || msg.key.remoteJid == uidwa + "@c.us"){
            sock.sendMessage(sender, { text: "You do not have permission to use this command." });
        }
        else {
            data.wagi = msg.key.remoteJid;
            fs.writeFileSync('id.json', JSON.stringify(data, null, 4));
            sock.sendMessage(sender, { text: "GroupID set to: " +  data.wagi });
        }}})
}

client.on("messageCreate", async (message) => {
    console.log(`Received message Form Discord: ${message.content}`);
    if (message.author.id === client.user?.id) return;
    if (message.channel.id === data.dcClID) {
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
    if (message.content === "!set") {
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

//menampilkan ketika bot sudah siap
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

//error discord bot
client.on("error", (error) => {
    console.error("An error occurred:", error);
});

//Memulai Bot
startbot()
client.login(process.env.token)
