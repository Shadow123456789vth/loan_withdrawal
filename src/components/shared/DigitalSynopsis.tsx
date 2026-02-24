import { Box, Typography, Card, CardContent, Grid, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useCase } from '../../context/CaseContext';
import { DXC } from '../../theme/dxcTheme';

type FlagStatus = 'pass' | 'fail' | 'review';

interface STPFlag {
  label: string;
  value: string;
  status: FlagStatus;
}

function FlagChip({ flag }: { flag: STPFlag }) {
  const cfg: Record<FlagStatus, { bg: string; color: string; icon: React.ReactNode }> = {
    pass:   { bg: '#dcfce7', color: DXC.stp,     icon: <CheckCircleIcon sx={{ fontSize: 12 }} /> },
    fail:   { bg: '#fee2e2', color: DXC.red,      icon: <CancelIcon sx={{ fontSize: 12 }} /> },
    review: { bg: '#fef9c3', color: '#b45309',    icon: <WarningAmberIcon sx={{ fontSize: 12 }} /> },
  };
  const { bg, color, icon } = cfg[flag.status];
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.4,
        borderRadius: '6px',
        backgroundColor: bg,
        border: `1px solid ${color}33`,
      }}
    >
      <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(14,16,32,0.45)', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {flag.label}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, lineHeight: 1.2 }}>
          {flag.value}
        </Typography>
      </Box>
    </Box>
  );
}

function DataRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.6, borderBottom: '1px solid rgba(14,16,32,0.05)' }}>
      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.5)' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: highlight ? DXC.trueBlue : '#0E1020' }}>
        {value}
      </Typography>
    </Box>
  );
}

