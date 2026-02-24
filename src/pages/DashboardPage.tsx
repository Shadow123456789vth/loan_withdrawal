import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Divider, IconButton, Tooltip, Dialog, DialogContent,
  TextField, InputAdornment, CircularProgress,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LinkIcon from '@mui/icons-material/Link';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LogoutIcon from '@mui/icons-material/Logout';
import { useCase } from '../context/CaseContext';
import { useAuth } from '../context/AuthContext';
import { snGet } from '../services/snApiClient';
import { TouchLevelBadge } from '../components/shared/TouchLevelBadge';
import type { TouchLevel } from '../types/entities';
import { DXC } from '../theme/dxcTheme';

// ─── ServiceNow record shape ────────────────────────────────────────────────
// Fields from x_dxcis_loans_wi_0_loans_withdrawals.
// sysparm_display_value=true resolves choice fields (state, contact_type)
// to display values, but reference fields (opened_by) still return objects.
// Use snVal() to safely unwrap any field value.
type SNRef = string | { display_value?: string; value?: string; link?: string };

interface SNCase {
  sys_id: string;
  number: SNRef;
  state: SNRef;           // e.g. "New", "Work in progress", "Closed"
  stage: SNRef;           // e.g. "Initiation", "Processing"
  sys_created_on: SNRef;  // SN format: "YYYY-MM-DD HH:mm:ss"
  transaction_type?: SNRef;
  touch_level?: SNRef;
  policy_number?: SNRef;
  opened_by: SNRef;       // reference field → { display_value, link }
  contact_type: SNRef;    // e.g. "Web", "Email", "Phone"
}

// ─── Mock dashboard data (demo mode) ───────────────────────────────────────
const DAILY_VOLUMES = [14, 22, 18, 31, 25, 19, 28];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MOCK_PIPELINE = [
  { label: 'STP',            count: 12, color: DXC.stp,      bg: '#dcfce7' },
  { label: 'Low Touch',      count: 8,  color: DXC.trueBlue, bg: '#dbeafe' },
  { label: 'Moderate Touch', count: 19, color: '#b45309',    bg: '#fef9c3' },
  { label: 'High Touch',     count: 6,  color: DXC.red,      bg: '#fee2e2' },
  { label: 'NIGO',           count: 4,  color: DXC.melon,    bg: '#fff3ec' },
];

const TXN_MIX = [
  { label: 'Policy Loan',         count: 18, color: DXC.trueBlue },
  { label: 'Annuity Withdrawal',  count: 12, color: DXC.sky },
  { label: 'Full Surrender',      count: 7,  color: DXC.gold },
  { label: 'Partial Surrender',   count: 5,  color: DXC.peach },
  { label: 'Annuity RMD',         count: 5,  color: DXC.melon },
];
const TXN_TOTAL = TXN_MIX.reduce((s, t) => s + t.count, 0);

type CaseStatus = 'APPROVED' | 'IN_REVIEW' | 'NIGO' | 'STP_AUTO';

