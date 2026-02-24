import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Checkbox,
  FormControlLabel,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Alert,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EscalateIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import SendIcon from '@mui/icons-material/Send';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { snPatch } from '../services/snApiClient';
import { TriageDecisionCard } from '../components/shared/TriageDecisionCard';
import { DigitalSynopsis } from '../components/shared/DigitalSynopsis';
import { DXC } from '../theme/dxcTheme';

type FlagItem = {
  id: string;
  severity: 'warning' | 'info';
  title: string;
  detail: string;
  idpValue?: string;
  policyValue?: string;
  resolved: boolean;
  resolution?: string;
};

function buildFlaggedItems(scenario: string): FlagItem[] {
  if (scenario === 'loan') {
    return [
      {
        id: 'FLAG-001',
        severity: 'warning',
        title: 'Existing loan balance present',
        detail: 'Policy has an existing loan of $10,000.00. Combined with new request, total loan exposure is $85,000 (77.3% of CSV).',
        idpValue: 'New Loan requested',
        policyValue: '$10,000.00 outstanding',
        resolved: false,
      },
      {
        id: 'FLAG-002',
        severity: 'warning',
        title: 'Mailing address discrepancy',
        detail: 'Address on submitted form differs from policy record. Potential address change request embedded in loan form.',
        idpValue: '1842 Oakridge Drive, Atlanta, GA 30301',
        policyValue: '1842 Oakridge Dr, Atlanta, GA 30301',
        resolved: false,
      },
      {
        id: 'FLAG-003',
        severity: 'info',
        title: 'Loan amount is 68.2% of maximum available',
        detail: 'Requested $75,000 against max available of $110,000. Within acceptable range but requires confirmation per policy guidelines.',
        idpValue: '$75,000.00',
        policyValue: 'Max: $110,000.00',
        resolved: false,
      },
    ];
  }
  return [
    {
      id: 'FLAG-001',
      severity: 'info',
      title: 'Withdrawal within free corridor — confirm eligibility',
      detail: 'Requested $5,000 is within the $18,000 free withdrawal corridor. Confirm no prior withdrawals this contract year have reduced the available amount.',
      idpValue: '$5,000.00 withdrawal',
      policyValue: 'Free withdrawal available: $18,000.00',
      resolved: false,
    },
  ];
}

