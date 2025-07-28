
import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';

import { GoogleGenAI, Chat, FunctionDeclaration, Part, Type as GoogleGenAIType } from '@google/genai';
import { Message, Role, TestRailSettings } from '../common/types.js';

const app: Express = express();
const port = 3001;

// --- ENVIRONMENT CONFIGURATION ---
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// --- MIDDLEWARE ---
// Security middleware for production
if (isProduction) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
  }));
  app.use(compression()); // Gzip compression for production
  app.use(morgan('combined')); // Detailed logging for production
} else {
  app.use(morgan('dev')); // Simple logging for development
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- STATIC FILE SERVING ---
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the root directory in development
// In production, serve from dist/public built by Vite
// Auto-detect if we're running from dist/ (built mode)
const isBuiltMode = __dirname.includes('dist');
const staticDir = isProduction || isBuiltMode
  ? path.join(__dirname, '..', 'public')  // Production/Built: serve from dist/public (up one level from dist/server)
  : path.join(__dirname, '..');     // Development: serve from root

console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`Serving static files from: ${staticDir}`);

// Production: Serve static files with caching headers
if (isProduction) {
  app.use(express.static(staticDir, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        // Don't cache HTML files (for SPA routing)
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));
} else {
  // Development: Serve without caching
  app.use(express.static(staticDir));
}

// --- API ROUTES ---

// Health check endpoint for monitoring
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development'
  });
});

