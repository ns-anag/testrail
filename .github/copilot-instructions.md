# TestRail Agent - AI Coding Instructions

## Architecture Overview
This is a **unified single-service application** where a single Express server serves both the React frontend and backend API from the same container. The architecture eliminates CORS issues entirely by serving everything from one origin.

**Note**: The project is in transition from a dual-stack to unified architecture. Current implementation serves static files directly, with Express handling API routes. Unified static serving and Vite integration are planned.

### Core Philosophy
- **Simplicity**: Single container deployment eliminates deployment complexity
- **No CORS**: Same-origin serving prevents cross-origin issues entirely
- **Security**: Backend-only API key storage, user credentials never stored
- **Unified Experience**: One server, one port, one deployment unit

### Key Components
- **Unified Server**: Single Express server (`server/index.ts`) that serves static frontend files AND handles API routes
- **Frontend**: React app built with Vite for modern tooling and optimized production builds
- **Backend API**: Express routes under `/api/*` path for TestRail proxy and Gemini AI integration
- **Shared Types**: Common types in `common/types.ts` used by both frontend and backend

## Critical Development Patterns

### 1. Unified Service Architecture
- **Development**: Backend runs with tsx/nodemon, frontend served as static files
- **Production**: Single Express server serves pre-built frontend static files AND API endpoints
- **Build Process**:
  - `npm run dev` - Starts backend with hot reload using nodemon
  - `npm run build` - Compiles TypeScript backend to `dist/`
  - `npm start` - Runs unified production server from `dist/`
- **Future**: Architecture designed for Vite integration (config present, not yet implemented)

### 2. Static File Serving Pattern
- **Development**: Backend serves static HTML/JS files directly
- **Production**: Express serves optimized static assets
- **No Bundler**: Currently uses browser-native modules, ready for Vite upgrade
- **No CORS Issues**: Same-origin requests in both development and production

### 2. TestRail Integration Pattern
The server implements function calling for TestRail APIs through Gemini:
```typescript
// All TestRail calls go through makeTestRailApiCall()
const apiResponse = await makeTestRailApiCall(name, args, settings);
```

**Available Functions**: `get_projects`, `get_test_runs_for_project`, `get_tests_for_run`, `get_results_for_run`, `get_test_case`, `get_milestones_for_project`

### 3. Streaming Response Pattern
The `/api/chat` endpoint uses chunked responses for real-time AI streaming:
- System messages (Role.System) show API call status
- Model messages (Role.Model) contain actual AI responses
- Frontend filters out system messages after completion

### 4. Configuration Management
- **Local Dev**: `.env` file with `API_KEY` for Gemini
- **Production**: Google Cloud Secret Manager for API keys
- **Frontend**: Settings stored in component state, not persisted
- **Backend**: No credential storage - credentials passed per request

## Deployment Architecture

### Local Development
1. Backend runs on `http://localhost:3001` with nodemon hot reload
2. Frontend served directly from `index.html` at same origin
3. No CORS issues - same server handles both static files and API
4. Ready for Vite dev server integration (config exists)

### Production (Google Cloud Run)
1. **Single Container**: Unified app deployed to Cloud Run
2. **Static Assets**: Frontend served by Express from same container
3. **API Routes**: Same Express server handles `/api/*` endpoints
4. **Secrets**: Gemini API key managed via Secret Manager
5. **Port**: Single port (3001) serves everything

## File Structure Patterns

### Import Conventions
- **Backend**: `.js` extensions required for ES modules: `'../common/types.js'`
- **Frontend**: Modern ES module imports with Vite: `'./components/Header'`
- **Shared**: Types imported from `common/types` by both sides

### Component Organization
- `components/` - React components (Header, ChatWindow, MessageInput, Settings)
- `common/` - Shared TypeScript types
- `server/` - Express backend with TestRail proxy

### Configuration Files
- `tsconfig.server.json` - Backend-only TypeScript config (NodeNext modules)
- `tsconfig.json` - Frontend TypeScript config
- `nodemon.json` - Watches server/ and common/ directories
- `vite.config.ts` - Frontend dev server and build configuration

## Key Integration Points

### TestRail Authentication
Uses Basic Auth with base64 encoded `email:apiKey`. Connection verified via `/api/verify` endpoint before chat functionality is enabled.

### Gemini AI Function Calling
The backend defines `FunctionDeclaration[]` tools that map to TestRail API endpoints. Gemini decides when to call these functions based on user queries.

### Error Handling
- Network errors bubble up to frontend with user-friendly messages
- TestRail API errors include status codes and parsed error responses
- Streaming errors are handled gracefully without breaking the chat flow

## Development Workflow
1. Start with `npm run dev` for backend hot reload using nodemon
2. Open `index.html` directly in browser (served from localhost:3001)
3. Configure TestRail credentials in Settings panel
4. Backend automatically handles all TestRail API calls and AI processing
5. For production: `npm run build` compiles backend, deploy unified container
