require("dotenv").config();
const { Client, RemoteAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { RedisStore } = require("wwebjs-redis");
const { createClient } = require("redis");
const { askOpenRouter, clearMemory } = require("./ai-service");

// Initialize Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

async function startBot() {
    console.log("Connecting to Redis...");
    await redisClient.connect();
    console.log("Connected to Redis.");

    const store = new RedisStore({ client: redisClient });

    const client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 60000
        }),
        puppeteer: {
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--single-process", // <- this one doesn't works in Windows
                "--disable-gpu"
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        }
    });

    client.on("qr", (qr) => {
        console.log("Scan this QR code with your WhatsApp to log in:");
        qrcode.generate(qr, { small: true });
    });

    client.on("remote_session_saved", () => {
        console.log("Session saved to Redis!");
    });

    client.on("ready", () => {
        console.log("WhatsApp Bot is ready!");
    });

    client.on("auth_failure", (msg) => {
        console.error("Authentication failure:", msg);
    });

    client.on("message", async (msg) => {
        // Only respond in private chats (not groups)
        const chat = await msg.getChat();
        if (chat.isGroup) return;

        const body = msg.body.toLowerCase();

        // Optional: clear memory command
        if (body === "/clear") {
            clearMemory(msg.from);
            await msg.reply("🧹 Chat memory cleared!");
            return;
        }

        // Send typing indicator
        await chat.sendStateTyping();

        try {
            const reply = await askOpenRouter(msg.from, msg.body);
            await msg.reply(reply);
        } catch (error) {
            console.error("Error processing message:", error);
            await msg.reply("⚠️ Sorry, I encountered an error processing your request.");
        }
    });

    console.log("Initializing WhatsApp client...");
    client.initialize();
}

startBot().catch(err => {
    console.error("Failed to start bot:", err);
});
