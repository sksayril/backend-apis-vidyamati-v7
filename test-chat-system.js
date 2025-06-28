// Test script for Chat System
require('dotenv').config();

const geminiService = require('./utilities/gemini');

// Test data
const testChatHistory = [
  {
    role: 'user',
    content: 'Hello, how are you?',
    contentType: 'text',
    timestamp: new Date()
  },
  {
    role: 'assistant',
    content: 'I am doing well, thank you for asking! How can I help you today?',
    contentType: 'text',
    timestamp: new Date()
  }
];

async function testGeminiService() {
  console.log('🧪 Testing Gemini Service...\n');

  try {
    // Test 1: Simple text generation without history
    console.log('📝 Test 1: Simple text generation');
    const response1 = await geminiService.generateTextResponse('What is JavaScript?');
    console.log('✅ Response:', response1.substring(0, 100) + '...\n');

    // Test 2: Text generation with chat history
    console.log('📝 Test 2: Text generation with chat history');
    const response2 = await geminiService.generateTextResponse('Can you explain more about that?', testChatHistory);
    console.log('✅ Response:', response2.substring(0, 100) + '...\n');

    // Test 3: Chat title generation
    console.log('📝 Test 3: Chat title generation');
    const title = await geminiService.generateChatTitle('I need help with JavaScript programming');
    console.log('✅ Generated title:', title, '\n');

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testGeminiService(); 