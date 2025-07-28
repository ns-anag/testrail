# Phase 1 Implementation Plan: Essential CRUD Operations

## Sprint Overview
**Duration**: 2 weeks
**Goal**: Implement 15-20 essential TestRail API endpoints for core CRUD operations
**Current Coverage**: 6 endpoints → Target: 25+ endpoints

## Specific Endpoints to Implement

### Test Case Management (8 endpoints)
1. **`add_case`** - Create new test case
   - Method: POST
   - Endpoint: `add_case/:section_id`
   - Parameters: `{ section_id, title, template_id?, type_id?, priority_id?, estimate?, refs?, custom_fields? }`

2. **`update_case`** - Update existing test case
   - Method: POST  
   - Endpoint: `update_case/:case_id`
   - Parameters: `{ case_id, title?, template_id?, type_id?, priority_id?, estimate?, refs?, custom_fields? }`

3. **`delete_case`** - Delete test case
   - Method: POST
   - Endpoint: `delete_case/:case_id`
   - Parameters: `{ case_id }`

4. **`get_cases`** - Get cases with filtering
   - Method: GET
   - Endpoint: `get_cases/:project_id`
   - Parameters: `{ project_id, suite_id?, section_id?, created_after?, created_before?, created_by?, milestone_id?, priority_id?, type_id?, updated_after?, updated_before?, updated_by? }`

5. **`get_case_fields`** - Get custom fields for test cases
   - Method: GET
   - Endpoint: `get_case_fields`
   - Parameters: `{}`

6. **`get_case_types`** - Get available case types
   - Method: GET
   - Endpoint: `get_case_types`
   - Parameters: `{}`

7. **`get_case_statuses`** - Get available case statuses
   - Method: GET
   - Endpoint: `get_case_statuses`
   - Parameters: `{}`

8. **`get_priorities`** - Get available priorities
   - Method: GET
   - Endpoint: `get_priorities`
   - Parameters: `{}`

### Test Results Management (4 endpoints)
9. **`add_result`** - Add result for specific test
   - Method: POST
   - Endpoint: `add_result/:test_id`
   - Parameters: `{ test_id, status_id, comment?, version?, elapsed?, defects?, custom_fields? }`

10. **`add_result_for_case`** - Add result for case in run
    - Method: POST
    - Endpoint: `add_result_for_case/:run_id/:case_id`
    - Parameters: `{ run_id, case_id, status_id, comment?, version?, elapsed?, defects?, custom_fields? }`

11. **`add_results`** - Bulk add results for run
    - Method: POST
    - Endpoint: `add_results/:run_id`
    - Parameters: `{ run_id, results: [{ test_id, status_id, comment?, version?, elapsed?, defects?, custom_fields? }] }`

12. **`get_result_fields`** - Get custom fields for results
    - Method: GET
    - Endpoint: `get_result_fields`
    - Parameters: `{}`

### Test Run Management (4 endpoints)
13. **`add_run`** - Create new test run
    - Method: POST
    - Endpoint: `add_run/:project_id`
    - Parameters: `{ project_id, suite_id?, name, description?, milestone_id?, assignedto_id?, include_all?, case_ids? }`

14. **`update_run`** - Update test run
    - Method: POST
    - Endpoint: `update_run/:run_id`
    - Parameters: `{ run_id, name?, description?, milestone_id?, include_all?, case_ids? }`

15. **`delete_run`** - Delete test run
    - Method: POST
    - Endpoint: `delete_run/:run_id`
    - Parameters: `{ run_id }`

16. **`get_run`** - Get single test run
    - Method: GET
    - Endpoint: `get_run/:run_id`
    - Parameters: `{ run_id }`

### Section Management (3 endpoints)
17. **`get_sections`** - Get sections for project
    - Method: GET
    - Endpoint: `get_sections/:project_id`
    - Parameters: `{ project_id, suite_id? }`

18. **`add_section`** - Create new section
    - Method: POST
    - Endpoint: `add_section/:project_id`
    - Parameters: `{ project_id, name, description?, suite_id?, parent_id? }`

19. **`update_section`** - Update section
    - Method: POST
    - Endpoint: `update_section/:section_id`
    - Parameters: `{ section_id, name?, description? }`

### System Information (2 endpoints)
20. **`get_statuses`** - Get available test statuses
    - Method: GET
    - Endpoint: `get_statuses`
    - Parameters: `{}`

