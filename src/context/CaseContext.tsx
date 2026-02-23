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
}

const CaseContext = createContext<CaseContextValue | null>(null);

function buildWithdrawalGoodOrderChecks(): GoodOrderCheck[] {
  return [
    { id: 'GOC-001', description: 'Contract is in Active status', status: 'pass', required: true, category: 'Eligibility' },
    { id: 'GOC-002', description: 'Withdrawal amount is within free withdrawal corridor', status: 'pass', required: true, category: 'Financial Validation' },
    { id: 'GOC-003', description: 'Owner identity verified against contract records', status: 'pass', required: true, category: 'Identity' },
    { id: 'GOC-004', description: 'Owner signature present and dated within 90 days', status: 'pass', required: true, category: 'Signature' },
    { id: 'GOC-005', description: 'Valid disbursement method provided', status: 'pass', required: true, category: 'Payment' },
    { id: 'GOC-006', description: 'Tax withholding election present', status: 'pass', required: true, category: 'Tax' },
  ];
}

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenarioState] = useState<DemoScenario>('loan');
  const [idpEntities, setIDPEntities] = useState<IDPEntity[]>([...LOAN_IDP_ENTITIES]);
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([...LOAN_WORKFLOW_EVENTS]);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [goodOrderChecks, setGoodOrderChecks] = useState<GoodOrderCheck[]>([...LOAN_GOOD_ORDER_CHECKS]);

  const setScenario = useCallback((s: DemoScenario) => {
    setScenarioState(s);
    setTriageResult(null);
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
