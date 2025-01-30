const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Discord bot setup
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const DISCORD_CHANNEL_ID = config.discord.channelId; // Get channel ID from config
const DISCORD_BOT_TOKEN = config.discord.token; // Get bot token from config
const WHATSAPP_NUMBER = config.whatsapp.phoneNumber; // Get WhatsApp number from config

// WhatsApp bot setup
async function startWhatsAppBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log('Connection closed. Reconnecting...');
            // Check if the disconnection was intentional
            if (lastDisconnect.error?.output?.statusCode !== 401) {
                startWhatsAppBot(); // Reconnect
            } else {
                console.log('Connection closed due to authentication error. Please re-scan the QR code.');
            }
        } else if (connection === 'open') {
            console.log('Connection opened!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return; // Ignore empty messages

        let messageContent = '';
        let sender = msg.key.participant || msg.key.remoteJid; // Get sender's ID

        // Check the type of the message and extract content accordingly
        if (msg.message.conversation) {
            messageContent = msg.message.conversation; // Text message
        } else if (msg.message.extendedTextMessage) {
            messageContent = msg.message.extendedTextMessage.text; // Extended text message
        } else {
            console.log('Received a message of unsupported type:', msg.message);
            return; // Exit if the message type is unsupported
        }

        // Format the message as (user): (message)
        if (messageContent) {
            const formattedMessage = (${sender}): ${messageContent};
            const channel = discordClient.channels.cache.get(DISCORD_CHANNEL_ID);
            if (channel) {
                await channel.send(formattedMessage);
            }
        }
    });

    return sock;
}

// Start both bots
(async () => {
    const sock = await startWhatsAppBot();
    discordClient.login(DISCORD_BOT_TOKEN); // Use token from config

    // Forward Discord messages to WhatsApp
    discordClient.on('messageCreate', async (message) => {
        if (message.channel.id === DISCORD_CHANNEL_ID && !message.author.bot) {
            // Forward message to WhatsApp
            const whatsappMessage = Discord: ${message.content};
            
            // Debugging: Log the WhatsApp number
            console.log(Sending message to WhatsApp number: ${WHATSAPP_NUMBER});
            
            try {
                // Construct the JID for the WhatsApp number
                const jid = ${WHATSAPP_NUMBER.replace('whatsapp:', '').trim()}@s.whatsapp.net;
                
                // Send message to WhatsApp
                await sock.sendMessage(jid, { text: whatsappMessage });
                console.log('Message sent to WhatsApp successfully.');
            } catch (error) {
                console.error('Error sending message to WhatsApp:', error);
            }
        }
    });
})();