21. **`get_users`** - Get users for project
    - Method: GET
    - Endpoint: `get_users/:project_id`
    - Parameters: `{ project_id }`

## File-by-File Implementation Tasks

### 1. `server/index.ts` Changes

#### A. Add New Function Declarations
```typescript
// Add these to the existing tools array
const newFunctions: FunctionDeclaration[] = [
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
  }
];

// Update tools array
const tools: FunctionDeclaration[] = [
  // ... existing functions
  ...newFunctions
];
```

#### B. Expand makeTestRailApiCall Function
```typescript
const makeTestRailApiCall = async (functionName: string, args: any, settings: TestRailSettings) => {
  if (!settings) throw new Error("TestRail settings are not configured.");

  let endpoint = '';
  let method: 'GET' | 'POST' = 'GET';
  let body: any = null;

  switch (functionName) {
    // Existing cases...
    
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
      const caseParams = new URLSearchParams();
      if (args.suite_id) caseParams.set('suite_id', args.suite_id.toString());
      if (args.section_id) caseParams.set('section_id', args.section_id.toString());
      if (args.milestone_id) caseParams.set('milestone_id', args.milestone_id.toString());
      if (args.priority_id) caseParams.set('priority_id', args.priority_id.toString());
      if (args.type_id) caseParams.set('type_id', args.type_id.toString());
      if (args.created_by) caseParams.set('created_by', args.created_by.toString());
      if (args.updated_by) caseParams.set('updated_by', args.updated_by.toString());
      endpoint = `get_cases/${args.project_id}${caseParams.toString() ? '?' + caseParams.toString() : ''}`;
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
      const sectionParams = new URLSearchParams();
      if (args.suite_id) sectionParams.set('suite_id', args.suite_id.toString());
      endpoint = `get_sections/${args.project_id}${sectionParams.toString() ? '?' + sectionParams.toString() : ''}`;
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
```

#### C. Update System Instructions
```typescript
const systemInstruction = `You are an expert TestRail assistant with comprehensive API access for test case management, test execution, and project organization.

CORE CAPABILITIES:

TEST CASE MANAGEMENT:
- Create, read, update, and delete test cases (add_case, update_case, delete_case, get_case, get_cases)
- Search and filter test cases by project, suite, section, type, priority, milestone, and custom criteria
- Manage test case metadata including types, priorities, statuses, and custom fields
- Access case fields, types, statuses, and priorities for proper data validation

TEST EXECUTION:
- Add individual test results (add_result) or results for specific cases in runs (add_result_for_case)
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

Always provide clear, actionable information and ask for clarification when parameters are ambiguous.`;
```

### 2. `common/types.ts` Changes

