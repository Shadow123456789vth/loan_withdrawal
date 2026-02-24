import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  CaseRecord,
  IDPEntity,
  PolicyEntity,
  WorkflowEvent,
  CaseDocument,
  GoodOrderCheck,
  TriageResult,
  DecisionTable,
} from '../types/entities';
import {
  LOAN_CASE,
  LOAN_IDP_ENTITIES,
  LOAN_POLICY_ENTITIES,
  LOAN_WORKFLOW_EVENTS,
  LOAN_DOCUMENTS,
  LOAN_GOOD_ORDER_CHECKS,
  LOAN_DECISION_TABLE,
  WITHDRAWAL_CASE,
  WITHDRAWAL_IDP_ENTITIES,
  WITHDRAWAL_POLICY_ENTITIES,
  WITHDRAWAL_WORKFLOW_EVENTS,
  WITHDRAWAL_DOCUMENTS,
  WITHDRAWAL_DECISION_TABLE,
} from '../data/mockData';

export type DemoScenario = 'loan' | 'withdrawal';

interface CaseContextValue {
  scenario: DemoScenario;
  setScenario: (s: DemoScenario) => void;
  activeCase: CaseRecord;
  idpEntities: IDPEntity[];
  policyEntities: PolicyEntity[];
  workflowEvents: WorkflowEvent[];
  documents: CaseDocument[];
  goodOrderChecks: GoodOrderCheck[];
  decisionTable: DecisionTable;
  triageResult: TriageResult | null;
  setTriageResult: (r: TriageResult | null) => void;
  validateField: (fieldName: string, correctedValue?: string) => void;
  validateAllHighConfidence: () => void;
  addWorkflowEvent: (type: string, description: string) => void;
  getValidationProgress: () => { validated: number; total: number; pct: number };
  updateGoodOrderCheck: (id: string, status: 'pass' | 'fail' | 'pending') => void;
  resetScenario: () => void;
  // Live SN case — set after intake form creates a record in ServiceNow
  snSysId: string | null;
  snCaseNumber: string | null;
  setSNCase: (sysId: string, caseNumber: string) => void;
  // Override IDP entity extracted values with values fetched from ServiceNow
  hydrateSNFields: (snFields: Record<string, string>) => void;
}

const CaseContext = createContext<CaseContextValue | null>(null);

