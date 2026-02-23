import { Chip } from '@mui/material';
import type { EntitySource } from '../../types/entities';
import { DXC } from '../../theme/dxcTheme';

interface Props {
  source: EntitySource;
  size?: 'small' | 'medium';
}

const CONFIG: Record<EntitySource, { label: string; bg: string; color: string }> = {
  IDP: { label: 'IDP', bg: '#dbeafe', color: DXC.trueBlue },
  Policy: { label: 'Policy', bg: '#e0e7ff', color: DXC.royalBlue },
  Workflow: { label: 'Workflow', bg: '#fef9c3', color: '#b45309' },
};

export function EntitySourceChip({ source, size = 'small' }: Props) {
  const { label, bg, color } = CONFIG[source];
  return (
    <Chip
      label={label}
      size={size}
      sx={{
        backgroundColor: bg,
        color,
        fontWeight: 700,
        fontSize: '0.65rem',
        letterSpacing: '0.03em',
        height: 20,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
