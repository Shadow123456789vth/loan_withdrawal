import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { snPatch } from '../services/snApiClient';
import { TriageDecisionCard } from '../components/shared/TriageDecisionCard';
import { KPICard } from '../components/shared/KPICard';
import { DXC } from '../theme/dxcTheme';

function PolicySnapshot() {
  const { policyEntities, scenario } = useCase();
  const financials = policyEntities.filter((e) => e.category === 'Financials');
  const status = policyEntities.find((e) => e.fieldName === 'policy_status');
  return (
    <Card>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography
          sx={{
            fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
            fontWeight: 500,
            fontSize: '0.82rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            mb: 2,
          }}
        >
          {scenario === 'loan' ? 'Policy Snapshot' : 'Contract Snapshot'}
        </Typography>
        {status && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(14,16,32,0.55)', fontWeight: 500 }}>
              {status.displayName}
            </Typography>
            <Chip
              label={String(status.value)}
              size="small"
              sx={{ backgroundColor: '#dcfce7', color: DXC.stp, fontWeight: 700, fontSize: '0.72rem', height: 22 }}
            />
          </Box>
        )}
        {financials.map((e) => (
          <Box key={e.fieldName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(14,16,32,0.55)' }}>
              {e.displayName}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0E1020' }}>
              {String(e.value)}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

export function LowTouchPage() {
  const navigate = useNavigate();
  const { activeCase, idpEntities, triageResult, addWorkflowEvent, scenario, snSysId, snCaseNumber } = useCase();
  const { isAuthenticated } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  if (!triageResult) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ mb: 2, color: 'rgba(14,16,32,0.55)' }}>
          Triage has not been run yet. Please complete the triage step first.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/triage')}>
          Go to Triage
        </Button>
      </Box>
    );
  }

  const handleApprove = async () => {
    setConfirmOpen(false);
    setApproved(true);
    addWorkflowEvent('CASE_APPROVED', `Case approved by processor. Touch level: ${triageResult.touchLevel}`);
    if (snSysId && isAuthenticated) {
      setApproveLoading(true);
      try {
        const result = await snPatch<{ result: { sys_id: string; number: string } }>(
          `/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals/${snSysId}`,
          { state: 'Resolved', stage: 'Resolution' }
        );
        console.log('[LowTouch] PATCH approved — sys_id:', result?.result?.sys_id, 'number:', result?.result?.number);
      } catch (err) {
        console.error('[LowTouch] PATCH failed:', err);
      } finally {
        setApproveLoading(false);
      }
    }
    setTimeout(() => navigate('/confirmation'), 1200);
  };

  const isLoan = scenario === 'loan';

  const kpiData = isLoan
    ? [
        { label: 'Requested Amount', value: '$75,000', subtext: 'New policy loan', accent: DXC.trueBlue },
        { label: 'Net Disbursement', value: '$75,000', subtext: 'EFT — Checking', accent: DXC.stp },
        { label: 'Policy Loan Balance', value: '$85,000', subtext: 'After disbursement', accent: DXC.gold },
        { label: 'Annual Interest', value: '$4,675', subtext: 'At 5.50% APR', accent: DXC.melon },
      ]
    : [
        { label: 'Withdrawal Amount', value: '$5,000', subtext: 'Partial withdrawal', accent: DXC.trueBlue },
        { label: 'Net Distribution', value: '$4,500', subtext: 'After 10% federal w/h', accent: DXC.stp },
        { label: 'Surrender Charge', value: '$0.00', subtext: 'Within free corridor', accent: DXC.stp },
        { label: 'Remaining Free WD', value: '$13,000', subtext: 'This contract year', accent: DXC.gold },
      ];

  const validatedEntities = idpEntities.filter((e) => e.validated);

  return (
    <Box>
      {/* Page header */}
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
            Low-Touch Workspace
          </Typography>
          <Chip
            label="Click & Approve"
            size="small"
            sx={{ backgroundColor: '#dbeafe', color: DXC.trueBlue, fontWeight: 700, fontSize: '0.68rem', height: 22 }}
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
          High-confidence transaction — review the summary and approve with a single action.
        </Typography>
      </Box>

      {/* Triage decision card */}
      <TriageDecisionCard result={triageResult} />

      {approved && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ mb: 2.5, borderRadius: '12px', backgroundColor: '#dcfce7', border: '1px solid rgba(22,163,74,0.3)', '& .MuiAlert-icon': { color: DXC.stp } }}
        >
          <Typography sx={{ fontWeight: 700, color: '#0E1020' }}>
            Case approved — submitting to admin system
          </Typography>
        </Alert>
      )}

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiData.map((kpi) => (
          <Grid item xs={6} sm={3} key={kpi.label}>
            <KPICard label={kpi.label} value={kpi.value} subtext={kpi.subtext} accentColor={kpi.accent} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Left: Transaction summary */}
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  mb: 2,
                  pb: 1.5,
                  borderBottom: '2px solid #F6F3F0',
                }}
              >
                Validated Transaction Summary
              </Typography>

              {(['identity', 'financial', 'payment', 'tax'] as const).map((group) => {
                const fields = validatedEntities.filter((e) => e.group === group);
                if (fields.length === 0) return null;
                const groupLabel = { identity: 'Identity', financial: 'Financial', payment: 'Payment', tax: 'Tax' }[group];
                return (
                  <Box key={group} sx={{ mb: 2.5 }}>
                    <Typography
                      variant="overline"
                      sx={{ fontSize: '0.65rem', color: 'rgba(14,16,32,0.4)', display: 'block', mb: 1 }}
                    >
                      {groupLabel}
                    </Typography>
                    {fields.map((entity) => (
                      <Box
                        key={entity.fieldName}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 0.75,
                          borderBottom: '1px solid rgba(14,16,32,0.06)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 14, color: DXC.stp }} />
                          <Typography sx={{ fontSize: '0.82rem', color: 'rgba(14,16,32,0.65)' }}>
                            {entity.displayName}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0E1020' }}>
                          {entity.extractedValue}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Policy snapshot + actions */}
        <Grid item xs={12} md={5}>
          <PolicySnapshot />

          <Card
            sx={{
              mt: 2.5,
              background: `linear-gradient(135deg, ${DXC.midnightBlue} 0%, #1a1e3a 100%)`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: DXC.sky,
                  mb: 2,
                }}
              >
                Processing Actions
              </Typography>

              <Button
                variant="contained"
                fullWidth
                size="large"
                endIcon={<CheckCircleIcon />}
                onClick={() => setConfirmOpen(true)}
                disabled={approved}
                sx={{
                  mb: 1.5,
                  py: 1.5,
                  backgroundColor: DXC.stp,
                  '&:hover': { backgroundColor: '#15803d' },
                  fontSize: '0.9rem',
                }}
              >
                Approve &amp; Submit
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="medium"
                startIcon={<OpenInNewIcon />}
                onClick={() => navigate('/processing/moderate')}
                sx={{ mb: 1, borderColor: 'rgba(255,255,255,0.3)', color: DXC.white, '&:hover': { borderColor: DXC.gold, color: DXC.gold } }}
              >
                Escalate to Moderate Touch
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="medium"
                startIcon={<CancelIcon />}
                sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: DXC.red, color: DXC.red } }}
              >
                Reject
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approval confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle
          sx={{
            fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            fontSize: '1rem',
            pb: 1,
          }}
        >
          Confirm Approval
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontSize: '0.9rem' }}>
            You are about to approve the following transaction for submission to the admin system:
          </Typography>
          {[
            { label: 'Case ID', value: snCaseNumber ?? activeCase.id },
            { label: 'Policy', value: activeCase.policyNumber },
            { label: 'Owner', value: activeCase.ownerName },
            { label: 'Transaction', value: activeCase.transactionType },
            { label: 'Amount', value: isLoan ? '$75,000.00' : '$5,000.00' },
            { label: 'Touch Level', value: triageResult.touchLevel },
          ].map((row) => (
            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid rgba(14,16,32,0.06)' }}>
              <Typography sx={{ fontSize: '0.82rem', color: 'rgba(14,16,32,0.55)' }}>{row.label}</Typography>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{row.value}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            disabled={approveLoading}
            endIcon={approveLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <ArrowForwardIcon />}
            sx={{ backgroundColor: DXC.stp, '&:hover': { backgroundColor: '#15803d' } }}
          >
            Confirm Approval
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