// Withdrawal IGO Checklist — 14 criteria from Wilton Reassurance Withdrawal Visio
function buildWithdrawalGoodOrderChecks(): GoodOrderCheck[] {
  return [
    // Contract Identification
    { id: 'GOC-001', description: 'Contract number present and matches records', status: 'pass', required: true, category: 'Contract Identification' },
    // Identity
    { id: 'GOC-002', description: "Owner name on form matches contract owner of record", status: 'pass', required: true, category: 'Identity' },
    { id: 'GOC-003', description: 'Owner SSN / TIN last 4 digits match contract records', status: 'pass', required: true, category: 'Identity' },
    // Distribution Selection
    { id: 'GOC-004', description: 'Full surrender or partial withdrawal clearly indicated (not both)', status: 'pass', required: true, category: 'Distribution' },
    { id: 'GOC-005', description: 'Distribution option clearly selected (one option only)', status: 'pass', required: true, category: 'Distribution' },
    { id: 'GOC-006', description: 'Dollar amount provided for specified amount option (Option 4)', status: 'pass', required: true, category: 'Distribution' },
    { id: 'GOC-007', description: 'Net or gross election present for specified amount withdrawal', status: 'pass', required: true, category: 'Distribution' },
    // Payment
    { id: 'GOC-008', description: 'Payment method selected (check / bank on file / direct deposit)', status: 'pass', required: true, category: 'Payment' },
    { id: 'GOC-009', description: 'ABA routing and account numbers provided for direct deposit', status: 'pass', required: true, category: 'Payment' },
    // Tax
    { id: 'GOC-010', description: 'Federal withholding election present', status: 'pass', required: true, category: 'Tax' },
    { id: 'GOC-011', description: 'Owner SSN / TIN provided for tax reporting', status: 'pass', required: true, category: 'Tax' },
    // Signature
    { id: 'GOC-012', description: 'Owner signature present in designated signature field', status: 'pass', required: true, category: 'Signature' },
    { id: 'GOC-013', description: 'Signature date within 6 months of receipt and not future-dated', status: 'pass', required: true, category: 'Signature' },
    // Form Integrity
    { id: 'GOC-014', description: 'Form completed in ink with no alterations or white-out', status: 'pending', required: true, category: 'Form Integrity', notes: 'Manual visual inspection required — original document on file' },
  ];
}

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenarioState] = useState<DemoScenario>('loan');
  const [idpEntities, setIDPEntities] = useState<IDPEntity[]>([...LOAN_IDP_ENTITIES]);
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([...LOAN_WORKFLOW_EVENTS]);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [goodOrderChecks, setGoodOrderChecks] = useState<GoodOrderCheck[]>([...LOAN_GOOD_ORDER_CHECKS]);
  const [snSysId, setSnSysId] = useState<string | null>(null);
  const [snCaseNumber, setSnCaseNumber] = useState<string | null>(null);

  const setSNCase = useCallback((sysId: string, caseNumber: string) => {
    setSnSysId(sysId);
    setSnCaseNumber(caseNumber);
  }, []);

  const setScenario = useCallback((s: DemoScenario) => {
    setScenarioState(s);
    setTriageResult(null);
    setSnSysId(null);
    setSnCaseNumber(null);
    if (s === 'loan') {
      setIDPEntities([...LOAN_IDP_ENTITIES]);
      setWorkflowEvents([...LOAN_WORKFLOW_EVENTS]);
      setGoodOrderChecks([...LOAN_GOOD_ORDER_CHECKS]);
    } else {
      setIDPEntities([...WITHDRAWAL_IDP_ENTITIES]);
      setWorkflowEvents([...WITHDRAWAL_WORKFLOW_EVENTS]);
      setGoodOrderChecks(buildWithdrawalGoodOrderChecks());
    }
  }, []);

  const validateField = useCallback((fieldName: string, correctedValue?: string) => {
    setIDPEntities((prev) =>
      prev.map((e) => {
        if (e.fieldName !== fieldName) return e;
        const wasCorrected = correctedValue !== undefined && correctedValue !== e.extractedValue;
        return {
          ...e,
          validated: true,
          corrected: wasCorrected,
          originalValue: wasCorrected ? e.extractedValue : e.originalValue,
          extractedValue: correctedValue ?? e.extractedValue,
        };
      })
    );
  }, []);

  const validateAllHighConfidence = useCallback(() => {
    const threshold = scenario === 'loan' ? 90 : 95;
    setIDPEntities((prev) =>
      prev.map((e) => (e.confidenceScore >= threshold ? { ...e, validated: true } : e))
    );
  }, [scenario]);

  const addWorkflowEvent = useCallback((type: string, description: string) => {
    const event: WorkflowEvent = {
      id: `WE-${Date.now()}`,
      eventType: type,
      description,
      actor: 'System',
      timestamp: new Date().toISOString(),
    };
    setWorkflowEvents((prev) => [...prev, event]);
  }, []);

  const getValidationProgress = useCallback(() => {
    const required = idpEntities.filter((e) => e.required);
    const validated = required.filter((e) => e.validated).length;
    const total = required.length;
    return { validated, total, pct: total > 0 ? Math.round((validated / total) * 100) : 0 };
  }, [idpEntities]);

  const updateGoodOrderCheck = useCallback((id: string, status: 'pass' | 'fail' | 'pending') => {
    setGoodOrderChecks((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }, []);

  const resetScenario = useCallback(() => {
    setScenario(scenario);
  }, [scenario, setScenario]);

  /**
   * Override IDP entity extractedValues with values loaded from ServiceNow.
   * Only updates entities whose fieldName appears as a key in `snFields`.
   * Empty/blank SN values are ignored so mock fallbacks remain intact.
   */
  const hydrateSNFields = useCallback((snFields: Record<string, string>) => {
    setIDPEntities((prev) =>
      prev.map((e) => {
        const snVal = snFields[e.fieldName];
        if (!snVal || !snVal.trim()) return e;
        return { ...e, extractedValue: snVal };
      })
    );
  }, []);

  const activeCase = scenario === 'loan' ? LOAN_CASE : WITHDRAWAL_CASE;
  const policyEntities = scenario === 'loan' ? LOAN_POLICY_ENTITIES : WITHDRAWAL_POLICY_ENTITIES;
  const documents = scenario === 'loan' ? LOAN_DOCUMENTS : WITHDRAWAL_DOCUMENTS;
  const decisionTable = scenario === 'loan' ? LOAN_DECISION_TABLE : WITHDRAWAL_DECISION_TABLE;

  return (
    <CaseContext.Provider
      value={{
        scenario,
        setScenario,
        activeCase,
        idpEntities,
        policyEntities,
        workflowEvents,
        documents,
        goodOrderChecks,
        decisionTable,
        triageResult,
        setTriageResult,
        validateField,
        validateAllHighConfidence,
        addWorkflowEvent,
        getValidationProgress,
        updateGoodOrderCheck,
        resetScenario,
        snSysId,
        snCaseNumber,
        setSNCase,
        hydrateSNFields,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCase(): CaseContextValue {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCase must be used within CaseProvider');
  return ctx;
}
