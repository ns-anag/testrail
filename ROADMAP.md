# TestRail Agent - Architecture Roadmap

## Current State vs Target Architecture

### Current Implementation
- ✅ Express backend with TestRail API proxy
- ✅ Gemini AI integration with function calling
- ✅ React frontend with TypeScript
- ✅ ES modules configuration
- ✅ Basic streaming responses
- ✅ **COMPLETE**: Static file serving in Express
- ✅ **COMPLETE**: Vite integration for frontend build
- ✅ **COMPLETE**: Unified build process
- ✅ **COMPLETE**: Production static asset serving optimization
- ❌ **Missing**: Docker configuration

### Target Architecture (from Architecture.md)
- Single container deployment
- Vite-powered frontend development
- Express serves both API and static files
- Optimized production builds
- Docker containerization

## Implementation Roadmap

### Phase 1: Static File Serving ⚡ (High Priority)
**Goal**: Make Express serve frontend files to achieve unified architecture

**Tasks**:
1. Add static file serving middleware to Express
2. Update server to serve `index.html` as fallback
3. Test unified serving in development
4. Update development workflow

**Files to modify**:
- `server/index.ts` - Add express.static middleware
- Update instructions for accessing via backend URL

### Phase 2: Vite Integration 🔧 ✅ **COMPLETE**
**Goal**: Add modern frontend tooling with Vite

**Tasks**:
1. ✅ Install Vite and React plugin dependencies
2. ✅ Update package.json scripts for dual development servers
3. ✅ Configure Vite proxy for API requests
4. ✅ Update vite.config.ts with proper build configuration
5. ✅ Add frontend build to overall build process

**Results**:
- Modern Vite development server with HMR on port 5173
- Production builds to `dist/public/` directory
- Dual development workflow: `npm run dev` starts both servers
- Proxy configuration forwards `/api/*` to backend
- React runtime dependencies installed

**Dependencies to add**:
```json
"vite": "^5.0.0",
"@vitejs/plugin-react": "^4.0.0"
```

**Scripts to update**:
```json
"dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
"dev:backend": "nodemon",
"dev:frontend": "vite",
"build": "npm run build:frontend && npm run build:backend",
"build:frontend": "vite build",
"build:backend": "tsc -p tsconfig.server.json"
```

### Phase 3: Production Build Pipeline 📦 ✅ **COMPLETE**
**Goal**: Create optimized production builds

**Tasks**:
1. ✅ Configure Vite to build into `dist/public/`
2. ✅ Update Express to serve from `dist/public/` in production
3. ✅ Add build optimization (minification, compression)
4. ✅ Environment-specific configurations

**Results**:
- Production middleware: compression, helmet security, morgan logging
- Caching headers for static assets (1 year cache, no-cache for HTML)
- Health check endpoints: `/api/health` and `/api/ready`
- Graceful shutdown handling (SIGTERM/SIGINT)
- Optimized Vite builds: vendor chunking, minification, hash-based filenames
- Cross-platform environment variable support with cross-env
- Preview mode for local production testing

### Phase 4: Containerization 🐳 (Low Priority)
**Goal**: Create Docker deployment pipeline

**Tasks**:
1. Create Dockerfile for unified deployment
2. Add .dockerignore file
3. Configure multi-stage build (build + runtime)
4. Test local Docker deployment
5. Update Cloud Run deployment instructions

**Dockerfile structure**:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
# ... build both frontend and backend

# Runtime stage  
FROM node:18-alpine AS runtime
# ... copy built artifacts and run
```

### Phase 5: Production Optimizations 🚀 (Future)
**Goal**: Performance and deployment improvements

**Tasks**:
1. Add compression middleware
2. Configure caching headers
3. Add health check endpoints
4. Implement graceful shutdown
5. Add monitoring/logging

## Immediate Action Items

### Critical (Do Now)
1. **Add static file serving to Express** - This is the core architectural requirement
2. **Initialize git repository** - Version control for development
3. **Update .gitignore** - Proper file exclusions

### Next Sprint
1. Install and configure Vite
2. Update build pipeline
3. Test unified development workflow

### Future Iterations
1. Docker containerization
2. Cloud deployment automation
3. Performance optimizations

## Success Criteria

### Phase 1 Complete When:
- ✅ Single URL serves both frontend and API
- ✅ No CORS configuration needed
- ✅ Frontend accessible via backend port
- ✅ Static assets served correctly

### Phase 2 Complete When:
- ✅ `npm run dev` starts both servers
- ✅ HMR working for frontend development
- ✅ API requests proxied correctly
- ✅ Production build creates optimized assets

### Final Architecture Complete When:
- ✅ Single container deployment
- ✅ Optimized production builds
- ✅ Fast development experience
- ✅ Simplified deployment pipeline
- ✅ All architectural goals achieved

## Dependencies & Prerequisites

- Node.js 18+ (current: ✅)
- TypeScript (current: ✅)
- Express framework (current: ✅)
- React & build tools (partial: needs Vite)
- Docker (for containerization phase)