#### Add New Type Definitions
```typescript
// Test Case Types
export interface TestCase {
  id: number;
  title: string;
  section_id: number;
  template_id: number;
  type_id: number;
  priority_id: number;
  milestone_id?: number;
  refs?: string;
  created_by: number;
  created_on: number;
  updated_by: number;
  updated_on: number;
  estimate?: string;
  estimate_forecast?: string;
  suite_id: number;
  custom_fields?: Record<string, any>;
}

export interface CaseField {
  id: number;
  is_active: boolean;
  type_id: number;
  name: string;
  system_name: string;
  label: string;
  description?: string;
  configs: any[];
  display_order: number;
}

export interface CaseType {
  id: number;
  name: string;
  is_default: boolean;
}

export interface CaseStatus {
  id: number;
  name: string;
  label: string;
  color_dark: number;
  color_medium: number;
  color_bright: number;
  is_default: boolean;
  is_untested?: boolean;
  is_system?: boolean;
}

export interface Priority {
  id: number;
  name: string;
  short_name: string;
  is_default: boolean;
  priority: number;
}

// Test Result Types
export interface TestResult {
  id: number;
  test_id: number;
  status_id: number;
  created_by: number;
  created_on: number;
  assignedto_id?: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  custom_fields?: Record<string, any>;
}

export interface ResultField {
  id: number;
  is_active: boolean;
  type_id: number;
  name: string;
  system_name: string;
  label: string;
  description?: string;
  configs: any[];
  display_order: number;
}

export interface TestStatus {
  id: number;
  name: string;
  label: string;
  color_dark: number;
  color_medium: number;
  color_bright: number;
  is_system: boolean;
  is_untested: boolean;
  is_final: boolean;
}

// Test Run Types  
export interface TestRun {
  id: number;
  suite_id: number;
  name: string;
  description?: string;
  milestone_id?: number;
  assignedto_id?: number;
  include_all: boolean;
  is_completed: boolean;
  completed_on?: number;
  config?: string;
  config_ids?: number[];
  passed_count: number;
  blocked_count: number;
  untested_count: number;
  retest_count: number;
  failed_count: number;
  project_id: number;
  plan_id?: number;
  entry_index?: number;
  entry_id?: string;
  created_on: number;
  created_by: number;
  refs?: string;
  url: string;
}

// Section Types
export interface Section {
  id: number;
  name: string;
  description?: string;
  suite_id?: number;
  parent_id?: number;
  display_order: number;
  depth: number;
}

// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  role_id: number;
  role: string;
}

// Parameter types for API calls
export interface AddCaseParams {
  section_id: number;
  title: string;
  template_id?: number;
  type_id?: number;
  priority_id?: number;
  estimate?: string;
  refs?: string;
  custom_fields?: Record<string, any>;
}

export interface UpdateCaseParams {
  case_id: number;
  title?: string;
  template_id?: number;
  type_id?: number;
  priority_id?: number;
  estimate?: string;
  refs?: string;
  custom_fields?: Record<string, any>;
}

export interface GetCasesParams {
  project_id: number;
  suite_id?: number;
  section_id?: number;
  created_after?: number;
  created_before?: number;
  created_by?: number;
  milestone_id?: number;
  priority_id?: number;
  template_id?: number;
  type_id?: number;
  updated_after?: number;
  updated_before?: number;
  updated_by?: number;
}

export interface AddResultParams {
  test_id: number;
  status_id: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  custom_fields?: Record<string, any>;
}

export interface AddResultForCaseParams {
  run_id: number;
  case_id: number;
  status_id: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  custom_fields?: Record<string, any>;
}

export interface AddRunParams {
  project_id: number;
  suite_id?: number;
  name: string;
  description?: string;
  milestone_id?: number;
  assignedto_id?: number;
  include_all?: boolean;
  case_ids?: number[];
}

export interface UpdateRunParams {
  run_id: number;
  name?: string;
  description?: string;
  milestone_id?: number;
  include_all?: boolean;
  case_ids?: number[];
}

export interface AddSectionParams {
  project_id: number;
  name: string;
  description?: string;
  suite_id?: number;
  parent_id?: number;
}

export interface UpdateSectionParams {
  section_id: number;
  name?: string;
  description?: string;
}
```

## Testing Strategy

### Manual Testing Checklist
1. **Test Case Management**
   - [ ] Create a new test case in existing section
   - [ ] Update test case title and properties
   - [ ] Search test cases with different filters
   - [ ] Delete test case and verify removal
   - [ ] Get case types, priorities, statuses, fields

2. **Test Results**
   - [ ] Add result for specific test
   - [ ] Add result for case in run
   - [ ] Verify result appears in TestRail
   - [ ] Test different status codes

3. **Test Runs**
   - [ ] Create new test run
   - [ ] Update test run properties
   - [ ] Delete test run
   - [ ] Verify run appears in project

4. **Sections**
   - [ ] Get sections for project
   - [ ] Create new section
   - [ ] Update section name/description

5. **System Data**
   - [ ] Get users for project
   - [ ] Get available statuses
   - [ ] Verify metadata consistency

### Error Handling Testing
- [ ] Test with invalid IDs
- [ ] Test with missing required parameters
- [ ] Test with insufficient permissions
- [ ] Test network timeouts
- [ ] Test malformed data

## Completion Criteria

### Phase 1 Success Metrics:
- [ ] All 21 endpoints implemented and functional
- [ ] Comprehensive error handling for all operations
- [ ] AI can create, read, update, and delete test cases
- [ ] AI can manage test results and runs effectively
- [ ] AI can organize tests using sections
- [ ] All operations tested with real TestRail instance

### Quality Gates:
- [ ] Code review completed
- [ ] Manual testing checklist completed
- [ ] Error scenarios handled gracefully
- [ ] Documentation updated
- [ ] Performance acceptable for typical operations

### Ready for Phase 2:
- [ ] Context persistence implementation ready
- [ ] Bulk operations foundation established
- [ ] Advanced filtering capabilities working
- [ ] User feedback incorporated
- [ ] Phase 2 planning completed

This implementation plan provides specific, actionable steps to expand our TestRail agent from 6 to 25+ endpoints, focusing on the most essential CRUD operations for comprehensive test management.
