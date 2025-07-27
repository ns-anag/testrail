
import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { GoogleGenAI, Chat, FunctionDeclaration, Part, Type as GoogleGenAIType } from '@google/genai';
import { Message, Role, TestRailSettings } from '../common/types.js';

const app: Express = express();
const port = 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());


// --- GEMINI & TESTRAIL SETUP ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY is not set. Please configure it in a .env file.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });


const tools: FunctionDeclaration[] = [
  {
    name: 'get_projects',
    description: 'Gets a list of all projects from TestRail.',
    parameters: { type: GoogleGenAIType.OBJECT, properties: {}, required: [] },
  },
  {
    name: 'get_test_runs_for_project',
    description: 'Gets a list of test runs for a specific project from TestRail.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: { project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project in TestRail.' } },
      required: ['project_id'],
    },
  },
  {
    name: 'get_tests_for_run',
    description: 'Gets a list of tests for a specific test run from TestRail.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: { run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run in TestRail.' } },
      required: ['run_id'],
    },
  },
  {
    name: 'get_results_for_run',
    description: 'Gets a list of results for a specific test run from TestRail.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: { run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run in TestRail.' } },
      required: ['run_id'],
    },
  },
  {
    name: 'get_test_case',
    description: 'Gets details for a specific test case from TestRail.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: { case_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test case in TestRail (e.g., C123).' } },
      required: ['case_id'],
    },
  },
  {
    name: 'get_milestones_for_project',
    description: 'Gets a list of milestones for a specific project from TestRail.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: { project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project in TestRail.' } },
      required: ['project_id'],
    },
  },
];


const makeTestRailApiCall = async (functionName: string, args: any, settings: TestRailSettings) => {
  if (!settings) throw new Error("TestRail settings are not configured.");

  let endpoint = '';
  switch (functionName) {
    case 'get_projects':
      endpoint = 'get_projects';
      break;
    case 'get_test_runs_for_project':
      endpoint = `get_runs/${args.project_id}`;
      break;
    case 'get_tests_for_run':
      endpoint = `get_tests/${args.run_id}`;
      break;
    case 'get_results_for_run':
      endpoint = `get_results_for_run/${args.run_id}`;
      break;
    case 'get_test_case':
      endpoint = `get_case/${args.case_id}`;
      break;
    case 'get_milestones_for_project':
      endpoint = `get_milestones/${args.project_id}`;
      break;
    default:
      throw new Error(`Unknown function call: ${functionName}`);
  }

  const apiUrl = `${settings.url}/index.php?/api/v2/${endpoint}`;

  const response = await fetch(apiUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${settings.email}:${settings.apiKey}`)
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `TestRail API Error: Status ${response.status}.`;
    try {
      const errorJson = JSON.parse(errorBody);
      if (errorJson.error) {
        errorMessage += ` Message: "${errorJson.error}"`;
      } else {
        errorMessage += ` Details: ${errorBody}`;
      }
    } catch (jsonError) {
      errorMessage += ` Details: ${errorBody}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// --- STATIC FILE SERVING ---
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the root directory in development
// In production, serve from dist/public built by Vite
const isProduction = process.env.NODE_ENV === 'production';
const staticDir = isProduction 
  ? path.join(__dirname, 'public')  // Production: serve from dist/public
  : path.join(__dirname, '..');     // Development: serve from root

console.log(`Serving static files from: ${staticDir}`);
app.use(express.static(staticDir));

// --- API ROUTES ---

app.post('/api/verify', async (req, res) => {
  const settings = req.body as TestRailSettings;
  try {
    await makeTestRailApiCall('get_projects', {}, settings);
    res.status(200).json({ message: 'Connection successful.' });
  } catch (error) {
    console.error('Verification failed:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});


app.post('/api/chat', async (req, res) => {
    const { message, history, settings } = req.body as { message: string, history: Message[], settings: TestRailSettings };
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
              tools: [{ functionDeclarations: tools }],
              systemInstruction: 'You are an expert on TestRail. You will answer questions about projects, test runs, test cases, and milestones. When a user asks for information, you must use the available tools to fetch live data. After receiving the data from the tool, present it to the user in a clear and readable format. Available tools are: get_projects, get_test_runs_for_project, get_tests_for_run, get_results_for_run, get_test_case, get_milestones_for_project.',
          },
          history: history.filter(m => m.role !== Role.System).map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
        });

        const initialResult = await chat.sendMessage({ message });
        const functionCall = initialResult.functionCalls?.[0];

        if (functionCall) {
            const { name, args } = functionCall;
            
            if (!name) {
                throw new Error('Function call missing name');
            }
            
            // Inform the client that we are making an API call
            const statusMessage = { role: Role.System, text: `Fetching data for ${name} from TestRail...` };
            res.write(JSON.stringify(statusMessage) + '\n');
            
            const apiResponse = await makeTestRailApiCall(name, args, settings);
            
            const functionResponsePart: Part = {
                functionResponse: {
                    name,
                    response: apiResponse,
                },
            };
            
            const stream = await chat.sendMessageStream({ message: [functionResponsePart] });

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if(chunkText) {
                    res.write(JSON.stringify({ role: Role.Model, text: chunkText }) + '\n');
                }
            }
        } else {
            // No function call, just send the text response
             res.write(JSON.stringify({ role: Role.Model, text: initialResult.text }) + '\n');
        }

    } catch (e) {
        console.error('Chat error:', e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred on the server.";
        res.write(JSON.stringify({ role: Role.Model, text: `Sorry, I've run into an issue: ${errorMessage}` }) + '\n');
    } finally {
        res.end();
    }
});

// --- SPA FALLBACK ---
// Serve index.html for all non-API routes (SPA routing)
app.get('*', (_req, res) => {
  const indexPath = isProduction 
    ? path.join(__dirname, 'public', 'index.html')
    : path.join(__dirname, '..', 'index.html');
  res.sendFile(indexPath);
});

// --- SERVER START ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});