const MOCK_CASES: {
  id: string; policy: string; owner: string; type: string;
  touchLevel: TouchLevel; status: CaseStatus; channel: string; minutesAgo: number;
}[] = [
  { id: 'CSE-2026-010891', policy: 'ANN-2024-034891', owner: 'Patricia M. Chen',    type: 'Annuity Withdrawal', touchLevel: 'LOW',      status: 'APPROVED',  channel: 'Portal',     minutesAgo: 12  },
  { id: 'CSE-2026-010847', policy: 'LF-2024-089423',  owner: 'James R. Whitfield',  type: 'Policy Loan',        touchLevel: 'MODERATE', status: 'IN_REVIEW', channel: 'Mail / Fax', minutesAgo: 38  },
  { id: 'CSE-2026-010829', policy: 'LF-2022-045219',  owner: 'Robert T. Martinez',  type: 'Policy Loan',        touchLevel: 'STP',      status: 'STP_AUTO',  channel: 'Portal',     minutesAgo: 54  },
  { id: 'CSE-2026-010811', policy: 'ANN-2023-087334', owner: 'Linda K. Johnson',    type: 'Full Surrender',     touchLevel: 'HIGH',     status: 'IN_REVIEW', channel: 'Mail / Fax', minutesAgo: 67  },
  { id: 'CSE-2026-010794', policy: 'LF-2019-033891',  owner: 'Michael D. Thompson', type: 'Partial Surrender',  touchLevel: 'MODERATE', status: 'NIGO',      channel: 'AWD',        minutesAgo: 94  },
  { id: 'CSE-2026-010782', policy: 'ANN-2021-056744', owner: 'Susan E. Patel',      type: 'Annuity RMD',        touchLevel: 'LOW',      status: 'APPROVED',  channel: 'Portal',     minutesAgo: 110 },
  { id: 'CSE-2026-010771', policy: 'LF-2020-078812',  owner: 'David L. Nguyen',     type: 'Policy Loan',        touchLevel: 'STP',      status: 'STP_AUTO',  channel: 'Portal',     minutesAgo: 128 },
];

