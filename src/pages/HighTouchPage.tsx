import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CalculateIcon from '@mui/icons-material/Calculate';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GavelIcon from '@mui/icons-material/Gavel';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { snPatch } from '../services/snApiClient';
import { TriageDecisionCard } from '../components/shared/TriageDecisionCard';
import { ConfidenceBadge } from '../components/shared/ConfidenceBadge';
import { DigitalSynopsis } from '../components/shared/DigitalSynopsis';
import { DXC } from '../theme/dxcTheme';

function formatTs(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function HighTouchPage() {
  const navigate = useNavigate();
  const {
    idpEntities,
    policyEntities,
    workflowEvents,
    triageResult,
    addWorkflowEvent,
    scenario,
    snSysId,
    snCaseNumber,
  } = useCase();
  const { isAuthenticated } = useAuth();

  const [loanAmount, setLoanAmount] = useState(75000);
  const [interestRate] = useState(5.5);
  const [action, setAction] = useState<string>('');
  const [actionNotes, setActionNotes] = useState('');
  const [approved, setApproved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!triageResult) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ mb: 2, color: 'rgba(14,16,32,0.55)' }}>
          Triage has not been run yet.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/triage')}>Go to Triage</Button>
      </Box>
    );
  }

  const isLoan = scenario === 'loan';

  // Loan calculations
  const existingLoan = 10000;
  const newTotalLoan = loanAmount + existingLoan;
  const annualInterest = newTotalLoan * (interestRate / 100);
  const netDisbursement = loanAmount;
  const csvPct = ((newTotalLoan / 120000) * 100).toFixed(1);

  // Withdrawal calculations
  const withdrawalAmount = 5000;
  const federalWH = withdrawalAmount * 0.1;
  const netDistribution = withdrawalAmount - federalWH;
  const freeWDRemaining = 18000 - withdrawalAmount;

  const handleApprove = async () => {
    if (!actionNotes.trim() && action !== 'APPROVE') return;
    setApproved(true);
    addWorkflowEvent('CASE_APPROVED', `High-touch review complete. Action: ${action}. Notes: ${actionNotes}`);
    if (snSysId && isAuthenticated) {
      setActionLoading(true);
      try {
        const patchBody: Record<string, string> = {};
        if (action === 'APPROVE' || action === 'APPROVE_WITH_MOD') {
          patchBody.state = 'Resolved'; patchBody.stage = 'Resolution';
        } else if (action === 'REJECT') {
          patchBody.state = 'Closed Incomplete'; patchBody.stage = 'Resolution';
        } else if (action === 'RETURN_NIGO') {
          patchBody.state = 'Pending'; patchBody.stage = 'Validation';
        } else if (action === 'SUPERVISOR') {
          patchBody.state = 'Work in progress'; patchBody.stage = 'Review';
        }
        const result = await snPatch<{ result: { sys_id: string; number: string } }>(
          `/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals/${snSysId}`,
          patchBody
        );
        console.log('[HighTouch] PATCH action:', action, '— sys_id:', result?.result?.sys_id, 'number:', result?.result?.number);
      } catch (err) {
        console.error('[HighTouch] PATCH failed:', err);
      } finally {
        setActionLoading(false);
      }
    }
    setTimeout(() => navigate('/confirmation'), 1200);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
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
            High-Touch Workspace
          </Typography>
          <Chip
            label="Manual Review"
            size="small"
            sx={{ backgroundColor: '#fee2e2', color: DXC.red, fontWeight: 700, fontSize: '0.68rem', height: 22 }}
          />
          {snCaseNumber && (
            <Chip
              label={snCaseNumber}
              size="small"
              sx={{ backgroundColor: '#f0fdf4', color: DXC.stp, fontWeight: 700, fontSize: '0.68rem', height: 22, border: `1px solid ${DXC.stp}33` }}
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(14,16,32,0.55)' }}>
          Full manual review — document viewer, entity comparison, financial calculator, and action panel.
        </Typography>
      </Box>

      {/* Triage decision card */}
      <TriageDecisionCard result={triageResult} />

      {approved && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2.5, borderRadius: '12px', backgroundColor: '#dcfce7', border: '1px solid rgba(22,163,74,0.3)', '& .MuiAlert-icon': { color: DXC.stp } }}>
          <Typography sx={{ fontWeight: 700, color: '#0E1020' }}>Case approved — submitting to admin system</Typography>
        </Alert>
      )}

      <DigitalSynopsis />

      {/* Four-panel layout */}
      <Grid container spacing={2.5}>
        {/* Panel 1: Document Viewer (top-left) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 420 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Document Viewer
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label="Page 1 / 2" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                  <Chip label={isLoan ? 'LF-LOAN-2024' : 'ANN-WD-2024'} size="small" sx={{ backgroundColor: '#dbeafe', color: DXC.trueBlue, fontSize: '0.65rem', height: 20, fontWeight: 600 }} />
                </Box>
              </Box>

              {/* Simulated form document */}
              <Box
                sx={{
                  flex: 1,
                  border: '1px solid rgba(14,16,32,0.12)',
                  borderRadius: '10px',
                  overflow: 'auto',
                  backgroundColor: '#FAFAFA',
                  p: 2,
                  fontFamily: 'Georgia, serif',
                  fontSize: '0.72rem',
                }}
              >
                {/* Document header */}
                <Box sx={{ textAlign: 'center', borderBottom: '2px solid #333', pb: 1, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {isLoan ? 'POLICY LOAN REQUEST' : 'ANNUITY WITHDRAWAL REQUEST'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', fontFamily: 'Georgia, serif', color: 'rgba(14,16,32,0.5)' }}>
                    {isLoan ? 'Form LF-LOAN-2024 · Rev 09/2024' : 'Form ANN-WD-2024 · Rev 09/2024'}
                  </Typography>
                </Box>

                {/* Fields */}
                {[
                  ['Policy No.', isLoan ? 'LF-2024-089423' : 'ANN-2024-034891'],
                  ['Owner', isLoan ? 'James R. Whitfield' : 'Patricia M. Chen'],
                  ['DOB', isLoan ? '09/12/1962' : '05/08/1955'],
                  ['SSN (Last 4)', isLoan ? '7823' : '4217'],
                  [isLoan ? 'Loan Amount' : 'Withdrawal Amount', isLoan ? '$75,000.00' : '$5,000.00'],
                  [isLoan ? 'Loan Type' : 'Withdrawal Type', isLoan ? 'New Loan' : 'Partial'],
                  ['Payment Method', 'EFT — Checking'],
                  ['Federal W/H', '10%'],
                  ['Date Signed', isLoan ? '02/18/2026' : '02/19/2026'],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex', borderBottom: '1px dotted #ccc', py: 0.35 }}>
                    <Typography sx={{ width: 120, fontSize: '0.68rem', color: 'rgba(14,16,32,0.5)', fontFamily: 'Georgia, serif', flexShrink: 0 }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, fontFamily: 'Georgia, serif' }}>{value}</Typography>
                  </Box>
                ))}

                <Box sx={{ mt: 2, borderTop: '1px solid #999', pt: 1.5, display: 'flex', gap: 3 }}>
                  <Box sx={{ flex: 2 }}>
                    <Box sx={{ borderBottom: '1px solid #333', height: 24, mb: 0.5 }}>
                      <Typography sx={{ fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: '0.72rem' }}>
                        {isLoan ? 'J. R. Whitfield' : 'P. M. Chen'}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.6rem', fontFamily: 'Georgia, serif', color: '#666' }}>Owner Signature</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ borderBottom: '1px solid #333', height: 24, mb: 0.5 }}>
                      <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: '0.72rem' }}>
                        {isLoan ? '02/18/2026' : '02/19/2026'}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.6rem', fontFamily: 'Georgia, serif', color: '#666' }}>Date</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel 2: Entity Comparison (top-right) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 420 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1.5 }}>
                Entity Comparison
              </Typography>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#F6F3F0' }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#dbeafe', color: DXC.trueBlue }}>IDP Extracted</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#e0e7ff', color: DXC.royalBlue }}>Policy System</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#F6F3F0' }}>Conf.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {idpEntities.map((entity) => {
                      const isMismatch = entity.matchStatus === 'mismatch';
                      return (
                        <TableRow
                          key={entity.fieldName}
                          sx={{
                            backgroundColor: isMismatch ? 'rgba(255,174,65,0.06)' : 'transparent',
                            '&:hover': { backgroundColor: 'rgba(73,149,255,0.04)' },
                          }}
                        >
                          <TableCell sx={{ py: 0.75, fontSize: '0.75rem', fontWeight: 600 }}>
                            {entity.displayName}
                          </TableCell>
                          <TableCell sx={{ py: 0.75, fontSize: '0.78rem', fontWeight: 600 }}>
                            {entity.extractedValue}
                          </TableCell>
                          <TableCell sx={{ py: 0.75, fontSize: '0.78rem' }}>
                            {entity.policyValue ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {isMismatch && <WarningAmberIcon sx={{ fontSize: 13, color: DXC.gold }} />}
                                {entity.policyValue}
                              </Box>
                            ) : (
                              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.35)', fontStyle: 'italic' }}>N/A</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 0.75 }}>
                            <ConfidenceBadge score={entity.confidenceScore} size="sm" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel 3: Financial Calculator (bottom-left) */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalculateIcon sx={{ color: DXC.trueBlue, fontSize: 20 }} />
                <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Financial Calculator
                </Typography>
              </Box>

              {isLoan ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(14,16,32,0.5)', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Loan Amount</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value.replace(/[^0-9]/g, '')))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'rgba(14,16,32,0.55)' }}>$</Typography> }}
                        sx={{ '& input': { fontWeight: 700, fontSize: '0.9rem' } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(14,16,32,0.5)', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Interest Rate</Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={`${interestRate}%`}
                        InputProps={{ readOnly: true }}
                        sx={{ '& input': { fontWeight: 700, fontSize: '0.9rem', color: 'rgba(14,16,32,0.6)' } }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#F6F3F0' }}>
                    {[
                      { label: 'Requested Loan Amount', value: `$${loanAmount.toLocaleString()}`, highlight: false },
                      { label: 'Existing Loan Balance', value: `$${existingLoan.toLocaleString()}`, highlight: false },
                      { label: 'Total Loan After Disbursement', value: `$${newTotalLoan.toLocaleString()}`, highlight: true },
                      { label: 'Net Disbursement to Owner', value: `$${netDisbursement.toLocaleString()}`, highlight: false },
                      { label: 'Annual Interest Accrual', value: `$${annualInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: false },
                      { label: '% of CSV ($120,000)', value: `${csvPct}%`, highlight: Number(csvPct) > 75 },
                    ].map((row) => (
                      <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderBottom: '1px solid rgba(14,16,32,0.06)' }}>
                        <Typography sx={{ fontSize: '0.78rem', color: 'rgba(14,16,32,0.6)' }}>{row.label}</Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: row.highlight ? DXC.gold : '#0E1020' }}>{row.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#F6F3F0' }}>
                  {[
                    { label: 'Withdrawal Amount', value: `$${withdrawalAmount.toLocaleString()}` },
                    { label: 'Federal Withholding (10%)', value: `-$${federalWH.toLocaleString()}` },
                    { label: 'Net Distribution', value: `$${netDistribution.toLocaleString()}`, bold: true },
                    { label: 'Surrender Charge', value: '$0.00 (free corridor)' },
                    { label: 'Free Withdrawal Remaining', value: `$${freeWDRemaining.toLocaleString()}` },
                    { label: '% of Account Value', value: '2.78%' },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderBottom: '1px solid rgba(14,16,32,0.06)' }}>
                      <Typography sx={{ fontSize: '0.78rem', color: 'rgba(14,16,32,0.6)' }}>{row.label}</Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: (row as { bold?: boolean }).bold ? 800 : 700, color: '#0E1020' }}>{row.value}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Panel 4: Action & History (bottom-right) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: `linear-gradient(160deg, ${DXC.midnightBlue} 0%, #1a1e3a 100%)`, height: '100%' }}>
            <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GavelIcon sx={{ color: DXC.sky, fontSize: 18 }} />
                <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: DXC.sky }}>
                  Action Panel
                </Typography>
              </Box>

              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-focused': { color: DXC.sky } }}>
                  Select Action
                </InputLabel>
                <Select
                  value={action}
                  label="Select Action"
                  onChange={(e) => setAction(e.target.value)}
                  sx={{
                    color: DXC.white,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
                  }}
                >
                  <MenuItem value="APPROVE">Approve</MenuItem>
                  <MenuItem value="APPROVE_WITH_MOD">Approve with Modifications</MenuItem>
                  <MenuItem value="RETURN_NIGO">Return to Customer (NIGO)</MenuItem>
                  <MenuItem value="REJECT">Reject with Reason</MenuItem>
                  <MenuItem value="SUPERVISOR">Request Supervisory Override</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="Notes / reason (required for non-standard actions)"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                sx={{
                  mb: 2,
                  '& textarea': { color: DXC.white, fontSize: '0.82rem', '&::placeholder': { color: 'rgba(255,255,255,0.35)' } },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                }}
              />

              <Button
                variant="contained"
                fullWidth
                endIcon={actionLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <ArrowForwardIcon />}
                onClick={handleApprove}
                disabled={!action || approved || actionLoading}
                sx={{
                  mb: 2,
                  py: 1.25,
                  backgroundColor: action === 'APPROVE' ? DXC.stp : action === 'REJECT' ? DXC.red : action === 'RETURN_NIGO' ? DXC.melon : DXC.trueBlue,
                  '&:hover': { backgroundColor: action === 'APPROVE' ? '#15803d' : '#004AAC' },
                  '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
                }}
              >
                {action === 'APPROVE' ? 'Approve & Submit' : action === 'REJECT' ? 'Reject Case' : action === 'RETURN_NIGO' ? 'Send NIGO' : action === 'SUPERVISOR' ? 'Request Override' : 'Submit Action'}
              </Button>

              {/* Workflow history */}
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mb: 1.5 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <HistoryIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }} />
                  <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)' }}>
                    Workflow History
                  </Typography>
                </Box>
                <List dense disablePadding sx={{ overflow: 'auto', maxHeight: 160 }}>
                  {[...workflowEvents].reverse().map((evt) => (
                    <ListItem key={evt.id} disablePadding sx={{ mb: 0.75 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: DXC.sky, mt: 0.5 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: DXC.white, lineHeight: 1.3 }}>
                            {evt.description}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>
                            {formatTs(evt.timestamp)} · {evt.actor}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
