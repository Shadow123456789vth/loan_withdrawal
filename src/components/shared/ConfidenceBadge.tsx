import { Box, Tooltip } from '@mui/material';

interface Props {
  score: number;
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({ score, size = 'md' }: Props) {
  const color = score >= 90 ? '#16a34a' : score >= 70 ? '#FFAE41' : '#D14600';
  const bg = score >= 90 ? '#dcfce7' : score >= 70 ? '#fef9c3' : '#fee2e2';
  const label = score >= 90 ? 'High' : score >= 70 ? 'Medium' : 'Low';

  return (
    <Tooltip title={`${label} confidence: ${score}%`} arrow>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: size === 'sm' ? 0.75 : 1,
          py: size === 'sm' ? 0.25 : 0.4,
          borderRadius: '100px',
          backgroundColor: bg,
          color,
          fontFamily: '"Inter", sans-serif',
          fontWeight: 700,
          fontSize: size === 'sm' ? '0.65rem' : '0.72rem',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          cursor: 'default',
        }}
      >
        <Box
          component="span"
          sx={{
            width: size === 'sm' ? 5 : 6,
            height: size === 'sm' ? 5 : 6,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        {score}%
      </Box>
    </Tooltip>
  );
}
