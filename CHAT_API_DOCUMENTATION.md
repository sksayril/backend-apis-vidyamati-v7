# Chat AI API Documentation

This document describes the Chat AI system with Gemini integration that supports text, image, and PDF-based conversations.

## Overview

The Chat AI system provides a comprehensive solution for AI-powered conversations with the following features:

- **Unified chat interface**: Single endpoints handle text, image, and PDF content
- **Text-based chat**: Standard text conversations with AI
- **Image analysis**: Upload images and ask questions about them
- **PDF analysis**: Upload PDF documents and ask questions about their content
- **Chat history**: Persistent storage of all conversations
- **Context awareness**: AI remembers previous conversation context (last 5 messages)
- **Subscription-based access**: Requires active user subscription

## Authentication

All chat endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Start New Chat (Text, Image, or PDF)

**POST** `/api/chat/start`

Start a new conversation with the AI. Supports text, image, and PDF content.

**Request Body (multipart/form-data):**
- `message`: Text message (required)
- `image`: Image file (optional) - JPEG, PNG, GIF, WebP
- `pdf`: PDF file (optional) - Text-based PDFs work best

**Note:** Only one file type (image OR pdf) can be uploaded at a time. If no file is uploaded, it will be a text-only chat.

**Response:**
```json
{
  "message": "Chat started successfully",
  "chat": {
    "id": "chat_id_here",
    "title": "AI-generated title",
    "messages": [
      {
        "role": "user",
        "content": "What do you see in this image?",
        "contentType": "image",
        "files": [
          {
            "fileUrl": "https://s3.amazonaws.com/bucket/image.jpg",
            "fileName": "image.jpg",
            "fileType": "image"
          }
        ],
        "timestamp": "2024-01-01T00:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "AI response here...",
        "contentType": "text",
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 2. Continue Chat (Text, Image, or PDF)

**POST** `/api/chat/:chatId/message`

Continue an existing conversation with context from previous messages. Supports text, image, and PDF content.

**Parameters:**
- `chatId`: ID of the existing chat

**Request Body (multipart/form-data):**
- `message`: Text message (required)
- `image`: Image file (optional) - JPEG, PNG, GIF, WebP
- `pdf`: PDF file (optional) - Text-based PDFs work best

**Note:** Only one file type (image OR pdf) can be uploaded at a time. If no file is uploaded, it will be a text-only message.

**Response:**
```json
{
  "message": "Message sent successfully",
  "response": "AI response with context from previous messages",
  "chatId": "chat_id_here"
}
```

### 3. Get Chat History

**GET** `/api/chat/history`

Retrieve user's chat history with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "chats": [
    {
      "_id": "chat_id",
      "title": "Chat title",
      "lastActivity": "2024-01-01T00:00:00.000Z",
      "messages": [
        {
          "role": "user",
          "content": "User message",
          "contentType": "text",
          "timestamp": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 50
}
```

### 4. Get Specific Chat

**GET** `/api/chat/:chatId`

Retrieve a specific chat with all its messages.

**Parameters:**
- `chatId`: ID of the chat to retrieve

