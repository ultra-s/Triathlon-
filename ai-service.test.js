const { askOpenRouter } = require("./ai-service");
const axios = require("axios");

// Mock axios
jest.mock("axios");

describe("ai-service", () => {
  it("should return a response from OpenRouter", async () => {
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
  });

  it("should fallback to next model on failure", async () => {
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