export function ModerateTouchPage() {
  const navigate = useNavigate();
  const { goodOrderChecks, updateGoodOrderCheck, triageResult, addWorkflowEvent, scenario, snSysId, snCaseNumber } = useCase();
  const { isAuthenticated } = useAuth();

  const [flagItems, setFlagItems] = useState<FlagItem[]>(buildFlaggedItems(scenario));
  const [nigoReason, setNigoReason] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [showNigo, setShowNigo] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [approved, setApproved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!triageResult) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ mb: 2, color: 'rgba(14,16,32,0.55)' }}>
          Triage has not been run yet.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/triage')}>
          Go to Triage
        </Button>
      </Box>
    );
  }

  const resolveFlag = (id: string, resolution: string) => {
    setFlagItems((prev) =>
      prev.map((f) => (f.id === id ? { ...f, resolved: true, resolution } : f))
    );
  };

  const allFlagsResolved = flagItems.every((f) => f.resolved);
  const requiredChecks = goodOrderChecks.filter((c) => c.required);
  const passedChecks = requiredChecks.filter((c) => c.status === 'pass').length;
  const checklistComplete = requiredChecks.every((c) => c.status === 'pass');

  const canApprove = allFlagsResolved && checklistComplete;

  const handleApprove = async () => {
    setApproved(true);
    addWorkflowEvent('CASE_APPROVED', `Moderate-touch review complete. All flagged items resolved. Case approved.`);
    if (snSysId && isAuthenticated) {
      setActionLoading(true);
      try {
        const result = await snPatch<{ result: { sys_id: string; number: string } }>(
          `/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals/${snSysId}`,
          { state: 'Resolved', stage: 'Resolution' }
        );
        console.log('[ModerateTouch] PATCH approved — sys_id:', result?.result?.sys_id, 'number:', result?.result?.number);
      } catch (err) {
        console.error('[ModerateTouch] PATCH failed:', err);
      } finally {
        setActionLoading(false);
      }
    }
    setTimeout(() => navigate('/confirmation'), 1200);
  };

  const handleEscalate = async () => {
    addWorkflowEvent('ESCALATED', `Case escalated to High Touch. Reason: ${escalateReason}`);
    if (snSysId && isAuthenticated) {
      try {
        const result = await snPatch<{ result: { sys_id: string; number: string } }>(
          `/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals/${snSysId}`,
          { touch_level: 'HIGH', stage: 'Triage' }
        );
        console.log('[ModerateTouch] PATCH escalate — sys_id:', result?.result?.sys_id);
      } catch (err) {
        console.error('[ModerateTouch] PATCH escalate failed:', err);
      }
    }
    navigate('/processing/high');
  };

  const handleNigo = async () => {
    addWorkflowEvent('NIGO_SENT', `NIGO correspondence sent to customer. Reason: ${nigoReason}`);
    if (snSysId && isAuthenticated) {
      try {
        const result = await snPatch<{ result: { sys_id: string; number: string } }>(
          `/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals/${snSysId}`,
          { state: 'Pending', stage: 'Validation' }
        );
        console.log('[ModerateTouch] PATCH NIGO — sys_id:', result?.result?.sys_id);
      } catch (err) {
        console.error('[ModerateTouch] PATCH NIGO failed:', err);
      }
    }
    setShowNigo(false);
  };

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
            Moderate-Touch Workspace
          </Typography>
          <Chip
            label="Secondary Validation"
            size="small"
            sx={{ backgroundColor: '#fef9c3', color: '#b45309', fontWeight: 700, fontSize: '0.68rem', height: 22 }}
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
          Review flagged items, confirm good-order checks, and approve or escalate.
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

      <Grid container spacing={3}>
        {/* Left: Flagged Items */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  sx={{
                    fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Flagged Items
                </Typography>
                <Chip
                  label={`${flagItems.filter((f) => !f.resolved).length} pending`}
                  size="small"
                  sx={{
                    backgroundColor: flagItems.every((f) => f.resolved) ? '#dcfce7' : '#fef9c3',
                    color: flagItems.every((f) => f.resolved) ? DXC.stp : '#b45309',
                    fontWeight: 700,
                    fontSize: '0.68rem',
                    height: 22,
                  }}
                />
              </Box>

              {flagItems.map((flag) => (
                <Accordion
                  key={flag.id}
                  defaultExpanded={!flag.resolved}
                  sx={{
                    mb: 1,
                    border: flag.resolved
                      ? '1px solid rgba(22,163,74,0.25)'
                      : flag.severity === 'warning'
                      ? '1px solid rgba(255,174,65,0.35)'
                      : '1px solid rgba(73,149,255,0.25)',
                    backgroundColor: flag.resolved
                      ? 'rgba(22,163,74,0.04)'
                      : flag.severity === 'warning'
                      ? 'rgba(255,174,65,0.04)'
                      : 'rgba(73,149,255,0.04)',
                    '&:before': { display: 'none' },
                    borderRadius: '10px !important',
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: '48px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                      {flag.resolved ? (
                        <CheckCircleIcon sx={{ fontSize: 18, color: DXC.stp }} />
                      ) : (
                        <WarningAmberIcon
                          sx={{
                            fontSize: 18,
                            color: flag.severity === 'warning' ? DXC.gold : DXC.trueBlue,
                          }}
                        />
                      )}
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: flag.resolved ? DXC.stp : '#0E1020',
                            textDecoration: flag.resolved ? 'line-through' : 'none',
                          }}
                        >
                          {flag.title}
                        </Typography>
                        {flag.resolved && (
                          <Typography sx={{ fontSize: '0.72rem', color: DXC.stp }}>
                            Resolved: {flag.resolution}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'rgba(14,16,32,0.7)', mb: 1.5 }}>
                      {flag.detail}
                    </Typography>

                    {(flag.idpValue || flag.policyValue) && (
                      <Grid container spacing={1} sx={{ mb: 1.5 }}>
                        {flag.idpValue && (
                          <Grid item xs={6}>
                            <Box sx={{ p: 1, borderRadius: '8px', backgroundColor: '#dbeafe', border: '1px solid rgba(73,149,255,0.2)' }}>
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: DXC.trueBlue, mb: 0.25 }}>IDP Extracted</Typography>
                              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0E1020' }}>{flag.idpValue}</Typography>
                            </Box>
                          </Grid>
                        )}
                        {flag.policyValue && (
                          <Grid item xs={6}>
                            <Box sx={{ p: 1, borderRadius: '8px', backgroundColor: '#e0e7ff', border: '1px solid rgba(0,74,172,0.2)' }}>
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: DXC.royalBlue, mb: 0.25 }}>Policy System</Typography>
                              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0E1020' }}>{flag.policyValue}</Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    )}

                    {!flag.resolved && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => resolveFlag(flag.id, 'Confirmed as valid')}
                          sx={{ fontSize: '0.72rem', backgroundColor: DXC.stp, '&:hover': { backgroundColor: '#15803d' }, borderRadius: '8px' }}
                        >
                          Confirm as Valid
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => resolveFlag(flag.id, 'Minor discrepancy — acceptable')}
                          sx={{ fontSize: '0.72rem', borderRadius: '8px', borderColor: DXC.gold, color: '#b45309' }}
                        >
                          Acceptable Discrepancy
                        </Button>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Good Order Checklist + actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography
                  sx={{
                    fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Good Order Checklist
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: checklistComplete ? DXC.stp : 'rgba(14,16,32,0.55)' }}>
                  {passedChecks} / {requiredChecks.length}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={(passedChecks / requiredChecks.length) * 100}
                sx={{ mb: 2 }}
              />

              {goodOrderChecks.map((check) => (
                <Box
                  key={check.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    mb: 1,
                    py: 0.75,
                    px: 1,
                    borderRadius: '8px',
                    backgroundColor:
                      check.status === 'pass'
                        ? 'rgba(22,163,74,0.05)'
                        : check.status === 'fail'
                        ? 'rgba(209,70,0,0.05)'
                        : 'rgba(14,16,32,0.03)',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={check.status === 'pass'}
                        onChange={(e) => updateGoodOrderCheck(check.id, e.target.checked ? 'pass' : 'pending')}
                        size="small"
                        sx={{ color: DXC.trueBlue, '&.Mui-checked': { color: DXC.stp } }}
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: check.status === 'pass' ? DXC.stp : '#0E1020',
                            textDecoration: check.status === 'pass' ? 'line-through' : 'none',
                          }}
                        >
                          {check.description}
                        </Typography>
                        {check.notes && (
                          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(14,16,32,0.5)', fontStyle: 'italic' }}>
                            {check.notes}
                          </Typography>
                        )}
                        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(14,16,32,0.35)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {check.category} · {check.required ? 'Required' : 'Optional'}
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Action panel */}
          <Card sx={{ background: `linear-gradient(135deg, ${DXC.midnightBlue} 0%, #1a1e3a 100%)` }}>
            <CardContent sx={{ p: 2.5 }}>
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

              {!canApprove && (
                <Alert
                  severity="warning"
                  sx={{
                    mb: 2,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,174,65,0.15)',
                    border: '1px solid rgba(255,174,65,0.3)',
                    '& .MuiAlert-icon': { color: DXC.gold },
                  }}
                >
                  <Typography sx={{ fontSize: '0.78rem', color: DXC.white }}>
                    {!allFlagsResolved
                      ? `Resolve ${flagItems.filter((f) => !f.resolved).length} flagged item${flagItems.filter((f) => !f.resolved).length !== 1 ? 's' : ''} before approving`
                      : `Complete all ${requiredChecks.filter((c) => c.status !== 'pass').length} remaining checklist items`}
                  </Typography>
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                endIcon={actionLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CheckCircleIcon />}
                onClick={handleApprove}
                disabled={!canApprove || approved || actionLoading}
                sx={{
                  mb: 1.5,
                  py: 1.5,
                  backgroundColor: DXC.stp,
                  '&:hover': { backgroundColor: '#15803d' },
                  '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
                }}
              >
                Approve All &amp; Submit
              </Button>

              {showEscalate ? (
                <Box sx={{ mb: 1.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Reason for escalation (required)"
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    sx={{ mb: 1, '& input': { color: DXC.white, '&::placeholder': { color: 'rgba(255,255,255,0.4)' } }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleEscalate}
                      disabled={!escalateReason.trim()}
                      sx={{ flex: 1, backgroundColor: DXC.gold, color: '#0E1020', '&:hover': { backgroundColor: '#e9991a' } }}
                    >
                      Confirm Escalate
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => setShowEscalate(false)} sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  fullWidth
                  size="medium"
                  startIcon={<EscalateIcon />}
                  onClick={() => setShowEscalate(true)}
                  sx={{ mb: 1, borderColor: 'rgba(255,255,255,0.3)', color: DXC.white, '&:hover': { borderColor: DXC.gold, color: DXC.gold } }}
                >
                  Escalate to High Touch
                </Button>
              )}

              {showNigo ? (
                <Box>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    placeholder="NIGO reason / items needed from customer"
                    value={nigoReason}
                    onChange={(e) => setNigoReason(e.target.value)}
                    sx={{ mb: 1, '& textarea': { color: DXC.white, '&::placeholder': { color: 'rgba(255,255,255,0.4)' } }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleNigo}
                      disabled={!nigoReason.trim()}
                      sx={{ flex: 1, backgroundColor: DXC.melon, color: DXC.white, '&:hover': { backgroundColor: '#e6603a' } }}
                    >
                      Send NIGO
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => setShowNigo(false)} sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  fullWidth
                  size="medium"
                  startIcon={<SendIcon />}
                  onClick={() => setShowNigo(true)}
                  sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: DXC.melon, color: DXC.melon } }}
                >
                  Send NIGO to Customer
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