const STATUS_CONFIG: Record<CaseStatus, { label: string; bg: string; color: string }> = {
  APPROVED:  { label: 'Approved',  bg: '#dcfce7', color: DXC.stp },
  IN_REVIEW: { label: 'In Review', bg: '#dbeafe', color: DXC.trueBlue },
  NIGO:      { label: 'NIGO',      bg: '#fee2e2', color: DXC.red },
  STP_AUTO:  { label: 'STP Auto',  bg: '#dcfce7', color: DXC.stp },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(minutes: number) {
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

function snTimeAgo(isoString: string) {
  // SN returns "YYYY-MM-DD HH:mm:ss" — replace space with T for standard ISO parsing
  const normalised = isoString.replace(' ', 'T');
  const ms = Date.now() - new Date(normalised).getTime();
  const mins = Math.round(ms / 60000);
  if (isNaN(mins)) return '—';
  return timeAgo(mins);
}

function snVal(val: unknown): string {
  if (!val) return '—';
  if (typeof val === 'string') return val || '—';
  if (typeof val === 'object' && val !== null) {
    const v = (val as Record<string, string>).display_value ?? (val as Record<string, string>).value ?? '';
    return v || '—';
  }
  return String(val) || '—';
}

function normaliseTouchLevel(raw: SNRef | undefined): TouchLevel {
  const v = snVal(raw).toLowerCase().replace(/\s+/g, '_');
  if (v.includes('stp')) return 'STP';
  if (v.includes('low')) return 'LOW';
  if (v.includes('high')) return 'HIGH';
  return 'MODERATE';
}

function normaliseStatus(state: SNRef, stage: SNRef, touchLevel: SNRef | undefined): CaseStatus {
  const s = snVal(state).toLowerCase();
  const st = snVal(stage).toLowerCase();
  const t = snVal(touchLevel).toLowerCase();
  if (s.includes('nigo') || s.includes('not in good') || st.includes('nigo')) return 'NIGO';
  // Closed / resolved / approved states (numeric 5=resolved, 7=closed or display text)
  if (s === '5' || s === '7' || s.includes('closed') || s.includes('resolved') || s.includes('approv') || s.includes('complet')) {
    return t.includes('stp') ? 'STP_AUTO' : 'APPROVED';
  }
  if (t.includes('stp') || st.includes('stp')) return 'STP_AUTO';
  return 'IN_REVIEW';
}

// Derive pipeline counts from live SN records
function buildLivePipeline(cases: SNCase[]) {
  const counts = { STP: 0, LOW: 0, MODERATE: 0, HIGH: 0, NIGO: 0 };
  cases.forEach((c) => {
    const tl = normaliseTouchLevel(c.touch_level);
    const st = normaliseStatus(c.state, c.stage, c.touch_level);
    if (st === 'NIGO') counts.NIGO++;
    else counts[tl]++;
  });
  return [
    { label: 'STP',            count: counts.STP,      color: DXC.stp,      bg: '#dcfce7' },
    { label: 'Low Touch',      count: counts.LOW,      color: DXC.trueBlue, bg: '#dbeafe' },
    { label: 'Moderate Touch', count: counts.MODERATE, color: '#b45309',    bg: '#fef9c3' },
    { label: 'High Touch',     count: counts.HIGH,     color: DXC.red,      bg: '#fee2e2' },
    { label: 'NIGO',           count: counts.NIGO,     color: DXC.melon,    bg: '#fff3ec' },
  ];
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 240; const H = 64; const pad = 6;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: pad + ((max - v) / range) * (H - pad * 2),
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pts[0].x},${H} ${polyline} ${pts[pts.length - 1].x},${H}`;
  const gradId = `sg-${color.replace('#', '')}`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4} fill={color} />
    </svg>
  );
}

function HeroStat({ value, label, loading }: { value: string; label: string; loading?: boolean }) {
  return (
    <Box>
      {loading
        ? <CircularProgress size={20} sx={{ color: DXC.trueBlue, mt: 0.5 }} />
        : <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: '2rem', color: DXC.midnightBlue, lineHeight: 1 }}>{value}</Typography>
      }
      <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.45)', mt: 0.5, fontWeight: 500 }}>{label}</Typography>
    </Box>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();
  const { setScenario } = useCase();
  const { isAuthenticated, user, login, logout } = useAuth();

  // Login modal state
  const [loginOpen, setLoginOpen] = useState(false);
  const [snUsername, setSnUsername] = useState('');
  const [snPassword, setSnPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  // Live ServiceNow data
  const [liveCases, setLiveCases] = useState<SNCase[] | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Fetch records visible to the authenticated user — ServiceNow ACLs govern scope.
  // Global domain admins will see all records; domain-separated users see their domain only.
  // When logged out, liveCases is null and mock data is displayed instead.
  useEffect(() => {
    if (!isAuthenticated) { setLiveCases(null); setDataError(null); return; }
    setDataLoading(true);
    setDataError(null);
    snGet<{ result: SNCase[] }>('/api/now/table/x_dxcis_loans_wi_0_loans_withdrawals', {
      sysparm_limit: '50',
      sysparm_query: 'ORDERBYDESCsys_created_on',
      sysparm_display_value: 'true',
      sysparm_fields: 'sys_id,number,state,stage,sys_created_on,transaction_type,touch_level,policy_number,opened_by,contact_type',
    })
      .then((data) => setLiveCases(data.result ?? []))
      .catch((err: unknown) => {
        setDataError(err instanceof Error ? err.message : 'Failed to load data from ServiceNow');
        setLiveCases([]);
      })
      .finally(() => setDataLoading(false));
  }, [isAuthenticated]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!snUsername.trim() || !snPassword) return;
    setLoginError(null);
    setLoginBusy(true);
    try {
      await login(snUsername.trim(), snPassword);
      setLoginOpen(false);
      setSnUsername(''); setSnPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginBusy(false);
    }
  };

  const startCase = (s: 'loan' | 'withdrawal') => { setScenario(s); navigate('/intake'); };

  // Derived live stats
  const pipeline = liveCases ? buildLivePipeline(liveCases) : MOCK_PIPELINE;
  const pipelineTotal = pipeline.reduce((s, p) => s + p.count, 0);
  const stpCount = pipeline.find((p) => p.label === 'STP')?.count ?? 0;
  const stpRate = pipelineTotal > 0 ? Math.round((stpCount / pipelineTotal) * 100) : 0;

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      color: DXC.white, fontFamily: '"Inter", sans-serif', fontSize: '0.875rem',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
      '&.Mui-focused fieldset': { borderColor: DXC.trueBlue },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255,255,255,0.4)', fontFamily: '"Inter", sans-serif', fontSize: '0.875rem',
      '&.Mui-focused': { color: DXC.sky },
    },
    '& .MuiInputAdornment-root .MuiIconButton-root': { color: 'rgba(255,255,255,0.4)' },
  };

  return (
    <Box>

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <Card sx={{ mb: 1.5, backgroundColor: '#fff', overflow: 'hidden', border: '1px solid rgba(14,16,32,0.07)', boxShadow: '0 2px 12px rgba(14,16,32,0.05)', borderRadius: '16px' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                <Chip label="ServiceNow FSO" size="small" sx={{ backgroundColor: 'rgba(73,149,255,0.1)', color: DXC.trueBlue, fontWeight: 700, fontSize: '0.65rem', border: '1px solid rgba(73,149,255,0.2)', height: 22 }} />
                <Chip label="AI-Accelerated" size="small" sx={{ backgroundColor: 'rgba(255,174,65,0.1)', color: '#92400e', fontWeight: 700, fontSize: '0.65rem', border: '1px solid rgba(255,174,65,0.3)', height: 22 }} />
                {/* Auth status badge */}
                {isAuthenticated
                  ? <Chip label={`Connected · ${user?.name ?? user?.user_name}`} size="small" icon={<LinkIcon sx={{ fontSize: '12px !important', color: `${DXC.stp} !important` }} />} sx={{ backgroundColor: 'rgba(22,163,74,0.08)', color: DXC.stp, fontWeight: 700, fontSize: '0.65rem', border: `1px solid rgba(22,163,74,0.25)`, height: 22 }} />
                  : <Chip label="Demo Mode" size="small" sx={{ backgroundColor: 'rgba(14,16,32,0.06)', color: 'rgba(14,16,32,0.45)', fontWeight: 600, fontSize: '0.65rem', border: '1px solid rgba(14,16,32,0.1)', height: 22 }} />
                }
              </Box>
              <Typography variant="h2" sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: { xs: '1.3rem', md: '1.7rem' }, textTransform: 'uppercase', letterSpacing: '0.04em', color: DXC.midnightBlue, lineHeight: 1.1, mb: 1 }}>
                Loan & Withdrawal<br />Smart App
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(14,16,32,0.55)', maxWidth: 440 }}>
                Configurable financial transaction processing framework — Policy loans, surrenders, annuity withdrawals, and RMDs.
              </Typography>
            </Box>

            {/* Hero KPIs + connect button */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: { xs: 3, md: 4 }, flexWrap: 'wrap' }}>
                <HeroStat value={liveCases ? `${liveCases.length}` : '28'} label="Cases loaded" loading={dataLoading} />
                <HeroStat value={liveCases ? `${stpRate}%` : '43%'} label="STP rate" loading={dataLoading} />
                <HeroStat value="91.2%" label="Avg IDP confidence" />
                <HeroStat value="2.4h" label="Avg processing time" />
              </Box>
              {isAuthenticated ? (
                <Button variant="outlined" size="small" startIcon={<LogoutIcon sx={{ fontSize: 15 }} />} onClick={logout} sx={{ borderColor: 'rgba(14,16,32,0.18)', color: 'rgba(14,16,32,0.5)', fontSize: '0.72rem', '&:hover': { borderColor: 'rgba(14,16,32,0.35)', color: DXC.midnightBlue } }}>
                  Disconnect
                </Button>
              ) : (
                <Button variant="outlined" size="small" startIcon={<LinkIcon sx={{ fontSize: 15 }} />} onClick={() => setLoginOpen(true)} sx={{ borderColor: 'rgba(73,149,255,0.45)', color: DXC.trueBlue, fontSize: '0.78rem', fontWeight: 700, '&:hover': { borderColor: DXC.trueBlue, backgroundColor: 'rgba(73,149,255,0.06)' } }}>
                  Connect to ServiceNow
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Action strip ────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => startCase('loan')} sx={{ backgroundColor: DXC.trueBlue, '&:hover': { backgroundColor: DXC.royalBlue }, fontSize: '0.82rem', borderRadius: '10px', px: 2.5 }}>
          New Policy Loan
        </Button>
        <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => startCase('withdrawal')} sx={{ backgroundColor: DXC.trueBlue, '&:hover': { backgroundColor: DXC.royalBlue }, fontSize: '0.82rem', borderRadius: '10px', px: 2.5 }}>
          New Withdrawal
        </Button>
        <Button variant="outlined" startIcon={<AccountTreeIcon />} onClick={() => navigate('/triage')} sx={{ borderColor: DXC.trueBlue, color: DXC.trueBlue, '&:hover': { backgroundColor: 'rgba(73,149,255,0.06)', borderColor: DXC.trueBlue }, fontSize: '0.82rem', borderRadius: '10px', px: 2.5 }}>
          Triage Engine
        </Button>
      </Box>

      {/* ── Data error banner ───────────────────────────────────────────── */}
      {dataError && (
        <Box sx={{ mb: 2.5, px: 2, py: 1.5, backgroundColor: '#fff7ed', border: '1px solid rgba(234,88,12,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <ErrorOutlineIcon sx={{ color: '#ea580c', fontSize: 18, mt: '1px', flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#9a3412' }}>ServiceNow data error</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#c2410c', mt: 0.25 }}>{dataError}</Typography>
          </Box>
        </Box>
      )}

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total in Queue',    value: `${pipelineTotal}`,                subtext: `${liveCases ? liveCases.length : 28} records loaded`,  accent: DXC.trueBlue, icon: <AssignmentIcon /> },
          { label: 'STP Auto-Approved', value: `${stpCount}`,                     subtext: `${stpRate}% of volume`,                               accent: DXC.stp,      icon: <CheckCircleIcon /> },
          { label: 'Low Touch',         value: `${pipeline.find(p => p.label === 'Low Touch')?.count ?? 0}`,      subtext: 'Pending approval',    accent: DXC.trueBlue, icon: <SpeedIcon /> },
          { label: 'Moderate Touch',    value: `${pipeline.find(p => p.label === 'Moderate Touch')?.count ?? 0}`, subtext: 'Awaiting review',     accent: '#b45309',    icon: <SpeedIcon /> },
          { label: 'High Touch',        value: `${pipeline.find(p => p.label === 'High Touch')?.count ?? 0}`,     subtext: 'Manual intervention', accent: DXC.red,      icon: <ErrorOutlineIcon /> },
          { label: 'NIGO Returned',     value: `${pipeline.find(p => p.label === 'NIGO')?.count ?? 0}`,           subtext: 'Customer action req', accent: DXC.melon,    icon: <ErrorOutlineIcon /> },
        ].map((kpi) => (
          <Grid item xs={6} sm={4} md={2} key={kpi.label}>
            <Card sx={{ borderLeft: `4px solid ${kpi.accent}`, height: '100%', borderRadius: '16px' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="overline" sx={{ fontSize: '0.62rem', color: 'rgba(14,16,32,0.5)', lineHeight: 1.3, display: 'block', mb: 0.5 }}>{kpi.label}</Typography>
                  <Box sx={{ color: kpi.accent, opacity: 0.6 }}>{kpi.icon}</Box>
                </Box>
                {dataLoading
                  ? <CircularProgress size={20} sx={{ color: kpi.accent, my: 0.5 }} />
                  : <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: '1.8rem', color: '#0E1020', lineHeight: 1 }}>{kpi.value}</Typography>
                }
                <Typography sx={{ fontSize: '0.68rem', color: 'rgba(14,16,32,0.45)', mt: 0.5 }}>{kpi.subtext}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Processing Pipeline</Typography>
                {isAuthenticated && <Chip label="Live" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: 'rgba(22,163,74,0.1)', color: DXC.stp, border: `1px solid rgba(22,163,74,0.2)` }} />}
              </Box>
              {pipeline.map((row) => {
                const pct = pipelineTotal > 0 ? Math.round((row.count / pipelineTotal) * 100) : 0;
                return (
                  <Box key={row.label} sx={{ mb: 1.75 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: row.color, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#0E1020' }}>{row.label}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: '0.9rem', color: row.color }}>{row.count}</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: 'rgba(14,16,32,0.4)' }}>{pct}%</Typography>
                      </Box>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{ height: 7, borderRadius: '100px', backgroundColor: row.bg, '& .MuiLinearProgress-bar': { backgroundColor: row.color, borderRadius: '100px' } }} />
                  </Box>
                );
              })}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.5)' }}>Total active cases</Typography>
                <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>{pipelineTotal}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>7-Day Volume</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, color: DXC.stp }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: DXC.stp }}>+47%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2.5, mb: 1.5 }}>
                {[{ label: 'Peak', val: `${Math.max(...DAILY_VOLUMES)}` }, { label: 'Avg / Day', val: `${Math.round(DAILY_VOLUMES.reduce((a, b) => a + b) / DAILY_VOLUMES.length)}` }, { label: 'Today', val: `${DAILY_VOLUMES[DAILY_VOLUMES.length - 1]}`, accent: DXC.trueBlue }].map((s) => (
                  <Box key={s.label}>
                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(14,16,32,0.4)' }}>{s.label}</Typography>
                    <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: '1.2rem', color: s.accent ?? '#0E1020' }}>{s.val}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mx: -0.5 }}><Sparkline data={DAILY_VOLUMES} color={DXC.trueBlue} /></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
                {DAY_LABELS.map((d, i) => (
                  <Typography key={d} sx={{ fontSize: '0.62rem', fontWeight: i === DAY_LABELS.length - 1 ? 700 : 400, color: i === DAY_LABELS.length - 1 ? DXC.trueBlue : 'rgba(14,16,32,0.35)' }}>{d}</Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 2 }}>Transaction Mix</Typography>
              <Box sx={{ display: 'flex', height: 10, borderRadius: '100px', overflow: 'hidden', mb: 2 }}>
                {TXN_MIX.map((t) => <Box key={t.label} sx={{ flex: t.count, backgroundColor: t.color }} />)}
              </Box>
              {TXN_MIX.map((txn) => {
                const pct = Math.round((txn.count / TXN_TOTAL) * 100);
                return (
                  <Box key={txn.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: txn.color, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#0E1020' }}>{txn.label}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#0E1020', minWidth: 20, textAlign: 'right' }}>{txn.count}</Typography>
                      <Box sx={{ width: 36, textAlign: 'right' }}><Typography sx={{ fontSize: '0.68rem', color: 'rgba(14,16,32,0.4)', fontWeight: 600 }}>{pct}%</Typography></Box>
                    </Box>
                  </Box>
                );
              })}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.5)' }}>Total this week</Typography>
                <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>{TXN_TOTAL}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Recent Cases ────────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Recent Cases
              </Typography>
              {isAuthenticated && !dataLoading && liveCases && (
                <Chip label={`${liveCases.length} from ServiceNow`} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: 'rgba(22,163,74,0.1)', color: DXC.stp, border: `1px solid rgba(22,163,74,0.2)` }} />
              )}
              {!isAuthenticated && (
                <Chip label="Demo data" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, backgroundColor: 'rgba(14,16,32,0.05)', color: 'rgba(14,16,32,0.4)', border: '1px solid rgba(14,16,32,0.1)' }} />
              )}
            </Box>
            <Button size="small" endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />} sx={{ fontSize: '0.75rem', color: DXC.trueBlue }}>View All</Button>
          </Box>

          {dataLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5, gap: 1.5 }}>
              <CircularProgress size={20} sx={{ color: DXC.trueBlue }} />
              <Typography sx={{ fontSize: '0.82rem', color: 'rgba(14,16,32,0.45)' }}>Loading from ServiceNow…</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Case ID', 'Policy', 'Owner', 'Transaction Type', 'Touch Level', 'Status', 'Channel', 'Time'].map((h) => (
                      <TableCell key={h} sx={{ py: 1, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#F6F3F0', color: 'rgba(14,16,32,0.55)', whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                    <TableCell sx={{ py: 1, backgroundColor: '#F6F3F0', width: 40 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Live SN rows */}
                  {isAuthenticated && liveCases && liveCases.slice(0, 7).map((c) => {
                    const tl = normaliseTouchLevel(c.touch_level);
                    const st = normaliseStatus(c.state, c.stage, c.touch_level);
                    const stCfg = STATUS_CONFIG[st];
                    return (
                      <TableRow key={c.sys_id} sx={{ '&:hover': { backgroundColor: 'rgba(73,149,255,0.04)', cursor: 'pointer' } }} onClick={() => navigate('/intake')}>
                        <TableCell sx={{ py: 1.25, fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: DXC.trueBlue, whiteSpace: 'nowrap' }}>{snVal(c.number)}</TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{snVal(c.policy_number)}</TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{snVal(c.opened_by)}</TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{snVal(c.transaction_type) !== '—' ? snVal(c.transaction_type) : snVal(c.stage)}</TableCell>
                        <TableCell sx={{ py: 1.25 }}><TouchLevelBadge level={tl} /></TableCell>
                        <TableCell sx={{ py: 1.25 }}><Chip label={stCfg.label} size="small" sx={{ backgroundColor: stCfg.bg, color: stCfg.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }} /></TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.75rem', color: 'rgba(14,16,32,0.55)', whiteSpace: 'nowrap' }}>{snVal(c.contact_type)}</TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.72rem', color: 'rgba(14,16,32,0.4)', whiteSpace: 'nowrap' }}>{snTimeAgo(snVal(c.sys_created_on))}</TableCell>
                        <TableCell sx={{ py: 1.25 }}><Tooltip title="Open case" arrow><IconButton size="small" sx={{ color: 'rgba(14,16,32,0.3)', '&:hover': { color: DXC.trueBlue } }}><OpenInNewIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip></TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Demo rows (shown when not authenticated) */}
                  {!isAuthenticated && MOCK_CASES.map((c) => {
                    const stCfg = STATUS_CONFIG[c.status];
                    return (
                      <TableRow key={c.id} sx={{ '&:hover': { backgroundColor: 'rgba(73,149,255,0.04)', cursor: 'pointer' } }} onClick={() => navigate('/intake')}>
                        <TableCell sx={{ py: 1.25, fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: DXC.trueBlue, whiteSpace: 'nowrap' }}>{c.id}</TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.policy}</TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{c.owner}</TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{c.type}</TableCell>
                        <TableCell sx={{ py: 1.25 }}><TouchLevelBadge level={c.touchLevel} /></TableCell>
                        <TableCell sx={{ py: 1.25 }}><Chip label={stCfg.label} size="small" sx={{ backgroundColor: stCfg.bg, color: stCfg.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }} /></TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.75rem', color: 'rgba(14,16,32,0.55)', whiteSpace: 'nowrap' }}>{c.channel}</TableCell>
                        <TableCell sx={{ py: 1.25, fontSize: '0.72rem', color: 'rgba(14,16,32,0.4)', whiteSpace: 'nowrap' }}>{timeAgo(c.minutesAgo)}</TableCell>
                        <TableCell sx={{ py: 1.25 }}><Tooltip title="Open case" arrow><IconButton size="small" sx={{ color: 'rgba(14,16,32,0.3)', '&:hover': { color: DXC.trueBlue } }}><OpenInNewIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Quick action cards ───────────────────────────────────────────── */}
      <Grid container spacing={2}>
        {[
          { icon: <AddCircleOutlineIcon sx={{ fontSize: 28 }} />, title: 'Start New Case', description: 'Submit a loan or withdrawal request — intake, IDP extraction, triage, and processing.', accent: DXC.trueBlue, action: () => navigate('/intake'), cta: 'Open Intake' },
          { icon: <AccountTreeIcon sx={{ fontSize: 28 }} />, title: 'Configure Triage', description: 'Build and test decision table rules. Add entity fields, set conditions, validate with live data.', accent: DXC.gold, action: () => navigate('/triage'), cta: 'Open Triage Builder' },
          { icon: <ErrorOutlineIcon sx={{ fontSize: 28 }} />, title: 'High Touch Queue', description: `${pipeline.find(p => p.label === 'High Touch')?.count ?? 0} cases awaiting full manual review. Financial calculator and entity comparison workspace.`, accent: DXC.red, action: () => navigate('/processing/high'), cta: 'Open Queue' },
          { icon: <SpeedIcon sx={{ fontSize: 28 }} />, title: 'Moderate Touch Queue', description: `${pipeline.find(p => p.label === 'Moderate Touch')?.count ?? 0} cases with flagged items awaiting secondary validation and good-order checklist sign-off.`, accent: '#b45309', action: () => navigate('/processing/moderate'), cta: 'Open Queue' },
        ].map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card sx={{ height: '100%', cursor: 'pointer', borderTop: `3px solid ${card.accent}`, transition: 'box-shadow 0.2s, transform 0.2s', '&:hover': { boxShadow: '0 8px 32px rgba(14,16,32,0.14)', transform: 'translateY(-2px)' } }} onClick={card.action}>
              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ color: card.accent, mb: 1.5 }}>{card.icon}</Box>
                <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 500, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.03em', mb: 0.75 }}>{card.title}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(14,16,32,0.6)', lineHeight: 1.5, flex: 1, mb: 2 }}>{card.description}</Typography>
                <Button variant="outlined" size="small" endIcon={<ArrowForwardIcon />} sx={{ alignSelf: 'flex-start', fontSize: '0.72rem', borderColor: card.accent, color: card.accent, borderRadius: '8px', '&:hover': { backgroundColor: `${card.accent}0f` } }}>{card.cta}</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Login Modal ──────────────────────────────────────────────────── */}
      <Dialog
        open={loginOpen}
        onClose={() => { setLoginOpen(false); setLoginError(null); }}
        PaperProps={{
          sx: {
            backgroundColor: DXC.midnightBlue,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: 400,
            overflow: 'hidden',
          },
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ fontFamily: '"GT Standard Extended", "Arial Black", sans-serif', fontWeight: 700, fontSize: '1rem', color: DXC.white, mb: 0.5 }}>
                Connect to ServiceNow
              </Typography>
              <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                Sign in to load live case data from your instance.
              </Typography>
            </Box>

            <TextField label="Username" value={snUsername} onChange={(e) => setSnUsername(e.target.value)} autoFocus fullWidth disabled={loginBusy} sx={fieldSx} />

            <TextField
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={snPassword}
              onChange={(e) => setSnPassword(e.target.value)}
              fullWidth
              disabled={loginBusy}
              sx={fieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw((s) => !s)} edge="end" tabIndex={-1}>
                      {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {loginError && (
              <Box sx={{ backgroundColor: 'rgba(209,70,0,0.12)', border: '1px solid rgba(209,70,0,0.3)', borderRadius: '10px', px: 2, py: 1.25 }}>
                <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.78rem', color: DXC.melon }}>{loginError}</Typography>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loginBusy || !snUsername.trim() || !snPassword}
              startIcon={loginBusy ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <LockOutlinedIcon />}
              sx={{ backgroundColor: DXC.trueBlue, borderRadius: '100px', fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: '0.88rem', textTransform: 'none', py: 1.25, '&:hover': { backgroundColor: DXC.royalBlue }, '&.Mui-disabled': { backgroundColor: 'rgba(73,149,255,0.25)', color: 'rgba(255,255,255,0.3)' } }}
            >
              {loginBusy ? 'Connecting…' : 'Sign In'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
