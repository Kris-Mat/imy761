import { forwardRef, type ReactNode } from 'react';
import { Paper, type PaperProps } from '@mantine/core';

interface SectionCardProps extends PaperProps {
  children?: ReactNode;
}

// Shared card look used across the plain app's pages, matching the gamified
// app's Paper style (see e.g. apps/gamified/client/src/pages/Quests.tsx).
// eslint-disable-next-line @typescript-eslint/naming-convention -- JSX requires a PascalCase identifier to render as a component
const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>((props, ref) => (
  <Paper
    ref={ref}
    radius="lg"
    shadow="sm"
    style={{ border: '1px solid var(--mantine-color-charcoal-2)' }}
    {...props}
  />
));

SectionCard.displayName = 'SectionCard';

export default SectionCard;
