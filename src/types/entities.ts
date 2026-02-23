// ─── IDP Entities ─────────────────────────────────────────────────────────────
export type IDPFieldGroup = 'identity' | 'financial' | 'payment' | 'tax';
export type MatchStatus = 'match' | 'mismatch' | 'unavailable' | 'pending';

export interface IDPEntity {
  fieldName: string;
  displayName: string;
  extractedValue: string;
  confidenceScore: number; // 0–100
  validated: boolean;
  corrected: boolean;
  originalValue?: string;
  correctedValue?: string;
  matchStatus: MatchStatus;
  policyValue?: string;
  group: IDPFieldGroup;
  required: boolean;
}

// ─── Policy Entities ───────────────────────────────────────────────────────────
export interface PolicyEntity {
  fieldName: string;
  displayName: string;
  value: string | number;
  retrievedAt: string;
  sourceSystem: string;
  category: string;
}

// ─── Workflow History ──────────────────────────────────────────────────────────
export interface WorkflowEvent {
  id: string;
  eventType: string;
  description: string;
  actor: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ─── Case ─────────────────────────────────────────────────────────────────────
export type TouchLevel = 'STP' | 'LOW' | 'MODERATE' | 'HIGH';
export type CaseStatus =
  | 'INTAKE'
  | 'IDP_PROCESSING'
  | 'PENDING_VALIDATION'
  | 'VALIDATION_COMPLETE'
  | 'TRIAGED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'NIGO';

export interface CaseRecord {
  id: string;
  policyNumber: string;
  ownerName: string;
  transactionType: string;
  transactionTypeKey: string;
  channelSource: string;
  status: CaseStatus;
  touchLevel?: TouchLevel;
  triageRuleMatched?: string;
  triageTimestamp?: string;
  assignedProcessor?: string;
  createdAt: string;
}

// ─── Transaction Type Registry ─────────────────────────────────────────────────
export interface TransactionTypeConfig {
  key: string;
  displayName: string;
  lineOfBusiness: 'Life' | 'Annuity' | 'Life / Annuity';
  idpTemplateRef: string;
  decisionTableRef: string;
  formLayoutRef: string;
  goodOrderChecklistRef: string;
  confidenceThresholds: {
    default: number;
    signature: number;
    amounts: number;
  };
}

// ─── Decision Table ───────────────────────────────────────────────────────────
export type EntitySource = 'IDP' | 'Policy' | 'Workflow';
export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'contains'
  | 'blank'
  | 'notblank'
  | 'any';

export interface EntityField {
  fieldName: string;
  displayName: string;
  entitySource: EntitySource;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'percent';
  description?: string;
  unit?: string;
}

export interface DecisionColumn {
  id: string;
  fieldName: string;
  displayName: string;
  entitySource: EntitySource;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'percent';
  unit?: string;
}

export interface DecisionCondition {
  id: string;
  columnId: string;
  fieldName: string;
  operator: ConditionOperator;
  value: string;
  value2?: string;
}

export interface DecisionRule {
  id: string;
  order: number;
  description?: string;
  conditions: DecisionCondition[];
  outputTouchLevel: TouchLevel;
  isDefault: boolean;
}

export interface DecisionTable {
  id: string;
  name: string;
  transactionTypeKey: string;
  version: string;
  status: 'draft' | 'active' | 'archived';
  columns: DecisionColumn[];
  rules: DecisionRule[];
}

// ─── Triage Evaluation ────────────────────────────────────────────────────────
export interface ConditionLog {
  conditionId: string;
  fieldName: string;
  displayName: string;
  operator: ConditionOperator;
  expectedValue: string;
  actualValue: string;
  passed: boolean;
}

export interface RuleEvaluationLog {
  ruleId: string;
  ruleOrder: number;
  description?: string;
  passed: boolean;
  isDefault: boolean;
  conditions: ConditionLog[];
}

export interface TriageResult {
  touchLevel: TouchLevel;
  matchedRuleId: string;
  matchedRuleOrder: number;
  matchedRuleDescription: string;
  keyFactors: string[];
  evaluationLog: RuleEvaluationLog[];
  timestamp: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────
export type IDPStatus = 'queued' | 'processing' | 'complete' | 'failed';

export interface CaseDocument {
  id: string;
  name: string;
  type: string;
  sizeMB: number;
  uploadedAt: string;
  idpStatus: IDPStatus;
  pageCount: number;
}

// ─── Good Order Checklist ─────────────────────────────────────────────────────
export type CheckStatus = 'pass' | 'fail' | 'pending';

export interface GoodOrderCheck {
  id: string;
  description: string;
  status: CheckStatus;
  required: boolean;
  category: string;
  notes?: string;
}

// ─── Financial Calculator ─────────────────────────────────────────────────────
export interface LoanCalculation {
  requestedAmount: number;
  existingLoanBalance: number;
  interestRate: number;
  maxAvailable: number;
  netDisbursement: number;
  projectedLoanBalance: number;
  annualInterestAccrual: number;
  policyLoanPercentage: number;
}

export interface WithdrawalCalculation {
  requestedAmount: number;
  accountValue: number;
  freeWithdrawalAmount: number;
  surrenderChargeRate: number;
  surrenderChargeAmount: number;
  federalWithholding: number;
  netDistribution: number;
  remainingFreeWithdrawal: number;
}
