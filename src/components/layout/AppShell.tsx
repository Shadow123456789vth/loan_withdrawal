import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Avatar,
  Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MenuIcon from '@mui/icons-material/Menu';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PolicyIcon from '@mui/icons-material/Policy';
import LinkIcon from '@mui/icons-material/Link';
import { useCase } from '../../context/CaseContext';
import { useAuth } from '../../context/AuthContext';
import dxcLogo from '../../../DXC-Full-Color.png';
import { TouchLevelBadge } from '../shared/TouchLevelBadge';
import { DXC } from '../../theme/dxcTheme';

const DRAWER_WIDTH = 252;

const WORKFLOW_STEPS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Case Intake', path: '/intake', icon: <InboxIcon fontSize="small" /> },
  { label: 'IDP Extraction', path: '/extraction', icon: <DocumentScannerIcon fontSize="small" /> },
  { label: 'Triage Engine', path: '/triage', icon: <AccountTreeIcon fontSize="small" /> },
  { label: 'Processing', path: '/processing', icon: <AssignmentTurnedInIcon fontSize="small" /> },
  { label: 'Confirmation', path: '/confirmation', icon: <CheckCircleOutlineIcon fontSize="small" /> },
];

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCase, triageResult, scenario, setScenario } = useCase();
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPath = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        backgroundColor: DXC.midnightBlue,
        color: DXC.white,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo area */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
        <Box
          component="img"
          src={dxcLogo}
          alt="DXC Technology"
          sx={{
            height: 32,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            objectPosition: 'left center',
            // Full-color logo is designed for light backgrounds;
            // brightness(0) invert(1) converts it to white for the dark sidebar.
            filter: 'brightness(0) invert(1)',
            display: 'block',
          }}
        />
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 400,
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.03em',
            mt: 0.75,
          }}
        >
          Insurance Solutions
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Case info */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.4)',
            mb: 1,
          }}
        >
          Active Case
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <PolicyIcon sx={{ fontSize: 14, color: DXC.sky }} />
          <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.82rem', color: DXC.white }}>
            {activeCase.policyNumber}
          </Typography>
        </Box>
        <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', mb: 0.5 }}>
          {activeCase.ownerName}
        </Typography>
        <Chip
          label={activeCase.transactionType}
          size="small"
          sx={{
            backgroundColor: 'rgba(73,149,255,0.18)',
            color: DXC.sky,
            fontSize: '0.65rem',
            fontWeight: 600,
            height: 20,
            mb: 1,
            '& .MuiChip-label': { px: 1 },
          }}
        />
        {triageResult && (
          <Box sx={{ mt: 0.5 }}>
            <TouchLevelBadge level={triageResult.touchLevel} />
          </Box>
        )}
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '0.68rem',
            color: 'rgba(255,255,255,0.35)',
            mt: 1,
          }}
        >
          {formatTimestamp(activeCase.createdAt)}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Demo scenario switcher */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.4)',
            mb: 1,
          }}
        >
          Demo Scenario
        </Typography>
        <ToggleButtonGroup
          value={scenario}
          exclusive
          onChange={(_, v) => { if (v) { setScenario(v); navigate('/'); } }}
          size="small"
          fullWidth
          sx={{
            '& .MuiToggleButton-root': {
              color: 'rgba(255,255,255,0.5)',
              borderColor: 'rgba(255,255,255,0.15)',
              fontSize: '0.68rem',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              py: 0.5,
              textTransform: 'none',
              '&.Mui-selected': {
                backgroundColor: DXC.trueBlue,
                color: DXC.white,
                borderColor: DXC.trueBlue,
              },
            },
          }}
        >
          <ToggleButton value="loan">Loan</ToggleButton>
          <ToggleButton value="withdrawal">Withdrawal</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Workflow navigation */}
      <Box sx={{ px: 1, py: 1.5, flex: 1 }}>
        <Typography
          sx={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.4)',
            px: 1.5,
            mb: 0.5,
          }}
        >
          Workflow
        </Typography>
        <List dense disablePadding>
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = currentPath === step.path ||
              (step.path === '/processing' && currentPath.startsWith('/processing'));
            return (
              <ListItem key={step.path} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  onClick={() => navigate(step.path)}
                  sx={{
                    borderRadius: '10px',
                    py: 0.9,
                    px: 1.5,
                    backgroundColor: isActive ? 'rgba(73,149,255,0.18)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: isActive ? DXC.trueBlue : 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: DXC.white,
                        lineHeight: 1,
                      }}
                    >
                      {index + 1}
                    </Typography>
                  </Box>
                  <ListItemIcon sx={{ minWidth: 28, color: isActive ? DXC.sky : 'rgba(255,255,255,0.45)' }}>
                    {step.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={step.label}
                    primaryTypographyProps={{
                      sx: {
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '0.82rem',
                        color: isActive ? DXC.white : 'rgba(255,255,255,0.6)',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* User footer */}
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 28, height: 28, backgroundColor: isAuthenticated ? DXC.stp : 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>
          {isAuthenticated && user ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.78rem', color: DXC.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isAuthenticated && user ? user.name || user.user_name : 'Not connected'}
          </Typography>
          <Typography sx={{ fontFamily: '"Inter", sans-serif', fontSize: '0.68rem', color: isAuthenticated ? 'rgba(22,163,74,0.8)' : 'rgba(255,255,255,0.3)' }}>
            {isAuthenticated ? 'ServiceNow connected' : 'Demo mode'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: DXC.canvas }}>
      {/* Top AppBar (mobile only) */}
      <AppBar
        position="fixed"
        sx={{
          display: { md: 'none' },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src={dxcLogo}
            alt="DXC Technology"
            sx={{
              height: 26,
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />
        </Toolbar>
      </AppBar>

      {/* Left Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', position: 'relative', height: '100vh' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: '100vh',
          overflow: 'auto',
          pt: { xs: 8, md: 0 },
          backgroundColor: DXC.canvas,
        }}
      >
        {/* ── Portal header — always visible ── */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: DXC.midnightBlue,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            px: 3,
            height: 52,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
          }}
        >
          {/* App name */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              sx={{
                fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: DXC.white,
                whiteSpace: 'nowrap',
              }}
            >
              Loan &amp; Withdrawal Smart App
            </Typography>
          </Box>

          {/* User info — authenticated */}
          {isAuthenticated && user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {user.sys_domain?.display_value && (
                <Chip
                  label={user.sys_domain.display_value}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                />
              )}
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    color: DXC.white,
                    lineHeight: 1.2,
                  }}
                >
                  {user.name || user.user_name}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.4)',
                    lineHeight: 1.2,
                  }}
                >
                  {user.user_name}
                </Typography>
              </Box>
              <Tooltip title="Signed in via ServiceNow OAuth">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: DXC.trueBlue,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    fontFamily: '"Inter", sans-serif',
                    cursor: 'default',
                  }}
                >
                  {(user.name || user.user_name)
                    .split(' ')
                    .filter(Boolean)
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </Avatar>
              </Tooltip>
            </Box>
          ) : (
            /* Not authenticated — demo mode indicator */
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label="Demo Mode"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.45)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
              <Button
                size="small"
                startIcon={<LinkIcon sx={{ fontSize: '13px !important' }} />}
                onClick={() => navigate('/login')}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: '"Inter", sans-serif',
                  color: DXC.sky,
                  borderRadius: '100px',
                  textTransform: 'none',
                  px: 1.5,
                  '&:hover': { backgroundColor: 'rgba(161,230,255,0.08)' },
                }}
              >
                Connect
              </Button>
            </Box>
          )}
        </Box>

        {/* Case header bar — hidden on Dashboard */}
        <Box
          sx={{
            backgroundColor: DXC.midnightBlue,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            px: 3,
            py: 1.25,
            display: currentPath === '/' ? 'none' : 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
              Case ID
            </Typography>
            <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: '0.82rem', color: DXC.white }}>
              {activeCase.id}
            </Typography>
          </Box>

          <Box sx={{ width: '1px', height: 18, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.12)' }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
              Policy
            </Typography>
            <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.82rem', color: DXC.white }}>
              {activeCase.policyNumber}
            </Typography>
          </Box>

          <Box sx={{ width: '1px', height: 18, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.12)' }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
              Owner
            </Typography>
            <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '0.82rem', color: DXC.white }}>
              {activeCase.ownerName}
            </Typography>
          </Box>

          <Box sx={{ width: '1px', height: 18, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.12)' }} />

          <Chip
            label={activeCase.transactionType}
            size="small"
            sx={{
              flexShrink: 0,
              backgroundColor: 'rgba(73,149,255,0.2)',
              color: DXC.sky,
              fontWeight: 700,
              fontSize: '0.68rem',
              height: 22,
              '& .MuiChip-label': { px: 1 },
            }}
          />

          <Box sx={{ width: '1px', height: 18, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.12)' }} />

          <Chip
            label={activeCase.channelSource}
            size="small"
            sx={{
              flexShrink: 0,
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              fontSize: '0.68rem',
              height: 22,
              border: '1px solid rgba(255,255,255,0.15)',
              '& .MuiChip-label': { px: 1 },
            }}
          />

          {triageResult && (
            <>
              <Box sx={{ width: '1px', height: 18, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.12)' }} />
              <TouchLevelBadge level={triageResult.touchLevel} />
            </>
          )}

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Switch demo scenario">
            <Chip
              icon={<SwapHorizIcon sx={{ fontSize: '14px !important' }} />}
              label={scenario === 'loan' ? 'Demo 1: Loan' : 'Demo 2: Withdrawal'}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderColor: 'rgba(73,149,255,0.5)',
                color: DXC.sky,
                '& .MuiChip-icon': { color: DXC.sky },
              }}
            />
          </Tooltip>
        </Box>

        {/* Page content */}
        <Box sx={{ p: currentPath === '/' ? 0 : { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
