import { Paper, Stack, Text } from '@mantine/core';
import { useHover } from '@mantine/hooks';

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  const { hovered, ref } = useHover<HTMLDivElement>();

  return (
    <Paper
      ref={ref}
      className="stat-card"
      radius="lg"
      p="md"
      style={{
        aspectRatio: '1 / 1',
        border: '1.5px solid white',
        backgroundColor: hovered ? 'var(--mantine-color-charcoal-6)' : 'transparent',
        boxShadow: hovered ? '0 0 30px rgba(255, 255, 255, 0.4)' : 'none',
        transition: 'background-color 200ms ease, box-shadow 200ms ease'
      }}
    >
      <Stack
        gap={4}
        justify="center"
        align="center"
        h="100%"
      >
        <Text
          fz={26}
          fw={700}
          c="white"
        >
          {value}
        </Text>
        <Text
          fz="sm"
          c="charcoal.1"
          ta="center"
        >
          {label}
        </Text>
      </Stack>
    </Paper>
  );
}

export default StatCard;
