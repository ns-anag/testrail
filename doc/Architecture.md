# TestRail Agent Architecture

This document outlines the architecture of the TestRail Agent application. It is designed as a single, unified web application that combines a modern React frontend with a Node.js backend, deployed in a single container.

## Core Philosophy

The primary architectural goal is simplicity and cohesiveness. By serving both the frontend and backend from the same Express server, we eliminate the complexity of managing separate deployments and completely avoid Cross-Origin Resource Sharing (CORS) issues.

## Architecture Diagram

```
+-----------------+      +--------------------------------+      +----------------------+
|                 |      |                                |      |                      |
|      User       |----->|      Google Cloud Run          |----->|   Google Gemini API  |
| (Web Browser)   |      |      (Single Container)        |      |                      |
+-----------------+      |                                |      +----------------------+
                         |  +--------------------------+  |
                         |  |    Node.js / Express     |  |
                         |  |--------------------------|  |      +----------------------+
                         |  | - Serves React Frontend  |  |      |                      |
                         |  | - Handles API (/api/*)   |----->|     TestRail API     |
                         |  +--------------------------+  |      |                      |
                         +--------------------------------+      +----------------------+

```

## Components

### 1. Frontend Client

-   **Framework:** React (using Vite for tooling).
-   **Styling:** Tailwind CSS for a modern, utility-first design.
-   **Functionality:** Provides the user interface, including the chat window and settings panel. All user interactions are handled here. When a user sends a message, the client makes a `fetch` request to its own backend at the `/api/chat` endpoint.

### 2. Backend Server

-   **Framework:** Node.js with Express.
-   **Responsibilities:**
    1.  **API Gateway:** It exposes all API endpoints under the `/api/` path (e.g., `/api/chat`, `/api/verify`). These endpoints are responsible for all business logic.
    2.  **Static File Server:** For any request that does not match an API endpoint, the server serves the built React frontend (`index.html` and its associated JS/CSS assets). This creates the unified application experience.
    3.  **Proxy & Security:** It is the only component that communicates with external services. It securely calls the **Google Gemini API** (using the server-side API key) and the **TestRail API** (using the user-provided credentials). This prevents any sensitive keys or CORS issues from being exposed to the browser.

### 3. External Services

-   **Google Gemini API:** The core AI model that provides conversational abilities and the intelligence to use function calling.
-   **TestRail API:** The source of truth for all project, test run, and case data. The backend queries this API on behalf of the user.

## Development vs. Production

### Local Development (`npm run dev`)

-   The `vite` dev server runs the frontend, providing features like Hot Module Replacement (HMR) for a fast feedback loop.
-   The Express backend server runs separately using `tsx`.
-   A proxy is configured in `vite.config.ts` to forward all `/api` requests from the frontend to the backend server, simulating the production environment and avoiding CORS.

### Production (`npm start` inside Docker)

-   The frontend is pre-built into a set of optimized, static HTML, JS, and CSS files.
-   The backend TypeScript code is compiled into plain JavaScript.
-   A single Express server is started. It serves the static frontend files and listens for API requests, all on the same port.
-   This entire built application is packaged into a single, lightweight Docker container and deployed to Google Cloud Run.
