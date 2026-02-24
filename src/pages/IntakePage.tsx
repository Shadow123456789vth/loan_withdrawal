import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LinkIcon from '@mui/icons-material/Link';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { snPost } from '../services/snApiClient';
import { TRANSACTION_TYPE_REGISTRY } from '../data/mockData';
import { DXC } from '../theme/dxcTheme';

// Map UI channel labels to ServiceNow contact_type values
const CHANNEL_SOURCES: { label: string; value: string }[] = [
  { label: 'Portal',            value: 'Web' },
  { label: 'Mail / Fax',        value: 'Email' },
  { label: 'Call Center',       value: 'Phone' },
  { label: 'AWD / Integration', value: 'Integration' },
  { label: 'IVR',               value: 'Phone' },
];

// Map transaction type keys to SN transaction_type display values
const TXN_TYPE_TO_SN: Record<string, string> = {
  LIFE_LOAN:             'Policy Loan',
  ANNUITY_WITHDRAWAL:    'Annuity Withdrawal',
  LIFE_FULL_SURRENDER:   'Full Surrender',
  ANNUITY_RMD:           'Annuity RMD',
  LIFE_PARTIAL_SURRENDER:'Partial Surrender',
};

interface SNCreateResponse {
  result: {
    sys_id: string;
    number: string;
    state: string;
    stage: string;
  };
}

function IDPStatusIcon({ status }: { status: string }) {
  if (status === 'complete')   return <CheckCircleIcon sx={{ fontSize: 16, color: DXC.stp }} />;
  if (status === 'failed')     return <ErrorIcon sx={{ fontSize: 16, color: DXC.red }} />;
  if (status === 'processing') return <AutorenewIcon sx={{ fontSize: 16, color: DXC.trueBlue, animation: 'spin 1s linear infinite' }} />;
  return <HourglassEmptyIcon sx={{ fontSize: 16, color: 'rgba(14,16,32,0.4)' }} />;
}

function IDPStatusChip({ status }: { status: string }) {
  const config = {
    complete:   { label: 'Extraction Complete', bg: '#dcfce7', color: DXC.stp },
    failed:     { label: 'Failed',              bg: '#fee2e2', color: DXC.red },
    processing: { label: 'Processing…',         bg: '#dbeafe', color: DXC.trueBlue },
    queued:     { label: 'Queued',              bg: '#F6F3F0', color: 'rgba(14,16,32,0.5)' },
  }[status] ?? { label: status, bg: '#F6F3F0', color: '#0E1020' };

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{ backgroundColor: config.bg, color: config.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
    />
  );
}

