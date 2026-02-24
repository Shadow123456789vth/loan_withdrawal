import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  Divider,
  LinearProgress,
  Chip,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Badge,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { IDPEntity, IDPFieldGroup, MatchStatus } from '../types/entities';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { snGet, snPatch } from '../services/snApiClient';
import { ConfidenceBadge } from '../components/shared/ConfidenceBadge';
import { DXC } from '../theme/dxcTheme';
import LinkIcon from '@mui/icons-material/Link';
import CircularProgress from '@mui/material/CircularProgress';

interface SNCase {
  sys_id: string;
  number: string;
  state: string;
  stage: string;
  contact_type: string;
  transaction_type: string;
  policy_number: string;
  short_description: string;
  // Form data fields set at Intake — replace mock IDP values
  owner_name: string;
  requested_amount: string;
  payment_method: string;
  federal_withholding: string;
}

const GROUP_LABELS: Record<IDPFieldGroup, string> = {
  identity: 'Identity & Signature',
  financial: 'Financial Details',
  payment: 'Payment Instructions',
  tax: 'Tax Elections',
};

function MatchStatusIndicator({ status, policyValue }: { status: MatchStatus; policyValue?: string }) {
  if (status === 'match')
    return (
      <Tooltip title={`Matches policy: ${policyValue}`} arrow>
        <Chip
          icon={<CheckCircleIcon />}
          label="Match"
          size="small"
          sx={{ backgroundColor: '#dcfce7', color: DXC.stp, fontSize: '0.65rem', fontWeight: 700, height: 20, '& .MuiChip-icon': { fontSize: 12, ml: 0.5 } }}
        />
      </Tooltip>
    );
  if (status === 'mismatch')
    return (
      <Tooltip title={`Policy value: ${policyValue}`} arrow>
        <Chip
          icon={<WarningAmberIcon />}
          label="Mismatch"
          size="small"
          sx={{ backgroundColor: '#fef9c3', color: '#b45309', fontSize: '0.65rem', fontWeight: 700, height: 20, '& .MuiChip-icon': { fontSize: 12, ml: 0.5 } }}
        />
      </Tooltip>
    );
  if (status === 'unavailable')
    return (
      <Chip
        label="N/A"
        size="small"
        sx={{ backgroundColor: '#F6F3F0', color: 'rgba(14,16,32,0.4)', fontSize: '0.65rem', fontWeight: 600, height: 20 }}
      />
    );
  return (
    <Chip
      label="Pending"
      size="small"
      sx={{ backgroundColor: '#dbeafe', color: DXC.trueBlue, fontSize: '0.65rem', fontWeight: 600, height: 20 }}
    />
  );
}

