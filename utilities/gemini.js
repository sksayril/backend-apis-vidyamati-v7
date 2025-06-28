const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the models
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

class GeminiService {
  constructor() {
    this.chatHistory = new Map(); // In-memory chat history for active sessions
  }

  // Generate response for text-only chat
  async generateTextResponse(prompt, chatHistory = []) {
    try {
      // Filter and format chat history for Gemini
      let validHistory = [];
      
      for (let i = 0; i < chatHistory.length; i++) {
        const msg = chatHistory[i];
        if (msg.content && msg.content.trim()) {
          validHistory.push({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: String(msg.content).trim() }]
          });
        }
      }
      
      // Ensure the first message is from user
      if (validHistory.length > 0 && validHistory[0].role !== 'user') {
        validHistory = validHistory.slice(1);
      }
      
      // Ensure we have pairs (user -> model)
      const pairedHistory = [];
      for (let i = 0; i < validHistory.length - 1; i += 2) {
        if (validHistory[i].role === 'user' && validHistory[i + 1].role === 'model') {
          pairedHistory.push(validHistory[i], validHistory[i + 1]);
        }
      }

      // If no valid history, start a fresh chat
      if (pairedHistory.length === 0) {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }

      const chat = model.startChat({
        history: pairedHistory
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini Text Generation Error:', error);
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  // Generate response for image-based chat
  async generateImageResponse(prompt, imageBuffer, chatHistory = []) {
    try {
      if (!imageBuffer) {
        throw new Error('Image buffer is required');
      }

      // Convert image buffer to base64
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = 'image/jpeg'; // Default to JPEG

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      };

      // Prepare the prompt with image
      const promptParts = [
        { text: prompt },
        imagePart
      ];

      // If there's chat history, include it in the prompt
      if (chatHistory.length > 0) {
        const historyContext = this.buildPromptWithHistory(prompt, chatHistory);
        promptParts[0].text = historyContext;
      }

      const result = await visionModel.generateContent(promptParts);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Image Analysis Error:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  // Build prompt with chat history for vision model
  buildPromptWithHistory(currentPrompt, chatHistory) {
    const historyText = chatHistory
      .map(msg => `${msg.role === 'assistant' ? 'AI' : 'User'}: ${msg.content}`)
      .join('\n');
    
    return `
Previous conversation:
${historyText}

Current question: ${currentPrompt}

Please analyze the image and continue the conversation based on the previous context.`;
  }

  // Generate a title for the chat based on the first message
  async generateChatTitle(firstMessage) {
    try {
      const prompt = `Generate a short, descriptive title (max 6 words) for a chat that starts with this message: "${firstMessage}"`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Title Generation Error:', error);
      return 'New Chat'; // Fallback title
    }
  }
}

module.exports = new GeminiService(); 