export function DigitalSynopsis() {
  const { activeCase, policyEntities, idpEntities, scenario, snCaseNumber } = useCase();

  const isLoan = scenario === 'loan';

  // Helper: find IDP extracted value by field name
  const idp = (field: string) =>
    idpEntities.find((e) => e.fieldName === field)?.extractedValue ?? '—';

  // Helper: find policy entity value by field name
  const pol = (field: string) =>
    String(policyEntities.find((e) => e.fieldName === field)?.value ?? '—');

  // ── Policy / Contract panel ───────────────────────────────────────────────
  const policyRows = isLoan
    ? [
        { label: 'Policy Status',        value: pol('policy_status') },
        { label: 'Issue Date',            value: pol('policy_issue_date') },
        { label: 'Tax Qualification',     value: pol('tax_qualification') },
        { label: 'Cash Surrender Value',  value: pol('cash_surrender_value') },
        { label: 'Existing Loan Balance', value: pol('existing_loan_balance') },
        { label: 'Maximum Loan Available',value: pol('max_loan_available') },
        { label: 'Loan Interest Rate',    value: pol('loan_interest_rate') },
      ]
    : [
        { label: 'Contract Status',          value: pol('policy_status') },
        { label: 'Tax Qualification',        value: pol('tax_qualification') },
        { label: 'Account Value',            value: pol('account_value') },
        { label: 'Free Withdrawal Available',value: pol('free_withdrawal_amount') },
        { label: 'Surrender Charge',         value: pol('surrender_charge_rate') },
        { label: 'Surrender Charge Period',  value: pol('surrender_charge_period') },
        { label: 'Owner (System)',           value: pol('owner_name_policy') },
      ];

  // ── Request Details panel ─────────────────────────────────────────────────
  const requestRows = isLoan
    ? [
        { label: 'Owner Name',          value: idp('owner_name') },
        { label: 'Insured Name',        value: idp('insured_name') || activeCase.ownerName },
        { label: 'Loan Request Type',   value: idp('loan_request_type') },
        { label: 'Requested Amount',    value: idp('requested_amount'), highlight: true },
        { label: 'Disbursement Method', value: idp('payment_method') },
        { label: 'Alternate Payee',     value: idp('alternate_payee_name') },
        { label: 'Federal Withholding', value: idp('tax_withholding_federal') },
        { label: 'Signature Date',      value: idp('date_signed') },
      ]
    : [
        { label: 'Owner Name',           value: idp('owner_name') },
        { label: 'Form Date',            value: idp('form_date') },
        { label: 'Distribution Option',  value: idp('distribution_option') },
        { label: 'Withdrawal Amount',    value: idp('requested_amount'), highlight: true },
        { label: 'Net / Gross Election', value: idp('net_or_gross') },
        { label: 'Payment Method',       value: idp('payment_method') },
        { label: 'Federal Withholding',  value: idp('tax_withholding_federal') },
        { label: 'Signature Date',       value: idp('date_signed') },
      ];

  // ── STP Eligibility Indicators ────────────────────────────────────────────
  const stpFlags: STPFlag[] = isLoan
    ? [
        { label: 'MEC Indicator',          value: 'No',           status: 'pass' },
        { label: 'Irrev. Beneficiary',     value: 'None',         status: 'pass' },
        { label: 'Collateral Assignment',  value: 'None',         status: 'pass' },
        { label: 'Comm. Property State',   value: 'No (GA)',      status: 'pass' },
        { label: 'Address Change <30d',    value: 'Flagged',      status: 'fail' },
        { label: 'Legal Representation',   value: 'None',         status: 'pass' },
        { label: 'Child Support State',    value: 'Not Listed',   status: 'pass' },
        { label: 'Sole Living Owner',      value: 'Yes',          status: 'pass' },
      ]
    : [
        { label: 'MEC Indicator',          value: 'No',               status: 'pass' },
        { label: 'Irrev. Beneficiary',     value: 'None',             status: 'pass' },
        { label: 'Collateral Assignment',  value: 'None',             status: 'pass' },
        { label: 'Comm. Property State',   value: 'CA — Non-Qual.',   status: 'review' },
        { label: 'Policy In Force ≥1yr',   value: 'Yes',              status: 'pass' },
        { label: 'Max Yearly WDs Met',     value: 'No',               status: 'pass' },
        { label: 'Amount < Cost Basis',    value: 'Yes',              status: 'pass' },
        { label: 'Sole Living Owner',      value: 'Yes',              status: 'pass' },
      ];

  const failCount = stpFlags.filter((f) => f.status === 'fail').length;
  const reviewCount = stpFlags.filter((f) => f.status === 'review').length;

  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, pb: 1.5, borderBottom: '2px solid #F6F3F0' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <AutoAwesomeIcon sx={{ fontSize: 16, color: DXC.trueBlue }} />
              <Typography
                sx={{
                  fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Digital Synopsis
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.45)' }}>
              Auto-generated · {activeCase.transactionType} · {snCaseNumber ?? activeCase.id}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {failCount > 0 && (
              <Chip
                label={`${failCount} STP disqualifier${failCount !== 1 ? 's' : ''}`}
                size="small"
                sx={{ backgroundColor: '#fee2e2', color: DXC.red, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
              />
            )}
            {reviewCount > 0 && (
              <Chip
                label={`${reviewCount} review item${reviewCount !== 1 ? 's' : ''}`}
                size="small"
                sx={{ backgroundColor: '#fef9c3', color: '#b45309', fontWeight: 700, fontSize: '0.65rem', height: 20 }}
              />
            )}
            <Chip
              label="System Generated"
              size="small"
              sx={{ backgroundColor: '#dbeafe', color: DXC.trueBlue, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
            />
          </Box>
        </Box>

        {/* Two-column data panels */}
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography
              variant="overline"
              sx={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(14,16,32,0.4)', letterSpacing: '0.06em', display: 'block', mb: 1 }}
            >
              {isLoan ? 'Policy Data' : 'Contract Data'}
            </Typography>
            {policyRows.map((row) => (
              <DataRow key={row.label} label={row.label} value={row.value} />
            ))}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography
              variant="overline"
              sx={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(14,16,32,0.4)', letterSpacing: '0.06em', display: 'block', mb: 1 }}
            >
              Request Details
            </Typography>
            {requestRows.map((row) => (
              <DataRow key={row.label} label={row.label} value={row.value} highlight={(row as { highlight?: boolean }).highlight} />
            ))}
          </Grid>
        </Grid>

        {/* STP Eligibility Indicators */}
        <Box sx={{ pt: 1.5, borderTop: '1px solid rgba(14,16,32,0.07)' }}>
          <Typography
            variant="overline"
            sx={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(14,16,32,0.4)', letterSpacing: '0.06em', display: 'block', mb: 1 }}
          >
            STP Eligibility Indicators
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {stpFlags.map((flag) => (
              <FlagChip key={flag.label} flag={flag} />
            ))}
          </Box>
        </Box>

      </CardContent>
    </Card>
  );
}