function EntityRow({
  entity,
  onValidate,
  confidenceThreshold,
}: {
  entity: IDPEntity;
  onValidate: (fieldName: string, value?: string) => void;
  confidenceThreshold: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(entity.extractedValue);

  const belowThreshold = entity.confidenceScore < confidenceThreshold && !entity.validated;

  const handleAccept = () => {
    onValidate(entity.fieldName);
    setEditing(false);
  };

  const handleSaveEdit = () => {
    onValidate(entity.fieldName, editValue);
    setEditing(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        px: 1.5,
        borderRadius: '10px',
        backgroundColor: entity.validated
          ? 'rgba(22,163,74,0.04)'
          : belowThreshold
          ? 'rgba(255,174,65,0.06)'
          : 'transparent',
        border: entity.validated
          ? '1px solid rgba(22,163,74,0.15)'
          : belowThreshold
          ? '1px solid rgba(255,174,65,0.25)'
          : '1px solid transparent',
        mb: 0.5,
      }}
    >
      {/* Validated check */}
      <Box sx={{ width: 18, flexShrink: 0 }}>
        {entity.validated && (
          <CheckCircleIcon sx={{ fontSize: 16, color: DXC.stp }} />
        )}
      </Box>

      {/* Field name */}
      <Box sx={{ width: 160, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#0E1020' }}>
          {entity.displayName}
        </Typography>
        {entity.required && (
          <Typography sx={{ fontSize: '0.62rem', color: DXC.red, fontWeight: 700 }}>Required</Typography>
        )}
      </Box>

      {/* Value (editing or display) */}
      <Box sx={{ flex: 1 }}>
        {editing ? (
          <TextField
            size="small"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            sx={{ '& input': { fontSize: '0.82rem', fontWeight: 600 } }}
          />
        ) : (
          <Typography
            sx={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: entity.corrected ? DXC.trueBlue : '#0E1020',
              fontStyle: entity.corrected ? 'italic' : 'normal',
            }}
          >
            {entity.extractedValue}
            {entity.corrected && (
              <Typography component="span" sx={{ fontSize: '0.68rem', color: 'rgba(14,16,32,0.45)', ml: 1, fontStyle: 'normal' }}>
                (corrected)
              </Typography>
            )}
          </Typography>
        )}
      </Box>

      {/* Confidence */}
      <Box sx={{ width: 56, flexShrink: 0 }}>
        <ConfidenceBadge score={entity.confidenceScore} size="sm" />
      </Box>

      {/* Match status */}
      <Box sx={{ width: 80, flexShrink: 0 }}>
        <MatchStatusIndicator status={entity.matchStatus} policyValue={entity.policyValue} />
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        {editing ? (
          <>
            <IconButton size="small" onClick={handleSaveEdit} sx={{ color: DXC.stp }}>
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setEditing(false)} sx={{ color: DXC.red }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <>
            {!entity.validated && (
              <Tooltip title="Accept extracted value" arrow>
                <IconButton size="small" onClick={handleAccept} sx={{ color: DXC.stp }}>
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Edit value" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  setEditValue(entity.extractedValue);
                  setEditing(true);
                }}
                sx={{ color: DXC.trueBlue }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
}

// Simulated loan form document
function DocumentViewer({ transactionType, policyNumber, ownerName }: {
  transactionType: string;
  policyNumber?: string;
  ownerName?: string;
}) {
  const isWithdrawal = transactionType.toLowerCase().includes('withdrawal');
  const displayPolicy = policyNumber || (isWithdrawal ? 'ANN-2024-034891' : 'LF-2024-089423');
  const displayOwner  = ownerName    || (isWithdrawal ? 'Patricia M. Chen' : 'James R. Whitfield');
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 500,
        background: DXC.white,
        borderRadius: '12px',
        border: '1px solid rgba(14,16,32,0.12)',
        overflow: 'hidden',
        fontFamily: 'Georgia, serif',
      }}
    >
      {/* Document header */}
      <Box sx={{ backgroundColor: '#F6F3F0', borderBottom: '2px solid rgba(14,16,32,0.12)', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'Georgia, serif', color: '#0E1020' }}>
              {isWithdrawal ? 'ANNUITY WITHDRAWAL REQUEST' : 'POLICY LOAN REQUEST'}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.5)', fontFamily: 'Georgia, serif' }}>
              Please complete all sections and return with required signature
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(14,16,32,0.45)', fontFamily: 'Georgia, serif' }}>
              {isWithdrawal ? 'Form ANN-WD-2024' : 'Form LF-LOAN-2024'}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(14,16,32,0.45)', fontFamily: 'Georgia, serif' }}>
              Rev. 09/2024
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Document body */}
      <Box sx={{ p: 2.5 }}>
        {/* Section 1: Policy Info */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ddd', pb: 0.5, mb: 1.5, fontFamily: 'Georgia, serif', color: '#0E1020' }}>
            Section 1 — Policy / Contract Information
          </Typography>
          <Grid container spacing={1.5}>
            {[
              { label: 'Policy / Contract No.', value: displayPolicy },
              { label: 'Owner Name',             value: displayOwner },
              { label: 'Owner SSN (Last 4)',      value: isWithdrawal ? '4217' : '7823' },
              { label: 'Date of Birth',           value: isWithdrawal ? '05/08/1955' : '09/12/1962' },
            ].map((field) => (
              <Grid item xs={6} key={field.label}>
                <Box sx={{ borderBottom: '1px solid #ccc', pb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.45)', fontFamily: 'Georgia, serif' }}>{field.label}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Georgia, serif', color: '#0E1020' }}>{field.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Section 2: Request */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ddd', pb: 0.5, mb: 1.5, fontFamily: 'Georgia, serif', color: '#0E1020' }}>
            Section 2 — {isWithdrawal ? 'Withdrawal' : 'Loan'} Request
          </Typography>
          <Grid container spacing={1.5}>
            {(isWithdrawal
              ? [
                  { label: 'Withdrawal Type', value: '✓ Partial Withdrawal  ☐ Full Surrender' },
                  { label: 'Requested Amount', value: '$ 5,000.00' },
                ]
              : [
                  { label: 'Loan Type', value: '✓ New Loan  ☐ Repayment' },
                  { label: 'Requested Amount', value: '$ 75,000.00' },
                ]
            ).map((field) => (
              <Grid item xs={12} key={field.label}>
                <Box sx={{ borderBottom: '1px solid #ccc', pb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.45)', fontFamily: 'Georgia, serif' }}>{field.label}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Georgia, serif', color: '#0E1020' }}>{field.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Section 3: Payment */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ddd', pb: 0.5, mb: 1.5, fontFamily: 'Georgia, serif', color: '#0E1020' }}>
            Section 3 — Disbursement Instructions
          </Typography>
          <Grid container spacing={1.5}>
            {[
              { label: 'Disbursement Method', value: '✓ EFT — Checking Account' },
              { label: 'Bank Name', value: isWithdrawal ? 'Wells Fargo Bank' : 'First National Bank' },
              { label: 'Routing No.', value: '021000089' },
              { label: 'Account No.', value: '****4491' },
            ].map((field) => (
              <Grid item xs={6} key={field.label}>
                <Box sx={{ borderBottom: '1px solid #ccc', pb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.45)', fontFamily: 'Georgia, serif' }}>{field.label}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Georgia, serif', color: '#0E1020' }}>{field.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Signature line */}
        <Box
          sx={{
            mt: 3,
            borderTop: '1px solid #ccc',
            pt: 1.5,
            display: 'flex',
            gap: 3,
          }}
        >
          <Box sx={{ flex: 2 }}>
            <Box sx={{ borderBottom: '1px solid #0E1020', mb: 0.5, height: 28 }}>
              <Typography sx={{ fontSize: '0.75rem', fontStyle: 'italic', fontFamily: 'Georgia, serif', color: 'rgba(14,16,32,0.7)' }}>
                {displayOwner.split(' ').map((p, i, a) => i === 0 ? p[0] + '.' : i === a.length - 1 ? p : '').filter(Boolean).join(' ')}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.45)', fontFamily: 'Georgia, serif' }}>Owner Signature</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ borderBottom: '1px solid #0E1020', mb: 0.5, height: 28 }}>
              <Typography sx={{ fontSize: '0.75rem', fontFamily: 'Georgia, serif', color: '#0E1020' }}>
                {isWithdrawal ? '02/19/2026' : '02/18/2026'}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.45)', fontFamily: 'Georgia, serif' }}>Date</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function ExtractionPage() {
  const navigate = useNavigate();
  const {
    activeCase,
    idpEntities,
    validateField,
    validateAllHighConfidence,
    getValidationProgress,
    addWorkflowEvent,
    scenario,
    snSysId,
    snCaseNumber,
    hydrateSNFields,
  } = useCase();
  const { isAuthenticated } = useAuth();

  // Live SN case data
  const [snCase, setSnCase] = useState<SNCase | null>(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [patching, setPatching] = useState(false);

  useEffect(() => {
    if (!snSysId || !isAuthenticated) return;
    setCaseLoading(true);
    snGet<{ result: SNCase }>(
      `/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals/${snSysId}`,
      {
        sysparm_fields: 'sys_id,number,state,stage,contact_type,transaction_type,policy_number,short_description,owner_name,requested_amount,payment_method,federal_withholding',
        sysparm_display_value: 'true',
      },
    )
      .then((d) => {
        setSnCase(d.result);

        // Build SN→IDP field map and hydrate extraction entities.
        // `federal_withholding` in SN maps to `tax_withholding_federal` in IDP.
        // Only non-empty values are forwarded; mock values remain as fallback.
        const raw = d.result;
        const snFieldMap: Record<string, string> = {
          policy_number:        raw.policy_number,
          owner_name:           raw.owner_name,
          requested_amount:     raw.requested_amount,
          payment_method:       raw.payment_method,
          tax_withholding_federal: raw.federal_withholding,
        };
        const populated = Object.fromEntries(
          Object.entries(snFieldMap).filter(([, v]) => Boolean(v && v.trim()))
        );
        if (Object.keys(populated).length > 0) {
          hydrateSNFields(populated);
        }
      })
      .catch(() => setSnCase(null))
      .finally(() => setCaseLoading(false));
  }, [snSysId, isAuthenticated, hydrateSNFields]);

  const progress = getValidationProgress();
  const threshold = scenario === 'withdrawal' ? 95 : 90;

  // Derive display values — prefer live SN data, fall back to mock
  const displayTxnType  = snCase?.transaction_type  || activeCase.transactionType;
  const displayPolicy   = snCase?.policy_number     || activeCase.policyNumber;
  const displayCaseNum  = snCaseNumber               || activeCase.id;

  const groups = (['identity', 'financial', 'payment', 'tax'] as IDPFieldGroup[]).map((g) => ({
    group: g,
    label: GROUP_LABELS[g],
    entities: idpEntities.filter((e) => e.group === g),
  }));

  const flaggedCount = idpEntities.filter((e) => e.confidenceScore < threshold && !e.validated).length;
  const mismatches = idpEntities.filter((e) => e.matchStatus === 'mismatch').length;

  const handleCompleteValidation = async () => {
    addWorkflowEvent('VALIDATION_COMPLETE', `All required fields validated. ${idpEntities.filter((e) => e.corrected).length} correction(s) logged.`);
    if (snSysId && isAuthenticated) {
      setPatching(true);
      try {
        const result = await snPatch<{ result: { sys_id: string; number: string } }>(
          `/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals/${snSysId}`,
          { stage: 'Validation', state: 'Work in progress' }
        );
        console.log('[Extraction] PATCH validation — sys_id:', result?.result?.sys_id, 'number:', result?.result?.number);
      } catch (err) {
        console.error('[Extraction] PATCH failed:', err);
        /* non-blocking — proceed to triage regardless */
      }
      finally { setPatching(false); }
    }
    navigate('/triage');
  };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                fontWeight: 700,
                fontSize: '1.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: DXC.midnightBlue,
              }}
            >
              IDP Extraction & Validation
            </Typography>
            {snCaseNumber && (
              <Chip
                icon={<LinkIcon sx={{ fontSize: '12px !important', color: `${DXC.stp} !important` }} />}
                label={caseLoading ? 'Loading…' : snCaseNumber}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace', backgroundColor: 'rgba(22,163,74,0.08)', color: DXC.stp, border: '1px solid rgba(22,163,74,0.25)' }}
              />
            )}
            {!snCaseNumber && (
              <Chip label="Demo Mode" size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, backgroundColor: 'rgba(14,16,32,0.06)', color: 'rgba(14,16,32,0.45)', border: '1px solid rgba(14,16,32,0.1)' }} />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(14,16,32,0.55)' }}>
            Review extracted fields, correct errors, and accept validated values before triage.
            {snCase?.policy_number && <> · Policy: <strong>{snCase.policy_number}</strong></>}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {flaggedCount > 0 && (
            <Chip
              icon={<WarningAmberIcon />}
              label={`${flaggedCount} below threshold`}
              size="small"
              sx={{ backgroundColor: '#fef9c3', color: '#b45309', fontWeight: 700, '& .MuiChip-icon': { color: '#b45309' } }}
            />
          )}
          {mismatches > 0 && (
            <Chip
              icon={<SyncAltIcon />}
              label={`${mismatches} mismatch`}
              size="small"
              sx={{ backgroundColor: '#fee2e2', color: DXC.red, fontWeight: 700, '& .MuiChip-icon': { color: DXC.red } }}
            />
          )}
        </Box>
      </Box>

      {/* Progress bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(14,16,32,0.55)' }}>
              Validation Progress
            </Typography>
            <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: '1rem', color: progress.pct === 100 ? DXC.stp : '#0E1020' }}>
              {progress.validated} / {progress.total} Required Fields
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress.pct} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.45)' }}>
              Template: {displayTxnType} · Confidence threshold: {threshold}%
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: progress.pct === 100 ? DXC.stp : 'rgba(14,16,32,0.55)' }}>
              {progress.pct}% complete
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Main split-pane layout */}
      <Grid container spacing={2.5}>
        {/* Left: Document viewer */}
        <Grid item xs={12} md={5}>
          <Card sx={{ position: { md: 'sticky' }, top: { md: 16 } }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography
                  sx={{
                    fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Document Viewer
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {idpEntities.filter((e) => e.group !== undefined).slice(0, 0).map(() => null)}
                  <Chip label="Page 1 of 2" size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 22 }} />
                </Box>
              </Box>
              {caseLoading
                ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={24} sx={{ color: DXC.trueBlue }} /></Box>
                : <DocumentViewer transactionType={displayTxnType} policyNumber={displayPolicy} ownerName={activeCase.ownerName} />
              }
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Entity extraction panel */}
        <Grid item xs={12} md={7}>
          {/* Bulk approve */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={validateAllHighConfidence}
              sx={{ fontSize: '0.75rem' }}
            >
              Bulk Approve High-Confidence Fields
            </Button>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.5)', alignSelf: 'center' }}>
              Accepts all fields ≥ {threshold}% confidence
            </Typography>
          </Box>

          {/* Entity groups */}
          {groups.map(({ group, label, entities }) => (
            <Accordion key={group} defaultExpanded={group === 'identity' || group === 'financial'} sx={{ mb: 1.5 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {label}
                  </Typography>
                  <Badge
                    badgeContent={entities.filter((e) => e.validated).length}
                    max={entities.length}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: entities.every((e) => !e.required || e.validated) ? DXC.stp : DXC.trueBlue,
                        color: 'white',
                        fontSize: '0.65rem',
                        height: 18,
                        minWidth: 18,
                      },
                    }}
                  >
                    <Chip
                      label={`${entities.length} fields`}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20, backgroundColor: '#F6F3F0' }}
                    />
                  </Badge>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, px: 1 }}>
                {/* Column headers */}
                <Box sx={{ display: 'flex', gap: 1.5, px: 1.5, pb: 0.75, borderBottom: '1px solid rgba(14,16,32,0.08)', mb: 1 }}>
                  <Box sx={{ width: 18 }} />
                  <Typography sx={{ width: 160, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(14,16,32,0.4)' }}>Field</Typography>
                  <Typography sx={{ flex: 1, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(14,16,32,0.4)' }}>Extracted Value</Typography>
                  <Typography sx={{ width: 56, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(14,16,32,0.4)' }}>Conf.</Typography>
                  <Box sx={{ width: 80, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CompareArrowsIcon sx={{ fontSize: 12, color: 'rgba(14,16,32,0.4)' }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(14,16,32,0.4)' }}>Policy</Typography>
                  </Box>
                  <Box sx={{ width: 56 }} />
                </Box>
                {entities.map((entity) => (
                  <EntityRow
                    key={entity.fieldName}
                    entity={entity}
                    onValidate={validateField}
                    confidenceThreshold={threshold}
                  />
                ))}
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Complete validation */}
          <Box sx={{ mt: 3 }}>
            {progress.pct < 100 && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px', backgroundColor: '#fef9c3', border: '1px solid rgba(255,174,65,0.3)', '& .MuiAlert-icon': { color: '#b45309' } }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0E1020' }}>
                  {progress.total - progress.validated} required field{progress.total - progress.validated !== 1 ? 's' : ''} not yet validated
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.65)' }}>
                  All required fields must be validated before proceeding to triage.
                </Typography>
              </Alert>
            )}
            <Button
              variant="contained"
              size="large"
              fullWidth
              endIcon={patching ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <ArrowForwardIcon />}
              onClick={handleCompleteValidation}
              disabled={progress.pct < 100 || patching}
              sx={{ py: 1.5 }}
            >
              {patching ? 'Updating ServiceNow…' : 'Complete Validation & Proceed to Triage'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
