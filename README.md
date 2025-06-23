# ULTRASOLX - Universal AI Telegram Bot

A powerful Telegram bot that integrates multiple AI providers with fallback support and image generation capabilities.

## 🚀 Features

- **Multiple AI Providers**: Gemini, Groq, Together AI, OpenRouter, Pawan, Vanna
- **Automatic Fallback**: If one provider fails, automatically tries the next
- **Image Generation**: High-quality images using Stability AI
- **Memory Management**: Remembers conversation context
- **Rate Limiting**: Prevents spam and API abuse
- **Error Recovery**: Robust error handling and recovery

## 📦 Installation

1. **Clone or download the project files**

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your API keys in the `.env` file

4. **Test your API keys:**
   \`\`\`bash
   npm run test
   \`\`\`

5. **Start the bot:**
   \`\`\`bash
   npm start
   \`\`\`

## 🔧 Configuration

### Required API Keys

1. **Telegram Bot Token**: Get from [@BotFather](https://t.me/botfather)
2. **Gemini API**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Groq API**: Get from [Groq Console](https://console.groq.com/keys)
4. **Together AI**: Get from [Together AI](https://api.together.xyz/settings/api-keys)
5. **OpenRouter**: Get from [OpenRouter](https://openrouter.ai/keys)
6. **Stability AI**: Get from [Stability AI](https://platform.stability.ai/account/keys)

### Optional Keys
- **Pawan API**: For additional AI models
- **Vanna API**: For specialized responses

## 🤖 Bot Commands

- `/start` - Welcome message and bot introduction
- `/help` - Detailed help and usage instructions
- `/image <prompt>` - Generate an image from text
- `/clear` - Clear conversation memory
- `/stats` - Show your usage statistics

## 💬 Usage Examples

**Regular Chat:**
\`\`\`
User: Hello, how are you?
Bot: Hello! I'm doing great, thanks for asking! How can I help you today?
\`\`\`

**Image Generation:**
\`\`\`
User: /image a beautiful sunset over mountains
Bot: [Generated Image]
\`\`\`

**Alternative Image Commands:**
\`\`\`
User: nsfw: your prompt here
User: prompt: your creative idea
\`\`\`

## 🛠️ Scripts

- `npm start` - Start the bot with auto-restart
- `npm run test` - Test all API keys
- `npm run dev` - Start with nodemon for development

## 📊 Monitoring

The bot includes built-in monitoring:
- Request counting per user
- Provider success/failure tracking
- Memory usage monitoring
- Error logging

## 🔒 Security Features

- Rate limiting (1 request per second per user)
- Input validation
- Error message sanitization
- Graceful shutdown handling

## 🐛 Troubleshooting

**Bot not responding:**
1. Check if your Telegram bot token is correct
2. Run `npm run test` to verify API keys
3. Check console logs for error messages

**API errors:**
1. Verify your API keys are valid and have credits
2. Check rate limits on your API accounts
3. Try different providers if one is down

**Image generation fails:**
1. Check Stability AI API key and credits
2. Try simpler prompts
3. Wait a moment and try again

## 📝 Logs

The bot logs all activities:
- ✅ Successful API calls
- ❌ Failed API calls with reasons
- 🔄 Provider switching
- 📊 Usage statistics

## 🚀 Deployment

For production deployment:

1. **VPS/Server:**
   \`\`\`bash
   git clone your-repo
   cd ultrasolx-bot
   npm install
   npm start
   \`\`\`

2. **PM2 (Process Manager):**
   \`\`\`bash
   npm install -g pm2
   pm2 start enhanced-bot-fixed.js --name "ultrasolx"
   pm2 save
   pm2 startup
   \`\`\`

3. **Docker:**
   \`\`\`bash
   docker build -t ultrasolx-bot .
   docker run -d --env-file .env ultrasolx-bot
   \`\`\`

## 📄 License

MIT License - feel free to modify and distribute!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Test your API keys with `npm run test`
4. Open an issue with detailed error information

---

**Made with ❤️ by Godspower & Enhanced by AI**
\`\`\`

Now create a simple Dockerfile for containerization:
