import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import SaveIcon from '@mui/icons-material/Save';
import type {
  DecisionTable,
  DecisionRule,
  DecisionColumn,
  ConditionOperator,
  EntityField,
  TouchLevel,
} from '../types/entities';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { ALL_ENTITY_FIELDS, LOAN_DECISION_TABLE, WITHDRAWAL_DECISION_TABLE } from '../data/mockData';
import { evaluateDecisionTable, LOAN_TEST_VALUES, WITHDRAWAL_TEST_VALUES } from '../services/triageEngine';
import { snGet, snPatch } from '../services/snApiClient';
import { EntitySourceChip } from '../components/shared/EntitySourceChip';
import { TouchLevelBadge } from '../components/shared/TouchLevelBadge';
import { DXC } from '../theme/dxcTheme';

type SNRef = string | { display_value?: string; value?: string; link?: string };
function snVal(v: SNRef | undefined): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.display_value ?? v.value ?? '';
}

interface SNTriageCase {
  sys_id: string;
  number: SNRef;
  state: SNRef;
  stage: SNRef;
  transaction_type?: SNRef;
  policy_number?: SNRef;
  short_description?: SNRef;
}

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: '= equals',
  neq: '≠ not equals',
  gt: '> greater than',
  gte: '≥ greater or equal',
  lt: '< less than',
  lte: '≤ less or equal',
  between: '↔ between',
  contains: '⊃ contains',
  blank: '∅ is blank',
  notblank: '● is not blank',
  any: '* ANY',
};

const TOUCH_LEVEL_OPTIONS: TouchLevel[] = ['STP', 'LOW', 'MODERATE', 'HIGH'];

const TOUCH_COLORS: Record<TouchLevel, string> = {
  STP: DXC.stp,
  LOW: DXC.trueBlue,
  MODERATE: '#b45309',
  HIGH: DXC.red,
};

