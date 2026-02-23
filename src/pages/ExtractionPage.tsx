import { useState } from 'react';
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
import { ConfidenceBadge } from '../components/shared/ConfidenceBadge';
import { DXC } from '../theme/dxcTheme';

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
function DocumentViewer({ transactionType }: { transactionType: string }) {
  const isWithdrawal = transactionType.toLowerCase().includes('withdrawal');
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
              { label: 'Policy / Contract No.', value: isWithdrawal ? 'ANN-2024-034891' : 'LF-2024-089423' },
              { label: 'Owner Name', value: isWithdrawal ? 'Patricia M. Chen' : 'James R. Whitfield' },
              { label: 'Owner SSN (Last 4)', value: isWithdrawal ? '4217' : '7823' },
              { label: 'Date of Birth', value: isWithdrawal ? '05/08/1955' : '09/12/1962' },
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
                {isWithdrawal ? 'P. M. Chen' : 'J. R. Whitfield'}
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
  } = useCase();

  const progress = getValidationProgress();
  const threshold = scenario === 'withdrawal' ? 95 : 90;

  const groups = (['identity', 'financial', 'payment', 'tax'] as IDPFieldGroup[]).map((g) => ({
    group: g,
    label: GROUP_LABELS[g],
    entities: idpEntities.filter((e) => e.group === g),
  }));

  const flaggedCount = idpEntities.filter((e) => e.confidenceScore < threshold && !e.validated).length;
  const mismatches = idpEntities.filter((e) => e.matchStatus === 'mismatch').length;

  const handleCompleteValidation = () => {
    addWorkflowEvent('VALIDATION_COMPLETE', `All required fields validated. ${idpEntities.filter((e) => e.corrected).length} correction(s) logged.`);
    navigate('/triage');
  };

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
            IDP Extraction & Validation
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(14,16,32,0.55)' }}>
            Review extracted fields, correct errors, and accept validated values before triage.
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
              Template: {activeCase.transactionType} · Confidence threshold: {threshold}%
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
              <DocumentViewer transactionType={activeCase.transactionType} />
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
              endIcon={<ArrowForwardIcon />}
              onClick={handleCompleteValidation}
              disabled={progress.pct < 100}
              sx={{ py: 1.5 }}
            >
              Complete Validation &amp; Proceed to Triage
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