**Response:**
```json
{
  "chat": {
    "id": "chat_id_here",
    "title": "Chat title",
    "messages": [
      {
        "role": "user",
        "content": "User message",
        "contentType": "text",
        "files": [],
        "timestamp": "2024-01-01T00:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "AI response",
        "contentType": "text",
        "files": [],
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ],
    "lastActivity": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Update Chat Title

**PUT** `/api/chat/:chatId/title`

Update the title of a specific chat.

**Parameters:**
- `chatId`: ID of the chat

**Request Body:**
```json
{
  "title": "New chat title"
}
```

**Response:**
```json
{
  "message": "Chat title updated successfully",
  "title": "New chat title"
}
```

### 6. Archive Chat

**DELETE** `/api/chat/:chatId`

Archive (soft delete) a chat. The chat will no longer appear in the active chat list.

**Parameters:**
- `chatId`: ID of the chat to archive

**Response:**
```json
{
  "message": "Chat archived successfully"
}
```

### 7. Get Chat Statistics

**GET** `/api/chat/stats`

Get user's chat statistics and recent activity.

**Response:**
```json
{
  "totalChats": 25,
  "totalMessages": 150,
  "recentActivity": [
    {
      "_id": "chat_id",
      "title": "Recent chat title",
      "lastActivity": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400`: Bad Request (missing required fields, invalid data)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (subscription required)
- `404`: Not Found (chat not found)
- `500`: Internal Server Error

## File Upload Requirements

### Images
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum size: 10MB
- Recommended resolution: Up to 2048x2048 pixels

### PDFs
- Maximum size: 25MB
- Text-based PDFs work best
- Scanned PDFs may have limited text extraction

## Chat Context Management

The system maintains conversation context by:
- Storing the last 5 messages from each chat
- Passing this context to Gemini AI for more coherent responses
- Automatically generating chat titles based on the first message
- Tracking last activity for sorting and management
- Supporting mixed content types within the same conversation

## Database Schema

### Chat Model
```javascript
{
  userId: ObjectId,           // Reference to user
  title: String,              // Chat title
  messages: [MessageSchema],  // Array of messages
  isActive: Boolean,          // Soft delete flag
  lastActivity: Date,         // Last message timestamp
  createdAt: Date,
  updatedAt: Date
}
```

### Message Schema
```javascript
{
  role: String,               // 'user' or 'assistant'
  content: String,            // Message content
  contentType: String,        // 'text', 'image', or 'pdf'
  files: [FileSchema],        // Associated files
  timestamp: Date             // Message timestamp
}
```

### File Schema
```javascript
{
  fileUrl: String,            // S3 URL
  fileName: String,           // Original filename
  fileType: String            // File type
}
```

## Environment Variables

Required environment variables:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Rate Limiting

Consider implementing rate limiting for production use:
- Text chats: 100 requests per hour per user
- Image/PDF analysis: 50 requests per hour per user

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Users can only access their own chats
3. **File Validation**: Server validates file types and sizes
4. **Input Sanitization**: All user inputs are sanitized
5. **Subscription Check**: Active subscription required for all chat features

## Example Usage

### Starting a new text chat:
```javascript
const response = await fetch('/api/chat/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    message: 'Hello, I need help with JavaScript'
  })
});
```

### Starting a new chat with image:
```javascript
const formData = new FormData();
formData.append('message', 'What do you see in this image?');
formData.append('image', imageFile);

const response = await fetch('/api/chat/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

### Starting a new chat with PDF:
```javascript
const formData = new FormData();
formData.append('message', 'Can you summarize this document?');
formData.append('pdf', pdfFile);

const response = await fetch('/api/chat/start', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

### Continuing a conversation with text:
```javascript
const response = await fetch(`/api/chat/${chatId}/message`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    message: 'Can you explain that in more detail?'
  })
});
```

### Continuing a conversation with image:
```javascript
const formData = new FormData();
formData.append('message', 'What about this other image?');
formData.append('image', imageFile);

const response = await fetch(`/api/chat/${chatId}/message`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

### Continuing a conversation with PDF:
```javascript
const formData = new FormData();
formData.append('message', 'What are the key points in this document?');
formData.append('pdf', pdfFile);

const response = await fetch(`/api/chat/${chatId}/message`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

## Content Type Examples

### Mixed Conversation Flow:
1. **Start with text**: Ask a general question
2. **Add image**: Upload an image and ask about it
3. **Add PDF**: Upload a document and ask questions
4. **Continue with text**: Ask follow-up questions
5. **Add another image**: Upload another image for comparison

All within the same chat session, maintaining full context!

### Response Format Examples:

**Text-only response:**
```json
{
  "role": "assistant",
  "content": "JavaScript is a programming language...",
  "contentType": "text",
  "files": [],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Image analysis response:**
```json
{
  "role": "assistant",
  "content": "I can see a red car in the image...",
  "contentType": "text",
  "files": [],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**PDF analysis response:**
```json
{
  "role": "assistant",
  "content": "Based on the PDF content, the key points are...",
  "contentType": "text",
  "files": [],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
``` 