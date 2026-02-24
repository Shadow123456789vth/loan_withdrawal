import type {
  DecisionTable,
  DecisionRule,
  DecisionCondition,
  ConditionOperator,
  ConditionLog,
  RuleEvaluationLog,
  TriageResult,
  TouchLevel,
} from '../types/entities';

function evaluateCondition(
  condition: DecisionCondition,
  values: Record<string, string>,
): { passed: boolean; actualValue: string } {
  if (condition.operator === 'any') return { passed: true, actualValue: 'ANY' };

  const raw = values[condition.fieldName] ?? '';
  const actual = raw.trim();
  const expected = condition.value.trim();
  const expected2 = (condition.value2 ?? '').trim();

  const actualNum = parseFloat(actual.replace(/[^0-9.-]/g, ''));
  const expectedNum = parseFloat(expected.replace(/[^0-9.-]/g, ''));
  const expected2Num = parseFloat(expected2.replace(/[^0-9.-]/g, ''));

  let passed = false;

  switch (condition.operator as ConditionOperator) {
    case 'eq':
      passed = actual.toLowerCase() === expected.toLowerCase();
      break;
    case 'neq':
      passed = actual.toLowerCase() !== expected.toLowerCase();
      break;
    case 'gt':
      passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum > expectedNum;
      break;
    case 'gte':
      passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum >= expectedNum;
      break;
    case 'lt':
      passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum < expectedNum;
      break;
    case 'lte':
      passed = !isNaN(actualNum) && !isNaN(expectedNum) && actualNum <= expectedNum;
      break;
    case 'between':
      passed =
        !isNaN(actualNum) &&
        !isNaN(expectedNum) &&
        !isNaN(expected2Num) &&
        actualNum >= expectedNum &&
        actualNum <= expected2Num;
      break;
    case 'contains':
      passed = actual.toLowerCase().includes(expected.toLowerCase());
      break;
    case 'blank':
      passed = actual === '' || actual === 'None' || actual === 'N/A';
      break;
    case 'notblank':
      passed = actual !== '' && actual !== 'None' && actual !== 'N/A';
      break;
    default:
      passed = false;
  }

  return { passed, actualValue: actual || '(empty)' };
}

function operatorLabel(op: ConditionOperator): string {
  const labels: Record<ConditionOperator, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
    between: 'between',
    contains: 'contains',
    blank: 'is blank',
    notblank: 'is not blank',
    any: 'ANY',
  };
  return labels[op] ?? op;
}

export function evaluateDecisionTable(
  table: DecisionTable,
  values: Record<string, string>,
): TriageResult {
  const evaluationLog: RuleEvaluationLog[] = [];

  const columnMap: Record<string, { displayName: string }> = {};
  for (const col of table.columns) {
    columnMap[col.fieldName] = { displayName: col.displayName };
  }

  // Evaluate non-default rules top to bottom
  const nonDefaultRules = table.rules
    .filter((r) => !r.isDefault)
    .sort((a, b) => a.order - b.order);

  const defaultRule = table.rules.find((r) => r.isDefault);

  for (const rule of nonDefaultRules) {
    const conditionLogs: ConditionLog[] = [];
    let rulePassed = true;

    for (const cond of rule.conditions) {
      if (cond.operator === 'any') {
        conditionLogs.push({
          conditionId: cond.id,
          fieldName: cond.fieldName,
          displayName: columnMap[cond.fieldName]?.displayName ?? cond.fieldName,
          operator: cond.operator,
          expectedValue: 'ANY',
          actualValue: values[cond.fieldName] ?? '(empty)',
          passed: true,
        });
        continue;
      }

      const { passed, actualValue } = evaluateCondition(cond, values);
      if (!passed) rulePassed = false;

      const expectedDisplay =
        cond.operator === 'between'
          ? `${cond.value} – ${cond.value2}`
          : `${operatorLabel(cond.operator)} ${cond.value}`;

      conditionLogs.push({
        conditionId: cond.id,
        fieldName: cond.fieldName,
        displayName: columnMap[cond.fieldName]?.displayName ?? cond.fieldName,
        operator: cond.operator,
        expectedValue: expectedDisplay,
        actualValue,
        passed,
      });
    }

    evaluationLog.push({
      ruleId: rule.id,
      ruleOrder: rule.order,
      description: rule.description,
      passed: rulePassed,
      isDefault: false,
      conditions: conditionLogs,
    });

    if (rulePassed) {
      // Build key factors from failing conditions perspective (what triggered it)
      const keyFactors = conditionLogs
        .filter((c) => c.operator !== 'any')
        .map((c) => `${c.displayName}: ${c.actualValue}`);

      return {
        touchLevel: rule.outputTouchLevel as TouchLevel,
        matchedRuleId: rule.id,
        matchedRuleOrder: rule.order,
        matchedRuleDescription: rule.description ?? `Rule ${rule.order}`,
        keyFactors,
        evaluationLog,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Fall through to default
  if (defaultRule) {
    evaluationLog.push({
      ruleId: defaultRule.id,
      ruleOrder: defaultRule.order,
      description: defaultRule.description ?? 'Default catch-all',
      passed: true,
      isDefault: true,
      conditions: [],
    });

    return {
      touchLevel: defaultRule.outputTouchLevel as TouchLevel,
      matchedRuleId: defaultRule.id,
      matchedRuleOrder: defaultRule.order,
      matchedRuleDescription: defaultRule.description ?? 'Default',
      keyFactors: ['No specific rule matched — routed to default'],
      evaluationLog,
      timestamp: new Date().toISOString(),
    };
  }

  // Fallback (should never happen with valid tables)
  return {
    touchLevel: 'MODERATE',
    matchedRuleId: 'FALLBACK',
    matchedRuleOrder: 99,
    matchedRuleDescription: 'Evaluation fallback',
    keyFactors: [],
    evaluationLog,
    timestamp: new Date().toISOString(),
  };
}

// Pre-built test value sets matching the two demo scenarios
export const LOAN_TEST_VALUES: Record<string, string> = {
  // STP eligibility checks
  mec_indicator:          'No',           // Not a Modified Endowment Contract
  irrev_beneficiary:      'None',         // No irrevocable beneficiary
  collateral_assignment:  'None',         // No collateral assignment
  address_change_days:    '15',           // Address changed 15 days ago → STP flag (≤30)
  // Amount & policy checks
  loan_amount_pct_of_max: '68',           // $75k / $110k max = 68%
  policy_status:          'Active',
  idp_confidence_avg:     '92',
};

export const WITHDRAWAL_TEST_VALUES: Record<string, string> = {
  // STP eligibility checks
  mec_indicator:        'No',             // Not a MEC
  irrev_beneficiary:    'None',           // No irrevocable beneficiary
  // Amount & policy checks
  within_free_corridor: 'Yes',            // $5k within $18k free corridor
  policy_status:        'Active',
  idp_confidence_avg:   '97',
};
