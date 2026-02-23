import { Chip } from '@mui/material';
import type { TouchLevel } from '../../types/entities';
import { DXC } from '../../theme/dxcTheme';

interface Props {
  level: TouchLevel;
  size?: 'small' | 'medium';
}

const CONFIG: Record<TouchLevel, { label: string; bg: string; color: string }> = {
  STP: { label: 'STP', bg: '#dcfce7', color: DXC.stp },
  LOW: { label: 'Low Touch', bg: '#dbeafe', color: DXC.lowTouch },
  MODERATE: { label: 'Moderate Touch', bg: '#fef9c3', color: '#b45309' },
  HIGH: { label: 'High Touch', bg: '#fee2e2', color: DXC.highTouch },
};

export function TouchLevelBadge({ level, size = 'small' }: Props) {
  const { label, bg, color } = CONFIG[level];
  return (
    <Chip
      label={label}
      size={size}
      sx={{
        backgroundColor: bg,
        color,
        fontWeight: 800,
        fontSize: size === 'small' ? '0.68rem' : '0.78rem',
        letterSpacing: '0.04em',
        border: `1.5px solid ${color}`,
        height: size === 'small' ? 24 : 28,
      }}
    />
  );
}
