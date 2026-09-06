import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 10000;

app.use(express.json({ limit: '5mb' }));

// Lazy initialization of Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Reflection & Conversation Endpoint
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    const { prompt, title, mode = 'reflection', history = [] } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGemini();

    let systemInstruction = `You are a thoughtful, empathetic, and insightful AI journaling and reflection companion.
Your goal is to help the user explore their thoughts, feelings, ambitions, and challenges deeply.
Always maintain a warm, non-judgmental, grounded, and empowering tone. Format your response cleanly using Markdown.`;

    if (mode === 'reflection') {
      systemInstruction += `\nMode: Deep Reflection.
Offer thoughtful observations on what the user shared, gently highlight underlying patterns or cognitive reframing opportunities, and ask 1-2 powerful, open-ended questions to encourage deeper self-discovery.`;
    } else if (mode === 'brainstorm') {
      systemInstruction += `\nMode: Insight & Brainstorming.
Provide structured, creative ideas, diverse angles, potential solutions, and practical hypotheses. Group your insights with clear headings and bullet points.`;
    } else if (mode === 'summary') {
      systemInstruction += `\nMode: Executive Synthesis & Key Takeaways.
Provide a concise, crystal-clear synthesis of the key themes, emotional cues, decisions to make, and prioritized action points.`;
    } else {
      systemInstruction += `\nMode: Interactive Dialogue.
Engage in a rich, thoughtful dialogue with the user. Answer their questions, reflect on their statements, and keep the exploration flowing naturally.`;
    }

    // Build multi-turn content for generateContent
    const contents: any[] = [];

    // Add prior message history if available
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        if (msg && msg.content && typeof msg.content === 'string') {
          contents.push({
            role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    // Current turn prompt
    const contextPrefix = title ? `[Journal Context: "${title}"]\n\n` : '';
    contents.push({
      role: 'user',
      parts: [{ text: `${contextPrefix}${prompt}` }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text ?? '';
    res.json({ text });
  } catch (error: any) {
    console.error('Error generating reflection:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate reflection from Gemini',
    });
  }
});

// Structured Summarization Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const { title, content, messages = [] } = req.body;

    const ai = getGemini();

    let fullContext = `Journal Entry Title: ${title || 'Untitled'}\nEntry Content:\n${content || '(No initial text)'}\n\nConversation Turns:\n`;
    if (Array.isArray(messages)) {
      messages.forEach((m: any, idx: number) => {
        fullContext += `Turn ${idx + 1} (${m.role}): ${m.content}\n`;
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullContext,
      config: {
        systemInstruction: `You are an expert reflective summarizer. Analyze the journal entry and dialogue.
Extract a concise high-level summary (2-3 sentences), 3-5 key actionable takeaways or insights, and a brief emotional tone/vibe (e.g. "Grounded & Optimistic", "Contemplative & Seeking Clarity").
Return strictly JSON adhering to the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A 2-3 sentence thoughtful synthesis of the session',
            },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 3 to 5 core insights or actionable takeaways',
            },
            tone: {
              type: Type.STRING,
              description: 'Short phrase describing the emotional tone or theme',
            },
          },
          required: ['summary', 'keyTakeaways', 'tone'],
        },
      },
    });

    const rawText = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawText);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error summarizing journal entry:', error);
    res.status(500).json({
      error: error?.message || 'Failed to summarize journal entry',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Reflection Journal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