function TouchLevelSelect({
  value,
  onChange,
}: {
  value: TouchLevel;
  onChange: (v: TouchLevel) => void;
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as TouchLevel)}
      size="small"
      sx={{ minWidth: 130, '& .MuiSelect-select': { py: 0.75 } }}
    >
      {TOUCH_LEVEL_OPTIONS.map((lvl) => (
        <MenuItem key={lvl} value={lvl}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: TOUCH_COLORS[lvl],
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{lvl}</Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
}

function cloneTable(src: DecisionTable): DecisionTable {
  return {
    ...src,
    columns: src.columns.map((c) => ({ ...c })),
    rules: src.rules.map((r) => ({
      ...r,
      conditions: r.conditions.map((c) => ({ ...c })),
    })),
  };
}

export function TriagePage() {
  const navigate = useNavigate();
  const { scenario, setTriageResult, addWorkflowEvent, snSysId, snCaseNumber } = useCase();
  const { isAuthenticated } = useAuth();

  const [table, setTable] = useState<DecisionTable>(() =>
    cloneTable(scenario === 'loan' ? LOAN_DECISION_TABLE : WITHDRAWAL_DECISION_TABLE)
  );

  const [testValues, setTestValues] = useState<Record<string, string>>(
    scenario === 'loan' ? { ...LOAN_TEST_VALUES } : { ...WITHDRAWAL_TEST_VALUES }
  );
  const [testResult, setTestResult] = useState<ReturnType<typeof evaluateDecisionTable> | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [snCase, setSnCase] = useState<SNTriageCase | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  // Fetch SN case for context display in the CTA
  useEffect(() => {
    if (!snSysId || !isAuthenticated) return;
    snGet<{ result: SNTriageCase }>(
      `/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals/${snSysId}`,
      {
        sysparm_fields: 'sys_id,number,state,stage,transaction_type,policy_number,short_description',
        sysparm_display_value: 'true',
      }
    )
      .then((d) => setSnCase(d.result))
      .catch(() => setSnCase(null));
  }, [snSysId, isAuthenticated]);

  const fieldsBySource = {
    IDP: ALL_ENTITY_FIELDS.filter((f) => f.entitySource === 'IDP'),
    Policy: ALL_ENTITY_FIELDS.filter((f) => f.entitySource === 'Policy'),
    Workflow: ALL_ENTITY_FIELDS.filter((f) => f.entitySource === 'Workflow'),
  };

  const addColumn = (field: EntityField) => {
    if (table.columns.find((c) => c.fieldName === field.fieldName)) return;
    const newCol: DecisionColumn = {
      id: `col_${field.fieldName}`,
      fieldName: field.fieldName,
      displayName: field.displayName,
      entitySource: field.entitySource,
      dataType: field.dataType,
      unit: field.unit,
    };
    const updatedRules = table.rules.map((rule) => {
      if (rule.isDefault) return rule;
      return {
        ...rule,
        conditions: [
          ...rule.conditions,
          {
            id: `c_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            columnId: newCol.id,
            fieldName: field.fieldName,
            operator: 'any' as ConditionOperator,
            value: '',
          },
        ],
      };
    });
    setTable((prev) => ({ ...prev, columns: [...prev.columns, newCol], rules: updatedRules }));
  };

  const removeColumn = (colId: string) => {
    setTable((prev) => ({
      ...prev,
      columns: prev.columns.filter((c) => c.id !== colId),
      rules: prev.rules.map((r) => ({
        ...r,
        conditions: r.conditions.filter((c) => c.columnId !== colId),
      })),
    }));
  };

  const addRule = () => {
    const nonDefaults = table.rules.filter((r) => !r.isDefault);
    const newRule: DecisionRule = {
      id: `RULE-${Date.now()}`,
      order: nonDefaults.length + 1,
      description: 'New rule',
      conditions: table.columns.map((col) => ({
        id: `c_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        columnId: col.id,
        fieldName: col.fieldName,
        operator: 'any' as ConditionOperator,
        value: '',
      })),
      outputTouchLevel: 'MODERATE' as TouchLevel,
      isDefault: false,
    };
    const defaultRule = table.rules.find((r) => r.isDefault);
    setTable((prev) => ({
      ...prev,
      rules: defaultRule ? [...nonDefaults, newRule, defaultRule] : [...nonDefaults, newRule],
    }));
  };

  const removeRule = (ruleId: string) => {
    setTable((prev) => ({ ...prev, rules: prev.rules.filter((r) => r.id !== ruleId) }));
  };

  const updateCondition = (
    ruleId: string,
    condId: string,
    field: 'operator' | 'value' | 'value2',
    val: string
  ) => {
    setTable((prev) => ({
      ...prev,
      rules: prev.rules.map((r) =>
        r.id !== ruleId
          ? r
          : {
              ...r,
              conditions: r.conditions.map((c) =>
                c.id !== condId ? c : { ...c, [field]: val }
              ),
            }
      ),
    }));
  };

  const updateRuleOutput = (ruleId: string, level: TouchLevel) => {
    setTable((prev) => ({
      ...prev,
      rules: prev.rules.map((r) =>
        r.id !== ruleId ? r : { ...r, outputTouchLevel: level }
      ),
    }));
  };

  const runTest = () => {
    setTestResult(evaluateDecisionTable(table, testValues));
  };

  const handleRunTriage = async () => {
    const inputs = scenario === 'loan' ? LOAN_TEST_VALUES : WITHDRAWAL_TEST_VALUES;
    const result = evaluateDecisionTable(table, inputs);
    setTriageResult(result);
    addWorkflowEvent(
      'TRIAGE_COMPLETE',
      `Triage complete. Touch level: ${result.touchLevel}. Rule matched: ${result.matchedRuleDescription}`
    );

    if (snSysId && isAuthenticated) {
      setTriageLoading(true);
      try {
        const patched = await snPatch<{ result: { sys_id: string; number: string } }>(
          `/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals/${snSysId}`,
          { touch_level: result.touchLevel, stage: 'Triage', state: 'Work in progress' }
        );
        console.log('[Triage] PATCH touch_level:', result.touchLevel, '— sys_id:', patched?.result?.sys_id, 'number:', patched?.result?.number);
      } catch (err) {
        console.error('[Triage] PATCH failed:', err);
        // non-fatal — proceed even if PATCH fails
      } finally {
        setTriageLoading(false);
      }
    }

    if (result.touchLevel === 'STP' || result.touchLevel === 'LOW') navigate('/processing/low');
    else if (result.touchLevel === 'MODERATE') navigate('/processing/moderate');
    else navigate('/processing/high');
  };

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const nonDefaultRules = table.rules
    .filter((r) => !r.isDefault)
    .sort((a, b) => a.order - b.order);
  const defaultRule = table.rules.find((r) => r.isDefault);

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
              fontWeight: 700,
              fontSize: '1.4rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: DXC.midnightBlue,
              mb: 0.5,
            }}
          >
            Triage Engine
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(14,16,32,0.55)' }}>
            Configure decision table rules — add entity fields as columns, define conditions, and test with
            case data.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {savedMessage && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Saved"
              size="small"
              sx={{
                backgroundColor: '#dcfce7',
                color: DXC.stp,
                fontWeight: 700,
                '& .MuiChip-icon': { color: DXC.stp },
              }}
            />
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ fontSize: '0.75rem' }}
          >
            Save Table
          </Button>
        </Box>
      </Box>

      {/* Table metadata bar */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box>
              <Typography variant="overline" sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.45)' }}>
                Table
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0E1020' }}>
                {table.name}
              </Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.45)' }}>
                Transaction Type
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{table.transactionTypeKey}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.45)' }}>
                Version
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{table.version}</Typography>
            </Box>
            <Chip
              label={table.status.toUpperCase()}
              size="small"
              sx={{
                backgroundColor: '#dcfce7',
                color: DXC.stp,
                fontWeight: 700,
                fontSize: '0.68rem',
                height: 22,
              }}
            />
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.45)', ml: 'auto' }}>
              {nonDefaultRules.length} rule{nonDefaultRules.length !== 1 ? 's' : ''} + 1 default ·{' '}
              {table.columns.length} condition column{table.columns.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        {/* ── Left: Entity Selector ── */}
        <Grid item xs={12} md={3}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  mb: 0.5,
                }}
              >
                Entity Fields
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.5)', mb: 2 }}>
                Click + to add a field as a decision column
              </Typography>

              {(['IDP', 'Policy', 'Workflow'] as const).map((source) => (
                <Accordion key={source} defaultExpanded={source !== 'Workflow'} sx={{ mb: 0.75 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      minHeight: '36px !important',
                      '& .MuiAccordionSummary-content': { my: '8px !important' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EntitySourceChip source={source} />
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                        {fieldsBySource[source].length}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, px: 1, pb: 1 }}>
                    {fieldsBySource[source].map((field) => {
                      const added = table.columns.some((c) => c.fieldName === field.fieldName);
                      return (
                        <Box
                          key={field.fieldName}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            py: 0.5,
                            px: 0.75,
                            borderRadius: '8px',
                            mb: 0.25,
                            backgroundColor: added ? 'rgba(73,149,255,0.08)' : 'transparent',
                            '&:hover': { backgroundColor: 'rgba(14,16,32,0.04)' },
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                fontWeight: added ? 700 : 500,
                                color: added ? DXC.trueBlue : '#0E1020',
                                lineHeight: 1.2,
                              }}
                            >
                              {field.displayName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.4)' }}>
                              {field.dataType}
                              {field.unit ? ` (${field.unit})` : ''}
                            </Typography>
                          </Box>
                          {added ? (
                            <CheckCircleIcon sx={{ fontSize: 16, color: DXC.trueBlue, ml: 0.5 }} />
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => addColumn(field)}
                              sx={{ color: DXC.trueBlue, p: 0.25, ml: 0.5 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Center: Decision Table Canvas ── */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  sx={{
                    fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Decision Table Canvas
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addRule}
                  sx={{ fontSize: '0.72rem', borderRadius: '8px', py: 0.5 }}
                >
                  Add Rule
                </Button>
              </Box>

              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 400 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          width: 36,
                          py: 1,
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          backgroundColor: '#F6F3F0',
                          color: 'rgba(14,16,32,0.55)',
                        }}
                      >
                        #
                      </TableCell>
                      {table.columns.map((col) => (
                        <TableCell key={col.id} sx={{ py: 1, backgroundColor: '#F6F3F0', minWidth: 160 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.03em',
                                  color: '#0E1020',
                                  lineHeight: 1.2,
                                  mb: 0.25,
                                }}
                              >
                                {col.displayName}
                              </Typography>
                              <EntitySourceChip source={col.entitySource} />
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => removeColumn(col.id)}
                              sx={{
                                color: 'rgba(14,16,32,0.3)',
                                p: 0.25,
                                '&:hover': { color: DXC.red },
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      ))}
                      <TableCell
                        sx={{
                          py: 1,
                          backgroundColor: DXC.midnightBlue,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          minWidth: 140,
                        }}
                      >
                        Output: Touch Level
                      </TableCell>
                      <TableCell sx={{ py: 1, backgroundColor: '#F6F3F0', width: 36 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {nonDefaultRules.map((rule, ruleIdx) => (
                      <TableRow
                        key={rule.id}
                        sx={{
                          '&:hover': { backgroundColor: 'rgba(73,149,255,0.04)' },
                          backgroundColor: ruleIdx % 2 === 0 ? 'transparent' : 'rgba(14,16,32,0.015)',
                        }}
                      >
                        <TableCell
                          sx={{
                            py: 0.75,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            color: 'rgba(14,16,32,0.55)',
                          }}
                        >
                          {rule.order}
                        </TableCell>

                        {table.columns.map((col) => {
                          const cond = rule.conditions.find((c) => c.columnId === col.id);
                          if (!cond) return <TableCell key={col.id} sx={{ py: 0.75 }} />;
                          return (
                            <TableCell key={col.id} sx={{ py: 0.75, verticalAlign: 'top' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Select
                                  value={cond.operator}
                                  onChange={(e) =>
                                    updateCondition(rule.id, cond.id, 'operator', e.target.value)
                                  }
                                  size="small"
                                  sx={{
                                    fontSize: '0.72rem',
                                    '& .MuiSelect-select': { py: 0.4 },
                                  }}
                                >
                                  {Object.entries(OPERATOR_LABELS).map(([op, label]) => (
                                    <MenuItem key={op} value={op} sx={{ fontSize: '0.78rem' }}>
                                      {label}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {cond.operator !== 'any' &&
                                  cond.operator !== 'blank' &&
                                  cond.operator !== 'notblank' && (
                                    <TextField
                                      size="small"
                                      value={cond.value}
                                      onChange={(e) =>
                                        updateCondition(rule.id, cond.id, 'value', e.target.value)
                                      }
                                      placeholder="value"
                                      sx={{ '& input': { fontSize: '0.78rem', py: 0.4 } }}
                                    />
                                  )}
                                {cond.operator === 'between' && (
                                  <TextField
                                    size="small"
                                    value={cond.value2 ?? ''}
                                    onChange={(e) =>
                                      updateCondition(rule.id, cond.id, 'value2', e.target.value)
                                    }
                                    placeholder="max value"
                                    sx={{ '& input': { fontSize: '0.78rem', py: 0.4 } }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                          );
                        })}

                        <TableCell sx={{ py: 0.75, verticalAlign: 'top' }}>
                          <TouchLevelSelect
                            value={rule.outputTouchLevel}
                            onChange={(v) => updateRuleOutput(rule.id, v)}
                          />
                        </TableCell>

                        <TableCell sx={{ py: 0.75, verticalAlign: 'top' }}>
                          <IconButton
                            size="small"
                            onClick={() => removeRule(rule.id)}
                            sx={{ color: 'rgba(14,16,32,0.3)', '&:hover': { color: DXC.red } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Default row */}
                    {defaultRule && (
                      <TableRow sx={{ backgroundColor: 'rgba(14,16,32,0.03)' }}>
                        <TableCell
                          sx={{
                            py: 0.75,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            color: 'rgba(14,16,32,0.4)',
                            fontStyle: 'italic',
                          }}
                        >
                          DEF
                        </TableCell>
                        {table.columns.map((col) => (
                          <TableCell key={col.id} sx={{ py: 0.75 }}>
                            <Typography
                              sx={{
                                fontSize: '0.75rem',
                                color: 'rgba(14,16,32,0.35)',
                                fontStyle: 'italic',
                              }}
                            >
                              ANY
                            </Typography>
                          </TableCell>
                        ))}
                        <TableCell sx={{ py: 0.75 }}>
                          <TouchLevelSelect
                            value={defaultRule.outputTouchLevel}
                            onChange={(v) => updateRuleOutput(defaultRule.id, v)}
                          />
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography
                sx={{
                  fontSize: '0.72rem',
                  color: 'rgba(14,16,32,0.4)',
                  mt: 1.5,
                  fontStyle: 'italic',
                }}
              >
                Rules evaluated top-to-bottom · First match wins · Default row catches all unmatched cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: Test Harness ── */}
        <Grid item xs={12} md={3}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  mb: 1.5,
                }}
              >
                Test Harness
              </Typography>

              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() =>
                  setTestValues(
                    scenario === 'loan' ? { ...LOAN_TEST_VALUES } : { ...WITHDRAWAL_TEST_VALUES }
                  )
                }
                sx={{ fontSize: '0.72rem', mb: 2, borderRadius: '8px', py: 0.5 }}
              >
                Load Demo Case Values
              </Button>

              {/* Input fields for each column */}
              {table.columns.map((col) => (
                <Box key={col.id} sx={{ mb: 1.5 }}>
                  <Typography
                    sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(14,16,32,0.55)', mb: 0.5 }}
                  >
                    {col.displayName}
                    {col.unit && (
                      <span style={{ fontWeight: 400, color: 'rgba(14,16,32,0.35)' }}> ({col.unit})</span>
                    )}
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={testValues[col.fieldName] ?? ''}
                    onChange={(e) =>
                      setTestValues((prev) => ({ ...prev, [col.fieldName]: e.target.value }))
                    }
                    placeholder="enter value"
                    sx={{ '& input': { fontSize: '0.8rem' } }}
                  />
                </Box>
              ))}

              <Button
                variant="contained"
                color="secondary"
                fullWidth
                startIcon={<PlayArrowIcon />}
                onClick={runTest}
                sx={{ mb: 2, fontSize: '0.78rem', borderRadius: '8px' }}
              >
                Evaluate
              </Button>

              {/* Test result */}
              {testResult && (
                <Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'rgba(14,16,32,0.4)',
                      mb: 1,
                    }}
                  >
                    Result
                  </Typography>

                  <Box
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: '10px',
                      backgroundColor: '#F6F3F0',
                      textAlign: 'center',
                    }}
                  >
                    <TouchLevelBadge level={testResult.touchLevel} size="medium" />
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.6)', mt: 0.75 }}>
                      Rule {testResult.matchedRuleOrder}: {testResult.matchedRuleDescription}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'rgba(14,16,32,0.4)',
                      mb: 0.75,
                    }}
                  >
                    Evaluation Path
                  </Typography>
                  {testResult.evaluationLog.map((ruleLog) => (
                    <Box
                      key={ruleLog.ruleId}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        mb: 0.5,
                        py: 0.5,
                        px: 0.75,
                        borderRadius: '6px',
                        backgroundColor: ruleLog.passed
                          ? 'rgba(22,163,74,0.1)'
                          : 'rgba(14,16,32,0.04)',
                      }}
                    >
                      {ruleLog.passed ? (
                        <CheckCircleIcon
                          sx={{ fontSize: 13, color: DXC.stp, flexShrink: 0 }}
                        />
                      ) : (
                        <RemoveCircleIcon
                          sx={{ fontSize: 13, color: 'rgba(14,16,32,0.25)', flexShrink: 0 }}
                        />
                      )}
                      <Typography
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: ruleLog.passed ? 700 : 400,
                          color: ruleLog.passed ? DXC.stp : 'rgba(14,16,32,0.45)',
                        }}
                      >
                        Rule {ruleLog.ruleOrder}
                        {ruleLog.isDefault ? ' (Default)' : ''}
                        {ruleLog.passed && ' ← MATCH'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Run Triage CTA */}
      <Card
        sx={{
          mt: 3,
          background: `linear-gradient(135deg, ${DXC.midnightBlue} 0%, #1a1e3a 100%)`,
        }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography
                  sx={{
                    fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                    fontWeight: 500,
                    fontSize: '0.82rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: DXC.sky,
                  }}
                >
                  Run Triage on Active Case
                </Typography>
                {snCaseNumber && (
                  <Chip
                    label={snCaseNumber}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.85)',
                    }}
                  />
                )}
              </Box>
              <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                {snCase
                  ? `${snVal(snCase.transaction_type) || (scenario === 'loan' ? 'Policy Loan' : 'Annuity Withdrawal')}${snVal(snCase.policy_number) ? ` · Policy ${snVal(snCase.policy_number)}` : ''} — evaluating against current decision table`
                  : scenario === 'loan'
                  ? 'Demo 1 — Policy Loan ($75K, 68% of max, existing loan)'
                  : 'Demo 2 — Annuity Withdrawal ($5K, within free corridor)'}
                {snCase ? '' : ' · against the current decision table'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={triageLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <ArrowForwardIcon />}
              onClick={handleRunTriage}
              disabled={triageLoading}
              sx={{ py: 1.5, px: 4, backgroundColor: DXC.trueBlue, '&:hover': { backgroundColor: DXC.royalBlue } }}
            >
              Run Triage & Route
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
