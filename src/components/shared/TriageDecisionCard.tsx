import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import type { TriageResult } from '../../types/entities';
import { TouchLevelBadge } from './TouchLevelBadge';
import { DXC } from '../../theme/dxcTheme';

interface Props {
  result: TriageResult;
}

export function TriageDecisionCard({ result }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${DXC.midnightBlue} 0%, #1a1e3a 100%)`,
        color: DXC.white,
        borderRadius: '16px',
        border: 'none',
        mb: 2,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountTreeIcon sx={{ color: DXC.sky, fontSize: 20 }} />
            <Typography
              sx={{
                fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                fontWeight: 500,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: DXC.sky,
              }}
            >
              Triage Decision
            </Typography>
          </Box>

          <TouchLevelBadge level={result.touchLevel} />

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
              {result.matchedRuleDescription}
            </Typography>
          </Box>

          {/* Key factors */}
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {result.keyFactors.slice(0, 3).map((f, i) => (
              <Chip
                key={i}
                label={f}
                size="small"
                sx={{
                  backgroundColor: 'rgba(73,149,255,0.2)',
                  color: DXC.sky,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  border: '1px solid rgba(161,230,255,0.3)',
                  height: 22,
                }}
              />
            ))}
          </Box>

          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              color: 'rgba(255,255,255,0.6)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        {/* Expanded evaluation log */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.15)' }} />
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'rgba(255,255,255,0.5)',
              mb: 1.5,
            }}
          >
            Full Evaluation Log
          </Typography>

          {result.evaluationLog.map((ruleLog) => (
            <Box
              key={ruleLog.ruleId}
              sx={{
                mb: 1.5,
                p: 1.5,
                borderRadius: '12px',
                backgroundColor: ruleLog.passed
                  ? 'rgba(22,163,74,0.15)'
                  : 'rgba(255,255,255,0.05)',
                border: ruleLog.passed
                  ? '1px solid rgba(22,163,74,0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                {ruleLog.passed ? (
                  <CheckCircleIcon sx={{ fontSize: 16, color: '#4ade80' }} />
                ) : (
                  <RemoveCircleIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
                )}
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: ruleLog.passed ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>
                  Rule {ruleLog.ruleOrder}{ruleLog.isDefault ? ' (Default)' : ''}: {ruleLog.description}
                </Typography>
                {ruleLog.passed && <TouchLevelBadge level={result.touchLevel} size="small" />}
              </Box>

              {ruleLog.conditions.length > 0 && (
                <List dense disablePadding sx={{ pl: 3 }}>
                  {ruleLog.conditions.map((cond) => (
                    <ListItem key={cond.conditionId} disablePadding sx={{ py: 0.1 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        {cond.passed ? (
                          <CheckCircleIcon sx={{ fontSize: 13, color: '#4ade80' }} />
                        ) : (
                          <CancelIcon sx={{ fontSize: 13, color: '#f87171' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                            {cond.displayName}: <strong>{cond.actualValue}</strong>
                            {cond.expectedValue !== 'ANY' && (
                              <span style={{ color: 'rgba(255,255,255,0.4)' }}> (expected {cond.expectedValue})</span>
                            )}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          ))}
        </Collapse>
      </CardContent>
    </Card>
  );
}
