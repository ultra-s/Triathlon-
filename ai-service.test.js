const { askOpenRouter } = require("./ai-service");
const axios = require("axios");
const { pool } = require("./db");

// Mock axios
jest.mock("axios");
// Mock db pool
jest.mock("./db", () => ({
  pool: {
    query: jest.fn()
  }
}));

describe("ai-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a response from OpenRouter and save to DB", async () => {
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 }); // for saveChatMessage and getChatHistory
    axios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: "Hello from AI"
            }
          }
        ]
      }
    });

    const reply = await askOpenRouter("test-chat", "Hi");
    expect(reply).toBe("Hello from AI");
    expect(pool.query).toHaveBeenCalledTimes(3); // save user, get history, save assistant
  });

  it("should fallback to next model on failure", async () => {
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
    axios.post
      .mockRejectedValueOnce(new Error("Rate limit"))
      .mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: "Fallback success"
              }
            }
          ]
        }
      });

    const reply = await askOpenRouter("test-chat-2", "Hi");
    expect(reply).toBe("Fallback success");
  });

  it("should handle tool calls correctly", async () => {
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

    // First response with a tool call
    axios.post.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_123",
                  function: {
                    name: "get_balance",
                    arguments: JSON.stringify({ phone: "2348000000000" })
                  }
                }
              ]
            }
          }
        ]
      }
    });

    // Mock mozosubz service
    const mozosubz = require("./mozosubz-service");
    jest.spyOn(mozosubz, "getBalance").mockResolvedValue({ balance: 5000 });

    // Second response after tool result
    axios.post.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: "Your balance is 5000 NGN"
            }
          }
        ]
      }
    });

    const reply = await askOpenRouter("test-chat-tools", "What is my balance?", "2348000000000");
    expect(reply).toBe("Your balance is 5000 NGN");
    expect(mozosubz.getBalance).toHaveBeenCalledWith("2348000000000");
    expect(axios.post).toHaveBeenCalledTimes(2);
  });
});
