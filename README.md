# TestRail Agent

This is a sleek and responsive chat application that allows users to interact with a powerful AI agent powered by the Google Gemini API. The agent can connect directly to your TestRail instance to fetch live data about test executions and answer your questions in a natural, conversational way.

The application is built as a single, unified service, with a React frontend and a Node.js Express backend served from the same container.

## Architecture

For a detailed explanation of how the frontend, backend, and external services interact, please see the [Architecture.md](Architecture.md) file.

## Features

- **Unified Application:** A single Node.js server provides both the frontend and the backend API, simplifying deployment and eliminating CORS issues.
- **Conversational AI:** Powered by Google's `gemini-2.5-flash` model for fast and intelligent responses.
- **Live TestRail Integration:** Connects to your TestRail instance to get up-to-date information.
- **Function Calling:** Uses the Gemini API's function calling capability to query the TestRail API for specific data based on your questions.
- **Secure Connection:** Uses your TestRail email and an API Key for authentication. Credentials are not stored permanently.
- **Modern Tooling:** Built with Vite for a fast development experience and a highly optimized production build.
- **Real-time Streaming:** AI responses are streamed back for a fluid user experience.
- **Responsive Design:** The interface is built with Tailwind CSS and works great on all screen sizes.


## Local Development

### 1. Prerequisites
- Node.js (v18 or later)
- npm

### 2. Setup

1.  **Install Dependencies:** Open a terminal in the project root and run:
    ```bash
    npm install
    ```
2.  **Create Environment File:** Create a file named `.env` in the root of the project. This file will hold your Google Gemini API key. Add the following line to it:
    ```
    API_KEY=your_google_gemini_api_key
    ```
    Replace `your_google_gemini_api_key` with your actual key.

    **Important:** Make sure the key in your `.env` file is named exactly `API_KEY`, as the server code expects this specific name.

### 3. Running the Application

Start both the frontend and backend servers in development mode with a single command:
```bash
npm run dev
```
This command will:
- Start the backend server on `http://localhost:3001`.
- Start the Vite development server for the frontend on `http://localhost:5173`.
- Open your browser to `http://localhost:5173`, where you can use the app.

API requests from the frontend will be automatically proxied to the backend, so you won't have any CORS issues.

### 4. Using the App

1. When the app loads, the settings panel will appear.
2. Fill in your TestRail URL, email, and API key.
3. Click **Save & Connect**.
4. Once your credentials are verified, the message input will become active, and you can start chatting.

---

## Deployment to Google Cloud

This guide explains how to deploy the unified application to **Google Cloud Run**, a fully managed serverless platform.

### Prerequisites

1.  A Google Cloud Platform (GCP) project.
2.  The `gcloud` command-line tool installed and authenticated (`gcloud auth login`).
3.  Docker installed and running on your local machine.

### Deployment Steps

1.  **Enable APIs:** In your terminal, enable the necessary GCP services. Replace `[YOUR_PROJECT_ID]` with your actual GCP project ID.
    ```bash
    gcloud config set project [YOUR_PROJECT_ID]
    gcloud services enable run.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
    ```

2.  **Store API Key in Secret Manager:** For security, store your Gemini API key in Secret Manager.
    ```bash
    # Replace your_google_gemini_api_key with your actual key
    echo -n "your_google_gemini_api_key" | gcloud secrets create gemini-api-key --data-file=-
    ```

3.  **Create an Artifact Registry Repository:** This is where your Docker container image will be stored.
    ```bash
    gcloud artifacts repositories create testrail-agent-repo --repository-format=docker --location=us-central1
    ```

4.  **Build and Push the Container Image:** This command uses Google Cloud Build to execute the instructions in your `Dockerfile`, building your container image and pushing it to the Artifact Registry.
    ```bash
    gcloud builds submit --tag us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/testrail-agent-repo/testrail-agent:latest
    ```

5.  **Deploy to Cloud Run:** Deploy the container image to Cloud Run. This command does a few things:
    *   Creates a service named `testrail-agent`.
    *   Allows public (unauthenticated) access.
    *   Securely injects your Gemini API key from Secret Manager as the `API_KEY` environment variable.
    *   Specifies that the server listens on port 3001.

    ```bash
    gcloud run deploy testrail-agent \
      --image=us-central1-docker.pkg.dev/[YOUR_PROJECT_ID]/testrail-agent-repo/testrail-agent:latest \
      --region=us-central1 \
      --allow-unauthenticated \
      --set-secrets=API_KEY=gemini-api-key:latest \
      --port=3001
    ```
    After deployment, `gcloud` will provide a **Service URL**. You can now access your live application at this URL.
