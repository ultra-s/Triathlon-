require("dotenv").config();
const axios = require("axios");
const { pool } = require("./db");
const mozosubz = require("./mozosubz-service");

const MODELS = [
  "openrouter/owl-alpha",
  "poolside/laguna-m.1:free",
  "baidu/qianfan-ocr-fast:free",
  "poolside/laguna-xs.2:free"
];

const SYSTEM_PROMPT = `
You are the Mozosubz Support Bot. Your purpose is to assist users with Mozosubz services: Airtime, Data, Cable TV, Electricity, and Wallet management.

CORE RULES:
1. ONLY discuss Mozosubz related topics.
2. If a user asks who you are, say: "I am the Mozosubz Support Bot."
3. DECLINE any request not related to Mozosubz services or Nigerian utility bills.
4. You have access to tools to perform actions. ALWAYS call the correct tool for the user's request.
5. Format all output beautifully for WhatsApp. Use emojis, bold text, and lists.
6. When checking plans or processing purchases, always verify information with the tools first.

MOZOSUBZ SERVICE INFO:
- Data Providers: mtn_sme, mtn_datashare, mtn_gifting, mtn_awoof, glo_data, airtel_sme, etc.
- Cable Providers: DSTV, GOTV, STARTIMES.
- Electricity: Various DISCOs (IKEDC, etc).
- Deposits: Users can fund their wallet via transfer to generated bank accounts.

Always be polite, professional, and helpful.
`.trim();

const TOOLS = [
  {
    name: "authenticate",
    description: "Resolve user profile and wallet balance",
    parameters: { type: "object", properties: { phone: { type: "string" } }, required: ["phone"] }
  },
  {
    name: "get_data_plans",
    description: "Get available data plans for a service ID",
    parameters: { type: "object", properties: { serviceID: { type: "string" } }, required: ["serviceID"] }
  },
  {
    name: "purchase_data",
    description: "Buy data for a specific phone number",
    parameters: { type: "object", properties: { serviceID: { type: "string" }, phone: { type: "string" }, value: { type: "string" }, amount: { type: "number" } }, required: ["serviceID", "phone", "value", "amount"] }
  },
  {
    name: "get_balance",
    description: "Check user wallet balance",
    parameters: { type: "object", properties: { phone: { type: "string" } }, required: ["phone"] }
  },
  {
    name: "initiate_deposit",
    description: "Generate bank details for wallet funding",
    parameters: { type: "object", properties: { amount: { type: "string" }, description: { type: "string" } }, required: ["amount"] }
  },
  {
    name: "get_cable_plans",
    description: "Get available cable TV plans (DSTV, GOTV, STARTIMES)",
    parameters: { type: "object", properties: { provider: { type: "string", enum: ["DSTV", "GOTV", "STARTIMES"] } }, required: ["provider"] }
  },
  {
    name: "purchase_cable",
    description: "Pay for cable TV subscription",
    parameters: { type: "object", properties: { provider: { type: "string" }, plan: { type: "string" }, customerId: { type: "string" }, amount: { type: "number" } }, required: ["provider", "plan", "customerId", "amount"] }
  },
  {
    name: "get_electricity_plans",
    description: "Get list of electricity distribution companies (DISCOs)",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "purchase_electricity",
    description: "Pay for electricity (prepaid/postpaid)",
    parameters: { type: "object", properties: { disco: { type: "string" }, customerId: { type: "string" }, amount: { type: "number" } }, required: ["disco", "customerId", "amount"] }
  }
];

async function getChatHistory(chatId) {
  const res = await pool.query(
    "SELECT role, content FROM chat_history WHERE chat_id = $1 ORDER BY created_at ASC LIMIT 10",
    [chatId]
  );
  return res.rows;
}

async function saveChatMessage(chatId, role, content) {
  pool.query(
    "INSERT INTO chat_history (chat_id, role, content) VALUES ($1, $2, $3)",
    [chatId, role, content]
  ).catch(err => console.error("[AI] History save failed:", err.message));
}

async function handleToolCall(toolCall, userPhone) {
  const { name, arguments: argsString } = toolCall;
  const args = JSON.parse(argsString);
  console.log(`[Tool] Calling: ${name}`, args);

  try {
    switch (name) {
      case "authenticate":
        return await mozosubz.authenticate(userPhone);
      case "get_data_plans":
        return await mozosubz.getDataPlans(args.serviceID);
      case "purchase_data":
        return await mozosubz.purchaseData(userPhone, args.serviceID, args.phone, args.value, args.amount);
      case "get_balance":
        return await mozosubz.getBalance(userPhone);
      case "initiate_deposit":
        return await mozosubz.initiateDeposit(userPhone, args.amount, args.description || "Wallet funding");
      case "get_cable_plans":
        return await mozosubz.getCablePlans(args.provider);
      case "purchase_cable":
        return await mozosubz.purchaseCable(userPhone, args.provider, args.plan, args.customerId, args.amount);
      case "get_electricity_plans":
        return await mozosubz.getElectricityPlans();
      case "purchase_electricity":
        return await mozosubz.purchaseElectricity(userPhone, args.disco, args.customerId, args.amount);
      default:
        return { error: "Unknown tool" };
    }
  } catch (err) {
    console.error(`[Tool] ${name} failed:`, err.message);
    return { error: "Service unavailable" };
  }
}

async function askOpenRouter(chatId, message, userPhone) {
  try {
    saveChatMessage(chatId, "user", message);
    const history = await getChatHistory(chatId);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message }
    ];

    let lastError = null;

    for (const model of MODELS) {
      try {
        console.log(`[AI] Trying ${model}...`);

        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
            messages,
            tools: TOOLS.map(t => ({ type: "function", function: t })),
            tool_choice: "auto"
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": "https://mozosubz.xyz",
              "X-Title": "Mozosubz Bot",
              "Content-Type": "application/json"
            },
            timeout: 25000
          }
        );

        const choice = response.data.choices?.[0];
        let reply = choice?.message?.content;
        const toolCalls = choice?.message?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          const toolResults = await Promise.all(toolCalls.map(tc => handleToolCall(tc.function, userPhone)));

          // Second call to process tool results
          const secondResponse = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              model,
              messages: [
                ...messages,
                choice.message,
                ...toolCalls.map((tc, i) => ({
                  role: "tool",
                  tool_call_id: tc.id,
                  name: tc.function.name,
                  content: JSON.stringify(toolResults[i])
                }))
              ]
            },
            {
              headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
              timeout: 20000
            }
          );
          reply = secondResponse.data.choices?.[0]?.message?.content;
        }

        if (reply && reply.trim()) {
          saveChatMessage(chatId, "assistant", reply);
          console.log(`[AI] Success: ${model}`);
          return reply;
        }
      } catch (error) {
        lastError = error;
        console.log(`[AI] ${model} failed (${error.response?.status || error.message})`);
        if (error.response?.status === 401) return "⚠️ API Key error.";
        continue;
      }
    }

    return `❌ Mozosubz service is busy. Please try again.`;
  } catch (err) {
    console.error("[AI] Fatal Error:", err.message);
    return "⚠️ System error. Please try again.";
  }
}

module.exports = { askOpenRouter };