// Readiness check endpoint
app.get('/api/ready', (_req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// --- GEMINI & TESTRAIL SETUP ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY is not set. Please configure it in a .env file.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });


const tools: FunctionDeclaration[] = [
  // Existing functions
  {
    name: 'get_projects',
    description: 'Gets a list of all projects from TestRail.',
    parameters: { type: GoogleGenAIType.OBJECT, properties: {}, required: [] },
  },
  {
    name: 'get_test_runs_for_project',
    description: 'Gets a list of test runs for a specific project from TestRail with optional filtering.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: { 
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project in TestRail.' },
        created_after: { type: GoogleGenAIType.INTEGER, description: 'Only return test runs created after this date (as UNIX timestamp) (optional).' },
        created_before: { type: GoogleGenAIType.INTEGER, description: 'Only return test runs created before this date (as UNIX timestamp) (optional).' },
        created_by: { type: GoogleGenAIType.STRING, description: 'A comma-separated list of creators (user IDs) to filter by (optional).' },
        is_completed: { type: GoogleGenAIType.BOOLEAN, description: 'True to return completed test runs only. False to return active test runs only (optional).' },
        limit: { type: GoogleGenAIType.INTEGER, description: 'Limit the result to specified number of test runs (optional).' },
        offset: { type: GoogleGenAIType.INTEGER, description: 'Number of test runs to skip for pagination (optional).' },
        milestone_id: { type: GoogleGenAIType.STRING, description: 'A comma-separated list of milestone IDs to filter by (optional).' },
        refs_filter: { type: GoogleGenAIType.STRING, description: 'A single Reference ID to filter by (e.g. TR-a, 4291, etc.) (optional).' },
        suite_id: { type: GoogleGenAIType.STRING, description: 'A comma-separated list of test suite IDs to filter by (optional).' }
      },
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
      properties: { 
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project in TestRail.' },
        is_completed: { type: GoogleGenAIType.BOOLEAN, description: 'Filter by completion status (optional).' },
        is_started: { type: GoogleGenAIType.BOOLEAN, description: 'Filter by started status (optional).' }
      },
      required: ['project_id'],
    },
  },
  
  // Additional Test Run Management Functions
  {
    name: 'get_run',
    description: 'Gets details for a single test run.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run.' }
      },
      required: ['run_id']
    }
  },
  {
    name: 'add_run',
    description: 'Creates a new test run for a project.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project.' },
        name: { type: GoogleGenAIType.STRING, description: 'The name of the test run.' },
        suite_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test suite (optional if project is in single suite mode).' },
        description: { type: GoogleGenAIType.STRING, description: 'The description of the test run (optional).' },
        milestone_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the milestone to link to the test run (optional).' },
        assignedto_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the user the test run should be assigned to (optional).' },
        include_all: { type: GoogleGenAIType.BOOLEAN, description: 'True for including all test cases of the test suite and false for a custom case selection (default: true) (optional).' },
        case_ids: { type: GoogleGenAIType.ARRAY, description: 'An array of case IDs for the custom case selection (optional).', items: { type: GoogleGenAIType.INTEGER } },
        refs: { type: GoogleGenAIType.STRING, description: 'A comma-separated list of references/requirements (optional).' }
      },
      required: ['project_id', 'name']
    }
  },
  {
    name: 'update_run',
    description: 'Updates an existing test run.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run to update.' },
        name: { type: GoogleGenAIType.STRING, description: 'The new name of the test run (optional).' },
        description: { type: GoogleGenAIType.STRING, description: 'The new description of the test run (optional).' },
        milestone_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the milestone to link to the test run (optional).' },
        include_all: { type: GoogleGenAIType.BOOLEAN, description: 'True for including all test cases of the test suite and false for a custom case selection (optional).' },
        case_ids: { type: GoogleGenAIType.ARRAY, description: 'An array of case IDs for the custom case selection (optional).', items: { type: GoogleGenAIType.INTEGER } },
        refs: { type: GoogleGenAIType.STRING, description: 'A comma-separated list of references/requirements (optional).' }
      },
      required: ['run_id']
    }
  },
  {
    name: 'close_run',
    description: 'Closes a test run (marks as completed).',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run to close.' }
      },
      required: ['run_id']
    }
  },
  {
    name: 'delete_run',
    description: 'Deletes a test run permanently.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run to delete.' }
      },
      required: ['run_id']
    }
  },
  
  // Additional Milestone Management Functions
  {
    name: 'get_milestone',
    description: 'Gets details for a single milestone.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        milestone_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the milestone.' }
      },
      required: ['milestone_id']
    }
  },
  {
    name: 'add_milestone',
    description: 'Creates a new milestone in a project.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project.' },
        name: { type: GoogleGenAIType.STRING, description: 'The name of the milestone.' },
        description: { type: GoogleGenAIType.STRING, description: 'The description of the milestone (optional).' },
        due_on: { type: GoogleGenAIType.INTEGER, description: 'The due date of the milestone (as UNIX timestamp) (optional).' },
        parent_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the parent milestone for sub-milestones (optional).' },
        refs: { type: GoogleGenAIType.STRING, description: 'A comma-separated list of references/requirements (optional).' },
        start_on: { type: GoogleGenAIType.INTEGER, description: 'The scheduled start date of the milestone (as UNIX timestamp) (optional).' }
      },
      required: ['project_id', 'name']
    }
  },
  {
    name: 'update_milestone',
    description: 'Updates an existing milestone.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        milestone_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the milestone to update.' },
        name: { type: GoogleGenAIType.STRING, description: 'The new name of the milestone (optional).' },
        description: { type: GoogleGenAIType.STRING, description: 'The new description of the milestone (optional).' },
        due_on: { type: GoogleGenAIType.INTEGER, description: 'The due date of the milestone (as UNIX timestamp) (optional).' },
        parent_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the parent milestone for sub-milestones (optional).' },
        refs: { type: GoogleGenAIType.STRING, description: 'A comma-separated list of references/requirements (optional).' },
        start_on: { type: GoogleGenAIType.INTEGER, description: 'The scheduled start date of the milestone (as UNIX timestamp) (optional).' },
        is_completed: { type: GoogleGenAIType.BOOLEAN, description: 'Completion status (optional).' },
        is_started: { type: GoogleGenAIType.BOOLEAN, description: 'Started status (optional).' }
      },
      required: ['milestone_id']
    }
  },
  {
    name: 'delete_milestone',
    description: 'Deletes a milestone permanently.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        milestone_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the milestone to delete.' }
      },
      required: ['milestone_id']
    }
  },
  
  // Phase 1: Essential CRUD Operations
  
  // Test Case Management
  {
    name: 'add_case',
    description: 'Creates a new test case in the specified section.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        section_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the section to add the test case to.' },
        title: { type: GoogleGenAIType.STRING, description: 'The title of the test case.' },
        template_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the template to use (optional).' },
        type_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the case type (optional).' },
        priority_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the priority (optional).' },
        estimate: { type: GoogleGenAIType.STRING, description: 'The estimate for the test case (optional).' },
        refs: { type: GoogleGenAIType.STRING, description: 'References for the test case (optional).' }
      },
      required: ['section_id', 'title']
    }
  },
  {
    name: 'update_case',
    description: 'Updates an existing test case.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        case_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test case to update.' },
        title: { type: GoogleGenAIType.STRING, description: 'The new title of the test case (optional).' },
        template_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the template to use (optional).' },
        type_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the case type (optional).' },
        priority_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the priority (optional).' },
        estimate: { type: GoogleGenAIType.STRING, description: 'The estimate for the test case (optional).' },
        refs: { type: GoogleGenAIType.STRING, description: 'References for the test case (optional).' }
      },
      required: ['case_id']
    }
  },
  {
    name: 'delete_case',
    description: 'Deletes a test case permanently.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        case_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test case to delete.' }
      },
      required: ['case_id']
    }
  },
  {
    name: 'get_cases',
    description: 'Gets test cases for a project with optional filtering.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project.' },
        suite_id: { type: GoogleGenAIType.INTEGER, description: 'Filter by suite ID (optional).' },
        section_id: { type: GoogleGenAIType.INTEGER, description: 'Filter by section ID (optional).' },
        milestone_id: { type: GoogleGenAIType.INTEGER, description: 'Filter by milestone ID (optional).' },
        priority_id: { type: GoogleGenAIType.INTEGER, description: 'Filter by priority ID (optional).' },
        type_id: { type: GoogleGenAIType.INTEGER, description: 'Filter by case type ID (optional).' },
        created_by: { type: GoogleGenAIType.INTEGER, description: 'Filter by creator user ID (optional).' },
        updated_by: { type: GoogleGenAIType.INTEGER, description: 'Filter by last updater user ID (optional).' }
      },
      required: ['project_id']
    }
  },
  {
    name: 'get_case_fields',
    description: 'Gets available custom fields for test cases.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'get_case_types',
    description: 'Gets available test case types.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'get_case_statuses',
    description: 'Gets available test case statuses.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'get_priorities',
    description: 'Gets available priority levels for test cases.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {},
      required: []
    }
  },
  
  // Test Results Management
  {
    name: 'add_result',
    description: 'Adds a test result for a specific test.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        test_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test to add the result for.' },
        status_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test status (1=Passed, 2=Blocked, 3=Untested, 4=Retest, 5=Failed).' },
        comment: { type: GoogleGenAIType.STRING, description: 'A comment for the test result (optional).' },
        version: { type: GoogleGenAIType.STRING, description: 'The version tested (optional).' },
        elapsed: { type: GoogleGenAIType.STRING, description: 'The time elapsed for the test (optional, e.g., "5m" or "1h 20m").' },
        defects: { type: GoogleGenAIType.STRING, description: 'Defects associated with the test (optional).' }
      },
      required: ['test_id', 'status_id']
    }
  },
  {
    name: 'add_result_for_case',
    description: 'Adds a test result for a case in a specific run.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run.' },
        case_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test case.' },
        status_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test status (1=Passed, 2=Blocked, 3=Untested, 4=Retest, 5=Failed).' },
        comment: { type: GoogleGenAIType.STRING, description: 'A comment for the test result (optional).' },
        version: { type: GoogleGenAIType.STRING, description: 'The version tested (optional).' },
        elapsed: { type: GoogleGenAIType.STRING, description: 'The time elapsed for the test (optional, e.g., "5m" or "1h 20m").' },
        defects: { type: GoogleGenAIType.STRING, description: 'Defects associated with the test (optional).' }
      },
      required: ['run_id', 'case_id', 'status_id']
    }
  },
  {
    name: 'add_results',
    description: 'Bulk adds test results for a run.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run.' },
        results: {
          type: GoogleGenAIType.ARRAY,
          description: 'Array of test results to add.',
          items: {
            type: GoogleGenAIType.OBJECT,
            properties: {
              test_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test.' },
              status_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test status.' },
              comment: { type: GoogleGenAIType.STRING, description: 'A comment for the result (optional).' },
              version: { type: GoogleGenAIType.STRING, description: 'The version tested (optional).' },
              elapsed: { type: GoogleGenAIType.STRING, description: 'The time elapsed (optional).' },
              defects: { type: GoogleGenAIType.STRING, description: 'Associated defects (optional).' }
            },
            required: ['test_id', 'status_id']
          }
        }
      },
      required: ['run_id', 'results']
    }
  },
  {
    name: 'get_result_fields',
    description: 'Gets custom fields available for test results.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {},
      required: []
    }
  },
  
  // Test Run Management
  {
    name: 'add_run',
    description: 'Creates a new test run for a project.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project.' },
        suite_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test suite (optional).' },
        name: { type: GoogleGenAIType.STRING, description: 'The name of the test run.' },
        description: { type: GoogleGenAIType.STRING, description: 'The description of the test run (optional).' },
        milestone_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the milestone (optional).' },
        assignedto_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the user to assign the run to (optional).' },
        include_all: { type: GoogleGenAIType.BOOLEAN, description: 'True to include all test cases, false for custom selection (optional, defaults to true).' }
      },
      required: ['project_id', 'name']
    }
  },
  {
    name: 'update_run',
    description: 'Updates an existing test run.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run to update.' },
        name: { type: GoogleGenAIType.STRING, description: 'The new name of the test run (optional).' },
        description: { type: GoogleGenAIType.STRING, description: 'The new description of the test run (optional).' },
        milestone_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the milestone (optional).' },
        include_all: { type: GoogleGenAIType.BOOLEAN, description: 'True to include all test cases, false for custom selection (optional).' }
      },
      required: ['run_id']
    }
  },
  {
    name: 'delete_run',
    description: 'Deletes a test run permanently.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run to delete.' }
      },
      required: ['run_id']
    }
  },
  {
    name: 'get_run',
    description: 'Gets details for a single test run.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        run_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test run.' }
      },
      required: ['run_id']
    }
  },
  
  // Section Management
  {
    name: 'get_sections',
    description: 'Gets sections for a project and optionally for a specific suite.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project.' },
        suite_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the suite to filter by (optional).' }
      },
      required: ['project_id']
    }
  },
  {
    name: 'add_section',
    description: 'Creates a new section in a project.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project.' },
        name: { type: GoogleGenAIType.STRING, description: 'The name of the section.' },
        description: { type: GoogleGenAIType.STRING, description: 'The description of the section (optional).' },
        suite_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the suite (optional).' },
        parent_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the parent section (optional).' }
      },
      required: ['project_id', 'name']
    }
  },
  {
    name: 'update_section',
    description: 'Updates an existing section.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        section_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the section to update.' },
        name: { type: GoogleGenAIType.STRING, description: 'The new name of the section (optional).' },
        description: { type: GoogleGenAIType.STRING, description: 'The new description of the section (optional).' }
      },
      required: ['section_id']
    }
  },
  
  // System Information
  {
    name: 'get_statuses',
    description: 'Gets available test execution statuses.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'get_users',
    description: 'Gets users associated with a project.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project.' }
      },
      required: ['project_id']
    }
  },
  
  // Suite Management
  {
    name: 'get_suite',
    description: 'Gets details for a single test suite.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        suite_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test suite.' }
      },
      required: ['suite_id']
    }
  },
  {
    name: 'get_suites',
    description: 'Gets all test suites for a project.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project.' }
      },
      required: ['project_id']
    }
  },
  {
    name: 'add_suite',
    description: 'Creates a new test suite in a project.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        project_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the project.' },
        name: { type: GoogleGenAIType.STRING, description: 'The name of the test suite.' },
        description: { type: GoogleGenAIType.STRING, description: 'The description of the test suite (optional).' }
      },
      required: ['project_id', 'name']
    }
  },
  {
    name: 'update_suite',
    description: 'Updates an existing test suite.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        suite_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test suite to update.' },
        name: { type: GoogleGenAIType.STRING, description: 'The new name of the test suite (optional).' },
        description: { type: GoogleGenAIType.STRING, description: 'The new description of the test suite (optional).' }
      },
      required: ['suite_id']
    }
  },
  {
    name: 'delete_suite',
    description: 'Deletes a test suite permanently.',
    parameters: {
      type: GoogleGenAIType.OBJECT,
      properties: {
        suite_id: { type: GoogleGenAIType.INTEGER, description: 'The ID of the test suite to delete.' }
      },
      required: ['suite_id']
    }
  }
];