export function IntakePage() {
  const navigate = useNavigate();
  const { activeCase, documents, scenario, setScenario, snSysId, snCaseNumber, setSNCase } = useCase();
  const { isAuthenticated } = useAuth();

  // Editable form state (pre-seeded from mock scenario)
  const [policyNumber, setPolicyNumber]   = useState(activeCase.policyNumber);
  const [channelSource, setChannelSource] = useState(CHANNEL_SOURCES[0].value);
  const [txnTypeKey, setTxnTypeKey]       = useState(activeCase.transactionTypeKey);

  // SN submission state
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedTxnType = TRANSACTION_TYPE_REGISTRY.find((t) => t.key === txnTypeKey);
  const caseCreated = Boolean(snSysId);

  const handleTxnTypeChange = (key: string) => {
    setTxnTypeKey(key);
    if (key === 'ANNUITY_WITHDRAWAL' || key === 'ANNUITY_RMD') setScenario('withdrawal');
    else setScenario('loan');
  };

  const handleCreateCase = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const txnLabel = TXN_TYPE_TO_SN[txnTypeKey] ?? txnTypeKey;
      const data = await snPost<SNCreateResponse>(
        '/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals',
        {
          state:               'New',
          stage:               'Initiation',
          contact_type:        channelSource,
          transaction_type:    txnLabel,
          policy_number:       policyNumber,
          short_description:   `${txnLabel} | ${policyNumber}`,
        },
      );
      setSNCase(data.result.sys_id, data.result.number);
      console.log('[Intake] Case created — sys_id:', data.result.sys_id, 'number:', data.result.number);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create case in ServiceNow');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
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
            Case Intake
          </Typography>
          {isAuthenticated
            ? <Chip label="Live Mode" size="small" icon={<LinkIcon sx={{ fontSize: '12px !important', color: `${DXC.stp} !important` }} />} sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, backgroundColor: 'rgba(22,163,74,0.08)', color: DXC.stp, border: `1px solid rgba(22,163,74,0.25)` }} />
            : <Chip label="Demo Mode" size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, backgroundColor: 'rgba(14,16,32,0.06)', color: 'rgba(14,16,32,0.45)', border: '1px solid rgba(14,16,32,0.1)' }} />
          }
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(14,16,32,0.55)' }}>
          Select the transaction type, identify the policy, and load the submitted documents for processing.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left column: transaction config */}
        <Grid item xs={12} lg={7}>
          {/* Transaction Type Selector */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  mb: 2.5,
                  pb: 1.5,
                  borderBottom: '2px solid #F6F3F0',
                }}
              >
                Transaction Configuration
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={caseCreated}>
                    <InputLabel>Transaction Type</InputLabel>
                    <Select
                      value={txnTypeKey}
                      label="Transaction Type"
                      onChange={(e) => handleTxnTypeChange(e.target.value)}
                    >
                      {TRANSACTION_TYPE_REGISTRY.map((t) => (
                        <MenuItem key={t.key} value={t.key}>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.displayName}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.5)' }}>{t.lineOfBusiness}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Policy / Contract Number"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    disabled={caseCreated}
                    sx={{ '& input': { fontWeight: 600 } }}
                    helperText={
                      policyNumber
                        ? <span style={{ color: DXC.stp, fontWeight: 600, fontSize: '0.7rem' }}>✓ Policy verified</span>
                        : undefined
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Policy Owner"
                    value={activeCase.ownerName}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" disabled={caseCreated}>
                    <InputLabel>Channel Source</InputLabel>
                    <Select
                      value={channelSource}
                      label="Channel Source"
                      onChange={(e) => setChannelSource(e.target.value)}
                    >
                      {CHANNEL_SOURCES.map((ch) => (
                        <MenuItem key={ch.value + ch.label} value={ch.value}>{ch.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Registry config display */}
              {selectedTxnType && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: '12px',
                    backgroundColor: '#F6F3F0',
                    border: '1px solid rgba(14,16,32,0.08)',
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{ color: 'rgba(14,16,32,0.45)', fontSize: '0.65rem', display: 'block', mb: 1 }}
                  >
                    Transaction Type Registry Configuration
                  </Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'IDP Template',  value: selectedTxnType.idpTemplateRef },
                      { label: 'Decision Table', value: selectedTxnType.decisionTableRef },
                      { label: 'Form Layout',    value: selectedTxnType.formLayoutRef },
                      { label: 'GOC Checklist',  value: selectedTxnType.goodOrderChecklistRef },
                    ].map((item) => (
                      <Grid item xs={6} sm={3} key={item.label}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'rgba(14,16,32,0.4)', mb: 0.25 }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'monospace', color: DXC.royalBlue }}>
                          {item.value}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ mt: 1.5 }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.5)' }}>
                      Confidence thresholds — Default: {selectedTxnType.confidenceThresholds.default}% · Signature: {selectedTxnType.confidenceThresholds.signature}% · Amounts: {selectedTxnType.confidenceThresholds.amounts}%
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* SN Create / Status */}
              <Box sx={{ mt: 3 }}>
                {!caseCreated && isAuthenticated && (
                  <>
                    {submitError && (
                      <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.78rem' }}>
                        {submitError}
                      </Alert>
                    )}
                    <Button
                      variant="contained"
                      startIcon={submitting ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <AddCircleOutlineIcon />}
                      onClick={handleCreateCase}
                      disabled={submitting || !policyNumber.trim()}
                      sx={{ backgroundColor: DXC.trueBlue, '&:hover': { backgroundColor: DXC.royalBlue }, borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem', textTransform: 'none' }}
                    >
                      {submitting ? 'Creating in ServiceNow…' : 'Create Case in ServiceNow'}
                    </Button>
                  </>
                )}

                {caseCreated && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '10px' }}>
                    <CheckCircleIcon sx={{ color: DXC.stp, fontSize: 20 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: DXC.stp }}>Case created in ServiceNow</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.88rem', fontWeight: 700, color: DXC.midnightBlue }}>{snCaseNumber}</Typography>
                    </Box>
                  </Box>
                )}

                {!isAuthenticated && (
                  <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.45)', fontStyle: 'italic' }}>
                    Connect to ServiceNow from the Dashboard to create live cases.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Document Landing Zone */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  mb: 2.5,
                  pb: 1.5,
                  borderBottom: '2px solid #F6F3F0',
                }}
              >
                Document Landing Zone
              </Typography>

              {/* Drop zone */}
              <Box
                sx={{
                  border: `2px dashed rgba(73,149,255,0.35)`,
                  borderRadius: '12px',
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: 'rgba(73,149,255,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  mb: 2.5,
                  '&:hover': {
                    borderColor: DXC.trueBlue,
                    backgroundColor: 'rgba(73,149,255,0.06)',
                  },
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 36, color: DXC.trueBlue, mb: 1, opacity: 0.7 }} />
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#0E1020', mb: 0.5 }}>
                  Drop files here or click to upload
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(14,16,32,0.45)' }}>
                  PDF, TIFF, JPEG · Max 25 MB per file · Multiple files supported
                </Typography>
              </Box>

              {/* Document list */}
              <Typography variant="overline" sx={{ fontSize: '0.65rem', color: 'rgba(14,16,32,0.45)', display: 'block', mb: 1 }}>
                {documents.length} Document{documents.length !== 1 ? 's' : ''} Attached
              </Typography>
              <List disablePadding>
                {documents.map((doc, idx) => (
                  <Box key={doc.id}>
                    {idx > 0 && <Divider sx={{ my: 1 }} />}
                    <ListItem
                      disablePadding
                      sx={{ py: 0.75 }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IDPStatusChip status={doc.idpStatus} />
                          {doc.idpStatus === 'complete' && (
                            <IconButton
                              size="small"
                              onClick={() => navigate('/extraction')}
                              sx={{ color: DXC.trueBlue }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <IDPStatusIcon status={doc.idpStatus} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#0E1020' }}>
                            {doc.name}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.5)' }}>
                            {doc.type} · {doc.sizeMB} MB · {doc.pageCount} page{doc.pageCount !== 1 ? 's' : ''}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: summary */}
        <Grid item xs={12} lg={5}>
          {/* Quick summary card */}
          <Card
            sx={{
              background: `linear-gradient(160deg, ${DXC.midnightBlue} 0%, #1a1e3a 100%)`,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: DXC.sky,
                  mb: 2,
                }}
              >
                Intake Summary
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Case ID',     value: snCaseNumber ?? activeCase.id },
                  { label: 'Transaction', value: selectedTxnType?.displayName ?? activeCase.transactionType },
                  { label: 'Channel',     value: CHANNEL_SOURCES.find((c) => c.value === channelSource)?.label ?? channelSource },
                  { label: 'Policy',      value: policyNumber || '—' },
                  { label: 'Documents',   value: `${documents.length} attached` },
                  {
                    label: 'IDP Status',
                    value: documents.every((d) => d.idpStatus === 'complete') ? 'All complete' : 'Processing…',
                  },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.82rem', fontWeight: 600, color: DXC.white }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Framework layer trace */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  mb: 2,
                }}
              >
                L&A Framework — Layer 1
              </Typography>
              {[
                { label: 'Channel Classification', done: true },
                { label: 'Case Shell Created',     done: caseCreated || !isAuthenticated },
                { label: 'Document Landing',       done: true },
                { label: 'IDP Trigger',            done: true },
                { label: 'Policy Data Fetch',      done: true },
              ].map((step) => (
                <Box key={step.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <CheckCircleIcon sx={{ fontSize: 15, color: step.done ? DXC.stp : 'rgba(14,16,32,0.2)', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.8rem', color: step.done ? '#0E1020' : 'rgba(14,16,32,0.4)', fontWeight: step.done ? 500 : 400 }}>
                    {step.label}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Alert
            severity={caseCreated ? 'success' : 'info'}
            sx={{
              borderRadius: '12px',
              backgroundColor: caseCreated ? 'rgba(22,163,74,0.08)' : '#dbeafe',
              border: `1px solid ${caseCreated ? 'rgba(22,163,74,0.25)' : 'rgba(73,149,255,0.3)'}`,
              '& .MuiAlert-icon': { color: caseCreated ? DXC.stp : DXC.trueBlue },
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0E1020', mb: 0.25 }}>
              {caseCreated ? `Case ${snCaseNumber} Ready` : 'IDP Extraction Complete'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.65)' }}>
              {caseCreated
                ? 'Case created in ServiceNow. Proceed to IDP Extraction to review and validate extracted entities.'
                : `${documents.filter((d) => d.idpStatus === 'complete').length} of ${documents.length} documents processed. Proceed to IDP Extraction to review and validate extracted entities.`
              }
            </Typography>
          </Alert>

          <Button
            variant="contained"
            size="large"
            fullWidth
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/extraction')}
            disabled={isAuthenticated && !caseCreated}
            sx={{ py: 1.5 }}
          >
            Proceed to IDP Extraction
          </Button>
          {isAuthenticated && !caseCreated && (
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.45)', textAlign: 'center', mt: 1 }}>
              Create the case in ServiceNow first to proceed.
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
