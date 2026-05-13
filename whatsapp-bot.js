require("dotenv").config();
const { Client, RemoteAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { initDb } = require("./db");
const PostgresStore = require("./postgres-store");
const { askOpenRouter, clearMemory } = require("./ai-service");
const http = require("http");
const QRCode = require("qrcode");

let latestQR = null;
let botStatus = "Initializing...";
let clientReady = false;

// HTTP Dashboard
const server = http.createServer(async (req, res) => {
    if (req.url === "/qr" && latestQR) {
        try {
            const qrImage = await QRCode.toDataURL(latestQR);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;"><h1>Scan QR</h1><img src="${qrImage}" style="width:300px;" /><p>Refreshes every 10s</p><script>setTimeout(()=>location.reload(),10000);</script></body></html>`);
            return;
        } catch (err) {
            res.writeHead(500); res.end("QR Error"); return;
        }
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
        <h1>WhatsApp Bot Status</h1>
        <p>Status: <strong>${botStatus}</strong></p>
        ${latestQR ? '<a href="/qr" style="padding:10px 20px;background:#25D366;color:white;text-decoration:none;border-radius:5px;">Scan QR</a>' : (clientReady ? '<p style="color:green;">✅ Bot is Active</p>' : '<p>Initializing session...</p>')}
    </body></html>`);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`[Web] Dashboard on port ${PORT}`));

async function startBot() {
    console.log("[Bot] Initializing...");
    await initDb();

    // FIXED: Use a stable clientId. Changing this forces a logout.
    const store = new PostgresStore({ clientId: "ultrasolx-primary-v1" });

    const client = new Client({
        authStrategy: new RemoteAuth({
            clientId: "ultrasolx-primary-v1",
            store: store,
            backupSyncIntervalMs: 300000 // Every 5 mins for stability
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
                "--disable-gpu",
                "--disable-blink-features=AutomationControlled",
                "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        }
    });

    client.on("qr", (qr) => {
        latestQR = qr;
        botStatus = "Scan Required";
        console.log("[Bot] New QR code generated.");
        qrcode.generate(qr, { small: true });
    });

    client.on("authenticated", () => {
        console.log("[Bot] Authenticated.");
        botStatus = "Authenticated. Loading...";
    });

    client.on("ready", () => {
        console.log("[Bot] SUCCESS: Ready!");
        botStatus = "Online";
        clientReady = true;
        latestQR = null;
    });

    client.on("auth_failure", (msg) => {
        console.error("[Bot] Auth Failure:", msg);
        botStatus = "Auth Failed";
    });

    client.on("disconnected", (reason) => {
        console.log("[Bot] Disconnected:", reason);
        botStatus = "Disconnected";
        clientReady = false;
    });

    client.on("message", async (msg) => {
        try {
            if (msg.from === "status@broadcast" || !msg.body) return;
            const chat = await msg.getChat();
            if (chat.isGroup) return;

            console.log(`[Msg] From: ${msg.from}`);
            await chat.sendStateTyping();

            const reply = await askOpenRouter(msg.from, msg.body);
            await msg.reply(reply);
        } catch (err) {
            console.error("[Bot] Msg Error:", err.message);
        }
    });

    console.log("[Bot] Connecting to WhatsApp...");
    client.initialize();
}

process.on("unhandledRejection", (err) => console.error("[Fatal] Unhandled:", err));
process.on("uncaughtException", (err) => console.error("[Fatal] Uncaught:", err));

startBot().catch(err => {
    console.error("[Bot] Startup Error:", err);
    process.exit(1);
});
