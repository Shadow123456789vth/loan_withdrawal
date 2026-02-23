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
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useCase } from '../context/CaseContext';
import { TRANSACTION_TYPE_REGISTRY } from '../data/mockData';
import { DXC } from '../theme/dxcTheme';

const CHANNEL_SOURCES = ['Portal', 'Mail / Fax', 'Call Center', 'AWD / Integration', 'IVR'];

function IDPStatusIcon({ status }: { status: string }) {
  if (status === 'complete') return <CheckCircleIcon sx={{ fontSize: 16, color: DXC.stp }} />;
  if (status === 'failed') return <ErrorIcon sx={{ fontSize: 16, color: DXC.red }} />;
  if (status === 'processing') return <AutorenewIcon sx={{ fontSize: 16, color: DXC.trueBlue, animation: 'spin 1s linear infinite' }} />;
  return <HourglassEmptyIcon sx={{ fontSize: 16, color: 'rgba(14,16,32,0.4)' }} />;
}

function IDPStatusChip({ status }: { status: string }) {
  const config = {
    complete: { label: 'Extraction Complete', bg: '#dcfce7', color: DXC.stp },
    failed: { label: 'Failed', bg: '#fee2e2', color: DXC.red },
    processing: { label: 'Processing…', bg: '#dbeafe', color: DXC.trueBlue },
    queued: { label: 'Queued', bg: '#F6F3F0', color: 'rgba(14,16,32,0.5)' },
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
  const { activeCase, documents, scenario, setScenario } = useCase();

  const selectedTxnType = TRANSACTION_TYPE_REGISTRY.find((t) => t.key === activeCase.transactionTypeKey);

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
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
          Case Intake
        </Typography>
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
                  <FormControl fullWidth size="small">
                    <InputLabel>Transaction Type</InputLabel>
                    <Select
                      value={activeCase.transactionTypeKey}
                      label="Transaction Type"
                      onChange={(e) => {
                        const key = e.target.value;
                        if (key === 'ANNUITY_WITHDRAWAL') setScenario('withdrawal');
                        else setScenario('loan');
                      }}
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
                    value={activeCase.policyNumber}
                    InputProps={{ readOnly: true }}
                    sx={{ '& input': { fontWeight: 600 } }}
                    helperText={<span style={{ color: DXC.stp, fontWeight: 600, fontSize: '0.7rem' }}>✓ Policy verified</span>}
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
                  <FormControl fullWidth size="small">
                    <InputLabel>Channel Source</InputLabel>
                    <Select value={activeCase.channelSource} label="Channel Source">
                      {CHANNEL_SOURCES.map((ch) => (
                        <MenuItem key={ch} value={ch}>{ch}</MenuItem>
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
                      { label: 'IDP Template', value: selectedTxnType.idpTemplateRef },
                      { label: 'Decision Table', value: selectedTxnType.decisionTableRef },
                      { label: 'Form Layout', value: selectedTxnType.formLayoutRef },
                      { label: 'GOC Checklist', value: selectedTxnType.goodOrderChecklistRef },
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
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(14,16,32,0.5)' }}>
                      Confidence thresholds — Default: {selectedTxnType.confidenceThresholds.default}% · Signature: {selectedTxnType.confidenceThresholds.signature}% · Amounts: {selectedTxnType.confidenceThresholds.amounts}%
                    </Typography>
                  </Box>
                </Box>
              )}
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
                  { label: 'Case ID', value: activeCase.id },
                  { label: 'Transaction', value: activeCase.transactionType },
                  { label: 'Channel', value: activeCase.channelSource },
                  { label: 'Documents', value: `${documents.length} attached` },
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
                { label: 'Channel Classification', status: 'done' },
                { label: 'Case Shell Created', status: 'done' },
                { label: 'Document Landing', status: 'done' },
                { label: 'IDP Trigger', status: 'done' },
                { label: 'Policy Data Fetch', status: 'done' },
              ].map((step) => (
                <Box key={step.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <CheckCircleIcon sx={{ fontSize: 15, color: DXC.stp, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.8rem', color: '#0E1020', fontWeight: 500 }}>
                    {step.label}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Alert
            severity="info"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#dbeafe',
              border: '1px solid rgba(73,149,255,0.3)',
              '& .MuiAlert-icon': { color: DXC.trueBlue },
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0E1020', mb: 0.25 }}>
              IDP Extraction Complete
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(14,16,32,0.65)' }}>
              {documents.filter((d) => d.idpStatus === 'complete').length} of {documents.length} documents processed. Proceed to IDP Extraction to review and validate extracted entities.
            </Typography>
          </Alert>

          <Button
            variant="contained"
            size="large"
            fullWidth
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/extraction')}
            sx={{ py: 1.5 }}
          >
            Proceed to IDP Extraction
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
