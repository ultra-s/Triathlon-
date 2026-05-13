const axios = require("axios");

const BASE_URL = "https://api.mozosubz.xyz";

/**
 * Mozosubz API Service
 */
const mozoApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

const mozosubz = {
  // Authentication
  authenticate: async (whatsapp_phone) => {
    const res = await mozoApi.post("/api/whatsapp/authenticate", { whatsapp_phone });
    return res.data;
  },

  // Data Services
  getDataPlans: async (serviceID) => {
    const res = await mozoApi.post("/api/whatsapp/data/plans", { serviceID });
    return res.data;
  },

  purchaseData: async (whatsappPhone, serviceID, phone, value, amount) => {
    const res = await mozoApi.post("/api/whatsapp/data/purchase", {
      whatsappPhone,
      serviceID,
      phone,
      value,
      amount,
    });
    return res.data;
  },

  // Cable Services
  getCablePlans: async (provider) => {
    const res = await mozoApi.post("/api/whatsapp/cable/plans", { provider });
    return res.data;
  },

  purchaseCable: async (whatsappPhone, provider, plan, customerId, amount) => {
    const res = await mozoApi.post("/api/whatsapp/cable/purchase", {
      whatsappPhone,
      provider,
      plan,
      customerId,
      amount,
    });
    return res.data;
  },

  // Electricity Services
  getElectricityPlans: async () => {
    const res = await mozoApi.post("/api/whatsapp/electricity/plans", {});
    return res.data;
  },

  purchaseElectricity: async (whatsappPhone, disco, customerId, amount) => {
    const res = await mozoApi.post("/api/whatsapp/electricity/purchase", {
      whatsappPhone,
      disco,
      customerId,
      amount,
    });
    return res.data;
  },

  // Wallet & Balance
  getBalance: async (whatsappPhone) => {
    const res = await mozoApi.post("/api/whatsapp/balance", { whatsappPhone });
    return res.data;
  },

  // Deposit Services
  initiateDeposit: async (whatsappPhone, amount, description) => {
    const res = await mozoApi.post("/api/whatsapp/deposit/initiate", {
      whatsappPhone,
      amount,
      description,
    });
    return res.data;
  },
};

module.exports = mozosubz;
