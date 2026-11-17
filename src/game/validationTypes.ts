/** Shared shapes for level validation helpers. */
export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export type UnknownRecord = Record<string, unknown>;
export type IssueList = ValidationIssue[];
