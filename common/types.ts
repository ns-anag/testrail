export enum Role {
  User = 'user',
  Model = 'model',
  System = 'system',
}

export interface Message {
  role: Role;
  text: string;
}

export interface TestRailSettings {
  url: string;
  email: string;
  apiKey: string;
}

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

// Suite Types
export interface Suite {
  id: number;
  name: string;
  description?: string;
  project_id: number;
  is_master: boolean;
  is_baseline: boolean;
  is_completed: boolean;
  completed_on?: number;
  url: string;
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

// Section Parameter Types
export interface GetSectionsParams {
  project_id: string | number;
  suite_id?: string | number;
}

export interface AddSectionParams {
  project_id: string | number;
  name: string;
  description?: string;
  suite_id?: string | number;
  parent_id?: string | number;
}

export interface UpdateSectionParams {
  section_id: string | number;
  name?: string;
  description?: string;
}

// Suite Parameter Types
export interface GetSuitesParams {
  project_id: string | number;
}

export interface AddSuiteParams {
  project_id: string | number;
  name: string;
  description?: string;
}

export interface UpdateSuiteParams {
  suite_id: string | number;
  name?: string;
  description?: string;
}

// User Parameter Types
