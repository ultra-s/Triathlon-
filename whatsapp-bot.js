require("dotenv").config();
const { Client, RemoteAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { RedisStore } = require("wwebjs-redis");
const { createClient } = require("redis");
const { askOpenRouter, clearMemory } = require("./ai-service");
const http = require("http");
const QRCode = require("qrcode");

let latestQR = null;

// Initialize Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

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
                        <p style="margin-top:20px;color:#666;">Waiting for WhatsApp link...</p>
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
                <p>Status: Running</p>
                ${latestQR ? '<a href="/qr" style="padding:10px 20px;background:#25D366;color:white;text-decoration:none;border-radius:5px;font-weight:bold;">View QR Code</a>' : '<p style="color:#666;">Bot is ready or already linked.</p>'}
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
                "--single-process",
                "--disable-gpu"
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        }
    });

    client.on("qr", (qr) => {
        console.log("Scan the QR code available at the service URL to log in.");
        latestQR = qr;
        qrcode.generate(qr, { small: true });
    });

    client.on("remote_session_saved", () => {
        console.log("Session saved to Redis!");
    });

    client.on("ready", () => {
        console.log("WhatsApp Bot is ready!");
        latestQR = null; // Clear QR once ready
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
