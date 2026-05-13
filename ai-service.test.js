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
});
