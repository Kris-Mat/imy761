import { useEffect, useRef } from 'react';
import { Paper, Stack, Text } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { gsap } from '../lib/gsap';

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  const { hovered, ref: hoverRef } = useHover<HTMLDivElement>();
  const cardRef = useRef<HTMLDivElement>(null);

  // Home's scroll animation also sets this element's transform (via GSAP)
  // to translate it into place. Doing the hover scale through React's style
  // prop instead of GSAP would overwrite that transform on the first hover
  // — so the scale is driven through GSAP too, which composes both instead
  // of one clobbering the other.
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      scale: hovered ? 1.05 : 1,
      duration: 0.2,
      ease: 'power1.out'
    });
  }, [hovered]);

  return (
    <Paper
      ref={(node: HTMLDivElement | null) => {
        cardRef.current = node;
        hoverRef(node);
      }}
      className="stat-card"
      radius="lg"
      p="sm"
      style={{
        aspectRatio: '2 / 1',
        border: '1.5px solid white',
        backgroundColor: 'var(--mantine-color-charcoal-6)'
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
