import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EmailIcon from '@mui/icons-material/Email';
import { useCase } from '../context/CaseContext';
import { TouchLevelBadge } from '../components/shared/TouchLevelBadge';
import { DXC } from '../theme/dxcTheme';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { activeCase, triageResult, workflowEvents, scenario, resetScenario, snCaseNumber } = useCase();

  const displayCaseId = snCaseNumber ?? activeCase.id;

  const isLoan = scenario === 'loan';

  const confirmationNumber = `CONF-${Date.now().toString().slice(-8)}`;

  const steps = [
    { label: 'Case intake received', done: true },
    { label: 'IDP extraction complete', done: true },
    { label: 'Entity validation complete', done: true },
    { label: 'Triage engine evaluated', done: true },
    { label: 'Processor review complete', done: true },
    { label: 'Admin system submission queued', done: true },
    { label: 'Confirmation generated', done: true },
  ];

  return (
    <Box>
      {/* Hero section */}
      <Card
        sx={{
          background: `linear-gradient(135deg, ${DXC.midnightBlue} 0%, #1a1e3a 60%, #0d2847 100%)`,
          mb: 3,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${DXC.sky}22 0%, transparent 70%)`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: 100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${DXC.trueBlue}18 0%, transparent 70%)`,
          }}
        />

        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'rgba(22,163,74,0.2)',
                border: '2px solid rgba(22,163,74,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 28, color: '#4ade80' }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: DXC.white,
                  lineHeight: 1,
                }}
              >
                Transaction Approved
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                Submitted to admin system for processing
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)', mb: 0.25 }}>
                Confirmation No.
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: DXC.sky,
                  letterSpacing: '0.04em',
                }}
              >
                {confirmationNumber}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>Case</Typography>
                {snCaseNumber && (
                  <Chip
                    label="ServiceNow"
                    size="small"
                    sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, backgroundColor: 'rgba(73,149,255,0.25)', color: DXC.sky, letterSpacing: '0.03em' }}
                  />
                )}
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: DXC.white }}>{displayCaseId}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
            {triageResult && <TouchLevelBadge level={triageResult.touchLevel} />}
            <Box sx={{ ml: 'auto' }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                {new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left: Transaction summary */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  mb: 2,
                  pb: 1.5,
                  borderBottom: '2px solid #F6F3F0',
                }}
              >
                Transaction Summary
              </Typography>
              {[
                { label: 'Case ID', value: displayCaseId },
                { label: 'Policy / Contract', value: activeCase.policyNumber },
                { label: 'Owner', value: activeCase.ownerName },
                { label: 'Transaction Type', value: activeCase.transactionType },
                { label: 'Channel', value: activeCase.channelSource },
                { label: isLoan ? 'Loan Amount' : 'Withdrawal Amount', value: isLoan ? '$75,000.00' : '$5,000.00' },
                { label: isLoan ? 'Net Disbursement' : 'Net Distribution', value: isLoan ? '$75,000.00 (EFT)' : '$4,500.00 (EFT)' },
                ...(isLoan ? [{ label: 'New Loan Balance', value: '$85,000.00' }] : []),
                { label: 'Federal Withholding', value: isLoan ? 'N/A (Loan)' : '$500.00 (10%)' },
              ].map((row) => (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid rgba(14,16,32,0.06)' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'rgba(14,16,32,0.55)' }}>{row.label}</Typography>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{row.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Next steps */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  mb: 2,
                }}
              >
                Next Steps
              </Typography>
              <List dense disablePadding>
                {[
                  { icon: <ReceiptIcon sx={{ fontSize: 16, color: DXC.trueBlue }} />, text: 'Admin system transaction confirmation will be generated within 1 business day' },
                  { icon: <EmailIcon sx={{ fontSize: 16, color: DXC.trueBlue }} />, text: isLoan ? 'Loan confirmation letter will be mailed to owner within 3 business days' : 'Withdrawal confirmation and tax statement will be mailed within 5 business days' },
                  { icon: <CheckCircleIcon sx={{ fontSize: 16, color: DXC.stp }} />, text: isLoan ? 'EFT disbursement will be initiated within 2–3 business days' : 'EFT distribution will be processed within 3–5 business days' },
                ].map((item, idx) => (
                  <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={<Typography sx={{ fontSize: '0.8rem', color: '#0E1020' }}>{item.text}</Typography>} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Workflow timeline + framework trace */}
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  mb: 2,
                  pb: 1.5,
                  borderBottom: '2px solid #F6F3F0',
                }}
              >
                Case Processing Timeline
              </Typography>
              {workflowEvents.map((evt, idx) => (
                <Box
                  key={evt.id}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    mb: idx < workflowEvents.length - 1 ? 2 : 0,
                    position: 'relative',
                  }}
                >
                  {/* Timeline line */}
                  {idx < workflowEvents.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 11,
                        top: 24,
                        bottom: -16,
                        width: 2,
                        backgroundColor: 'rgba(73,149,255,0.2)',
                        zIndex: 0,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: DXC.trueBlue,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 14, color: DXC.white }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0E1020', lineHeight: 1.3 }}>
                      {evt.description}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: 'rgba(14,16,32,0.4)', mt: 0.25 }}>
                      {new Date(evt.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })} · {evt.actor}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {/* Final step */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: DXC.stp, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircleIcon sx={{ fontSize: 14, color: DXC.white }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: DXC.stp }}>
                    Transaction approved and submitted to admin system
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: 'rgba(14,16,32,0.4)', mt: 0.25 }}>
                    {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })} · Processor
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* L&A Framework trace */}
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
                L&A Framework — All Layers Complete
              </Typography>
              <Grid container spacing={1.5}>
                {steps.map((step, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 15, color: '#4ade80' }} />
                      <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                        {step.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom CTA */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => {
            resetScenario();
            navigate('/');
          }}
          sx={{ py: 1.25 }}
        >
          Start New Case
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/triage')}
          sx={{ py: 1.25 }}
        >
          Back to Triage Engine
        </Button>
      </Box>
    </Box>
  );
}