const makeTestRailApiCall = async (functionName: string, args: any, settings: TestRailSettings) => {
  if (!settings) throw new Error("TestRail settings are not configured.");

  let endpoint = '';
  let method: 'GET' | 'POST' = 'GET';
  let body: any = null;

  switch (functionName) {
    // Existing functions
    case 'get_projects':
      endpoint = 'get_projects';
      break;
    case 'get_test_runs_for_project': {
      // TestRail API uses & separator for filtering after path parameters
      let runsEndpoint = `get_runs/${args.project_id}`;
      const runFilters = [];
      
      if (args.created_after !== undefined && args.created_after !== null) {
        runFilters.push(`created_after=${args.created_after}`);
      }
      if (args.created_before !== undefined && args.created_before !== null) {
        runFilters.push(`created_before=${args.created_before}`);
      }
      if (args.created_by !== undefined && args.created_by !== null && args.created_by !== '') {
        runFilters.push(`created_by=${args.created_by}`);
      }
      if (args.is_completed !== undefined && args.is_completed !== null) {
        runFilters.push(`is_completed=${args.is_completed ? 1 : 0}`);
      }
      if (args.limit !== undefined && args.limit !== null) {
        runFilters.push(`limit=${args.limit}`);
      }
      if (args.offset !== undefined && args.offset !== null) {
        runFilters.push(`offset=${args.offset}`);
      }
      if (args.milestone_id !== undefined && args.milestone_id !== null && args.milestone_id !== '') {
        runFilters.push(`milestone_id=${args.milestone_id}`);
      }
      if (args.refs_filter !== undefined && args.refs_filter !== null && args.refs_filter !== '') {
        runFilters.push(`refs_filter=${args.refs_filter}`);
      }
      if (args.suite_id !== undefined && args.suite_id !== null && args.suite_id !== '') {
        runFilters.push(`suite_id=${args.suite_id}`);
      }
      
      if (runFilters.length > 0) {
        runsEndpoint += '&' + runFilters.join('&');
      }
      
      endpoint = runsEndpoint;
      break;
    }
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
      // TestRail API uses & separator for filtering after path parameters
      let milestonesEndpoint = `get_milestones/${args.project_id}`;
      const milestoneFilters = [];
      
      if (args.is_completed !== undefined && args.is_completed !== null) {
        milestoneFilters.push(`is_completed=${args.is_completed}`);
      }
      if (args.is_started !== undefined && args.is_started !== null) {
        milestoneFilters.push(`is_started=${args.is_started}`);
      }
      
      if (milestoneFilters.length > 0) {
        milestonesEndpoint += '&' + milestoneFilters.join('&');
      }
      
      endpoint = milestonesEndpoint;
      break;
      
    // Test Case Management
    case 'add_case':
      endpoint = `add_case/${args.section_id}`;
      method = 'POST';
      body = {
        title: args.title,
        ...(args.template_id && { template_id: args.template_id }),
        ...(args.type_id && { type_id: args.type_id }),
        ...(args.priority_id && { priority_id: args.priority_id }),
        ...(args.estimate && { estimate: args.estimate }),
        ...(args.refs && { refs: args.refs })
      };
      break;
      
    case 'update_case':
      endpoint = `update_case/${args.case_id}`;
      method = 'POST';
      body = {};
      if (args.title) body.title = args.title;
      if (args.template_id) body.template_id = args.template_id;
      if (args.type_id) body.type_id = args.type_id;
      if (args.priority_id) body.priority_id = args.priority_id;
      if (args.estimate) body.estimate = args.estimate;
      if (args.refs) body.refs = args.refs;
      break;
      
    case 'delete_case':
      endpoint = `delete_case/${args.case_id}`;
      method = 'POST';
      break;
      
    case 'get_cases':
      // TestRail API uses & separator for filtering after path parameters
      let casesEndpoint = `get_cases/${args.project_id}`;
      
      // Add filters to path using & separator
      if (args.suite_id !== undefined && args.suite_id !== null && args.suite_id !== '') {
        casesEndpoint += `&suite_id=${args.suite_id}`;
      }
      if (args.section_id !== undefined && args.section_id !== null && args.section_id !== '') {
        casesEndpoint += `&section_id=${args.section_id}`;
      }
      if (args.milestone_id !== undefined && args.milestone_id !== null && args.milestone_id !== '') {
        casesEndpoint += `&milestone_id=${args.milestone_id}`;
      }
      if (args.priority_id !== undefined && args.priority_id !== null && args.priority_id !== '') {
        casesEndpoint += `&priority_id=${args.priority_id}`;
      }
      if (args.type_id !== undefined && args.type_id !== null && args.type_id !== '') {
        casesEndpoint += `&type_id=${args.type_id}`;
      }
      if (args.created_by !== undefined && args.created_by !== null && args.created_by !== '') {
        casesEndpoint += `&created_by=${args.created_by}`;
      }
      if (args.updated_by !== undefined && args.updated_by !== null && args.updated_by !== '') {
        casesEndpoint += `&updated_by=${args.updated_by}`;
      }
      
      endpoint = casesEndpoint;
      break;
      
    case 'get_case_fields':
      endpoint = 'get_case_fields';
      break;
      
    case 'get_case_types':
      endpoint = 'get_case_types';
      break;
      
    case 'get_case_statuses':
      endpoint = 'get_case_statuses';
      break;
      
    case 'get_priorities':
      endpoint = 'get_priorities';
      break;
      
    // Test Results Management
    case 'add_result':
      endpoint = `add_result/${args.test_id}`;
      method = 'POST';
      body = {
        status_id: args.status_id,
        ...(args.comment && { comment: args.comment }),
        ...(args.version && { version: args.version }),
        ...(args.elapsed && { elapsed: args.elapsed }),
        ...(args.defects && { defects: args.defects })
      };
      break;
      
    case 'add_result_for_case':
      endpoint = `add_result_for_case/${args.run_id}/${args.case_id}`;
      method = 'POST';
      body = {
        status_id: args.status_id,
        ...(args.comment && { comment: args.comment }),
        ...(args.version && { version: args.version }),
        ...(args.elapsed && { elapsed: args.elapsed }),
        ...(args.defects && { defects: args.defects })
      };
      break;
      
    case 'add_results':
      endpoint = `add_results/${args.run_id}`;
      method = 'POST';
      body = {
        results: args.results
      };
      break;
      
    case 'get_result_fields':
      endpoint = 'get_result_fields';
      break;
      
    // Test Run Management
    case 'add_run':
      endpoint = `add_run/${args.project_id}`;
      method = 'POST';
      body = {
        name: args.name,
        ...(args.suite_id && { suite_id: args.suite_id }),
        ...(args.description && { description: args.description }),
        ...(args.milestone_id && { milestone_id: args.milestone_id }),
        ...(args.assignedto_id && { assignedto_id: args.assignedto_id }),
        ...(args.include_all !== undefined && { include_all: args.include_all })
      };
      break;
      
    case 'update_run':
      endpoint = `update_run/${args.run_id}`;
      method = 'POST';
      body = {};
      if (args.name) body.name = args.name;
      if (args.description) body.description = args.description;
      if (args.milestone_id) body.milestone_id = args.milestone_id;
      if (args.include_all !== undefined) body.include_all = args.include_all;
      break;
      
    case 'delete_run':
      endpoint = `delete_run/${args.run_id}`;
      method = 'POST';
      break;
      
    case 'get_run':
      endpoint = `get_run/${args.run_id}`;
      break;
      
    // Section Management
    case 'get_sections':
      // TestRail API uses & separator for filtering after path parameters
      let sectionsEndpoint = `get_sections/${args.project_id}`;
      if (args.suite_id !== undefined && args.suite_id !== null && args.suite_id !== '') {
        sectionsEndpoint += `&suite_id=${args.suite_id}`;
      }
      endpoint = sectionsEndpoint;
      break;
      
    case 'add_section':
      endpoint = `add_section/${args.project_id}`;
      method = 'POST';
      body = {
        name: args.name,
        ...(args.description && { description: args.description }),
        ...(args.suite_id && { suite_id: args.suite_id }),
        ...(args.parent_id && { parent_id: args.parent_id })
      };
      break;
      
    case 'update_section':
      endpoint = `update_section/${args.section_id}`;
      method = 'POST';
      body = {};
      if (args.name) body.name = args.name;
      if (args.description) body.description = args.description;
      break;
      
    // System Information
    case 'get_statuses':
      endpoint = 'get_statuses';
      break;
      
    case 'get_users':
      endpoint = `get_users/${args.project_id}`;
      break;
      
    // Suite Management
    case 'get_suite':
      endpoint = `get_suite/${args.suite_id}`;
      break;
      
    case 'get_suites':
      endpoint = `get_suites/${args.project_id}`;
      break;
      
    case 'add_suite':
      endpoint = `add_suite/${args.project_id}`;
      method = 'POST';
      body = {
        name: args.name,
        ...(args.description && { description: args.description })
      };
      break;
      
    case 'update_suite':
      endpoint = `update_suite/${args.suite_id}`;
      method = 'POST';
      body = {};
      if (args.name) body.name = args.name;
      if (args.description) body.description = args.description;
      break;
      
    case 'delete_suite':
      endpoint = `delete_suite/${args.suite_id}`;
      method = 'POST';
      break;
      
    // Additional Test Run Management Functions
    case 'get_run':
      endpoint = `get_run/${args.run_id}`;
      break;
      
    case 'add_run': {
      endpoint = `add_run/${args.project_id}`;
      method = 'POST';
      body = {
        name: args.name,
        ...(args.suite_id && { suite_id: args.suite_id }),
        ...(args.description && { description: args.description }),
        ...(args.milestone_id && { milestone_id: args.milestone_id }),
        ...(args.assignedto_id && { assignedto_id: args.assignedto_id }),
        ...(args.include_all !== undefined && { include_all: args.include_all }),
        ...(args.case_ids && { case_ids: args.case_ids }),
        ...(args.refs && { refs: args.refs })
      };
      break;
    }
      
    case 'update_run': {
      endpoint = `update_run/${args.run_id}`;
      method = 'POST';
      body = {};
      if (args.name) body.name = args.name;
      if (args.description) body.description = args.description;
      if (args.milestone_id) body.milestone_id = args.milestone_id;
      if (args.include_all !== undefined) body.include_all = args.include_all;
      if (args.case_ids) body.case_ids = args.case_ids;
      if (args.refs) body.refs = args.refs;
      break;
    }
      
    case 'close_run':
      endpoint = `close_run/${args.run_id}`;
      method = 'POST';
      break;
      
    case 'delete_run':
      endpoint = `delete_run/${args.run_id}`;
      method = 'POST';
      break;
      
    // Additional Milestone Management Functions  
    case 'get_milestone':
      endpoint = `get_milestone/${args.milestone_id}`;
      break;
      
    case 'add_milestone': {
      endpoint = `add_milestone/${args.project_id}`;
      method = 'POST';
      body = {
        name: args.name,
        ...(args.description && { description: args.description }),
        ...(args.due_on && { due_on: args.due_on }),
        ...(args.parent_id && { parent_id: args.parent_id }),
        ...(args.refs && { refs: args.refs }),
        ...(args.start_on && { start_on: args.start_on })
      };
      break;
    }
      
    case 'update_milestone': {
      endpoint = `update_milestone/${args.milestone_id}`;
      method = 'POST';
      body = {};
      if (args.name) body.name = args.name;
      if (args.description) body.description = args.description;
      if (args.due_on) body.due_on = args.due_on;
      if (args.parent_id) body.parent_id = args.parent_id;
      if (args.refs) body.refs = args.refs;
      if (args.start_on) body.start_on = args.start_on;
      if (args.is_completed !== undefined) body.is_completed = args.is_completed;
      if (args.is_started !== undefined) body.is_started = args.is_started;
      break;
    }
      
    case 'delete_milestone':
      endpoint = `delete_milestone/${args.milestone_id}`;
      method = 'POST';
      break;
      
    default:
      throw new Error(`Unknown function call: ${functionName}`);
  }

  const apiUrl = `${settings.url}/index.php?/api/v2/${endpoint}`;
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${settings.email}:${settings.apiKey}`)
    }
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(apiUrl, requestOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `TestRail API Error: ${functionName} failed with status ${response.status}.`;
    
    try {
      const errorJson = JSON.parse(errorBody);
      if (errorJson.error) {
        errorMessage += ` Message: "${errorJson.error}"`;
        
        // Add specific handling for common errors
        if (response.status === 400) {
          errorMessage += " Please check required parameters and data format.";
        } else if (response.status === 403) {
          errorMessage += " Insufficient permissions for this operation.";
        } else if (response.status === 404) {
          errorMessage += " The requested resource was not found.";
        }
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
              systemInstruction: `You are an expert TestRail assistant with comprehensive API access for test case management, test execution, and project organization.

CORE CAPABILITIES:

TEST CASE MANAGEMENT:
- Create, read, update, and delete test cases (add_case, update_case, delete_case, get_case, get_cases)
- Search and filter test cases by project, suite, section, type, priority, milestone, and custom criteria
- Manage test case metadata including types, priorities, statuses, and custom fields
- Access case fields, types, statuses, and priorities for proper data validation

TEST EXECUTION:
- Add individual test results (add_result) or results for specific cases in runs (add_result_for_case)
- Bulk add results for efficient test execution updates (add_results)
- Create, update, and delete test runs with flexible configuration options
- Track test progress and status changes with proper status codes (1=Passed, 2=Blocked, 3=Untested, 4=Retest, 5=Failed)
- Support custom result fields and detailed execution information

PROJECT ORGANIZATION:
- Manage sections within projects and suites (get_sections, add_section, update_section)
- Organize test cases hierarchically with parent-child section relationships
- Access project users and system configuration information

METADATA ACCESS:
- Get available case types, priorities, statuses, and custom fields
- Access user information for assignments and reporting
- Retrieve system configuration for proper API usage

CONTEXT AWARENESS:
When users mention project names, test run IDs, case IDs, or other entities from previous conversations, remember and use that context for subsequent operations. Always confirm critical actions like deletions before proceeding.

For status_id parameters, use these standard values:
- 1 = Passed
- 2 = Blocked  
- 3 = Untested
- 4 = Retest
- 5 = Failed

Available functions: ${tools.map(t => t.name).join(', ')}

Always provide clear, actionable information and ask for clarification when parameters are ambiguous.`,
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
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
});

// --- GRACEFUL SHUTDOWN ---
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});