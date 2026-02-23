import { Card, CardContent, Typography, Box } from '@mui/material';

interface Props {
  label: string;
  value: string;
  subtext?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}

export function KPICard({ label, value, subtext, accentColor = '#4995FF', icon }: Props) {
  return (
    <Card
      sx={{
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: '16px',
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'rgba(14,16,32,0.55)', fontSize: '0.68rem', lineHeight: 1.2, display: 'block', mb: 0.5 }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"GT Standard Extended", "Arial Black", sans-serif',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: '#0E1020',
                lineHeight: 1.1,
              }}
            >
              {value}
            </Typography>
            {subtext && (
              <Typography variant="caption" sx={{ color: 'rgba(14,16,32,0.55)', mt: 0.5, display: 'block' }}>
                {subtext}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ color: accentColor, opacity: 0.7, mt: 0.25 }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
