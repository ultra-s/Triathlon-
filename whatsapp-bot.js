require("dotenv").config();
const { Client, RemoteAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { RedisStore } = require("wwebjs-redis");
const { createClient } = require("redis");
const { askOpenRouter, clearMemory } = require("./ai-service");
const http = require("http");
const QRCode = require("qrcode");

let latestQR = null;
let botStatus = "Initializing...";

// Initialize Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Simple health check server for Render
const server = http.createServer(async (req, res) => {
    if (req.url === "/qr" && latestQR) {
        try {
            const qrImage = await QRCode.toDataURL(latestQR);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
                <html>
                    <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
                        <h1>Scan this QR Code</h1>
                        <img src="${qrImage}" style="width:300px;height:300px;border:10px solid white;box-shadow:0 0 10px rgba(0,0,0,0.1);" />
                        <p style="margin-top:20px;color:#666;">Waiting for WhatsApp link... (Refreshes automatically)</p>
                        <script>setTimeout(() => location.reload(), 10000);</script>
                    </body>
                </html>
            `);
            return;
        } catch (err) {
            res.writeHead(500);
            res.end("Error generating QR code");
            return;
        }
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
        <html>
            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
                <h1>WhatsApp AI Bot</h1>
                <p>Status: <strong>${botStatus}</strong></p>
                ${latestQR ? '<a href="/qr" style="padding:10px 20px;background:#25D366;color:white;text-decoration:none;border-radius:5px;font-weight:bold;">View QR Code</a>' : '<p style="color:#666;">Bot is ready or already linked.</p>'}
                <p style="margin-top:50px; font-size:12px; color:#999;">Last deployed: ${new Date().toISOString()}</p>
            </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Health check server running on port ${PORT}`);
});

async function startBot() {
    console.log("Connecting to Redis...");
    await redisClient.connect();
    console.log("Connected to Redis.");

    const store = new RedisStore({ redis: redisClient });

    const client = new Client({
        authStrategy: new RemoteAuth({
            clientId: "whatsapp-ai-bot-v1",
            store: store,
            backupSyncIntervalMs: 60000 // Must be >= 60000
        }),
        webVersionCache: {
            type: "remote",
            remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014580281-alpha.html",
        },
        puppeteer: {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--single-process",
                "--disable-gpu",
                "--disable-blink-features=AutomationControlled",
                "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "--js-flags=\"--max-old-space-size=256\""
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        }
    });

    client.on("qr", (qr) => {
        console.log("Scan the QR code available at the service URL to log in.");
        latestQR = qr;
        botStatus = "Waiting for QR scan...";
        qrcode.generate(qr, { small: true });
    });

    client.on("loading_screen", (percent, message) => {
        console.log("LOADING SCREEN", percent, message);
        botStatus = `Loading... ${percent}%`;
    });

    client.on("remote_session_saved", () => {
        console.log("✅ SUCCESS: Session saved to Redis!");
    });

    client.on("ready", () => {
        console.log("🚀 SUCCESS: WhatsApp Bot is ready!");
        botStatus = "Bot is Online and Ready";
        latestQR = null;
    });

    client.on("authenticated", () => {
        console.log("🔑 AUTHENTICATED: WhatsApp linked successfully.");
        botStatus = "Authenticated. Starting...";
    });

    client.on("auth_failure", (msg) => {
        console.error("❌ Authentication failure:", msg);
        botStatus = "Authentication failed.";
    });

    client.on("disconnected", (reason) => {
        console.log("❌ Client was logged out", reason);
        botStatus = "Disconnected.";
    });

    client.on("message", async (msg) => {
        try {
            // Only respond in private chats
            const chat = await msg.getChat();
            if (chat.isGroup) return;

            console.log(`📩 Message received from ${msg.from}: ${msg.body.substring(0, 50)}...`);

            const body = msg.body.toLowerCase();

            if (body === "/clear") {
                clearMemory(msg.from);
                await msg.reply("🧹 Chat memory cleared!");
                return;
            }

            await chat.sendStateTyping();

            const reply = await askOpenRouter(msg.from, msg.body);
            await msg.reply(reply);
            console.log(`📤 Replied to ${msg.from}`);
        } catch (error) {
            console.error("❌ Error processing message:", error);
            try {
                await msg.reply("⚠️ Sorry, I encountered an error processing your request.");
            } catch (replyError) {
                console.error("❌ Failed to send error reply:", replyError.message);
            }
        }
    });

    console.log("Initializing WhatsApp client...");
    client.initialize();
}

// Global error handling
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
});

startBot().catch(err => {
    console.error("❌ Failed to start bot:", err);
    process.exit(1);
});
