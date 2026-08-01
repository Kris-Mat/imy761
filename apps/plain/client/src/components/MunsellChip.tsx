import { Group, Text } from '@mantine/core';

// Approximates a Munsell notation as an HSL colour for display. Tuned for the
// single 7.5YR chart page supplied for this project (hue ~30 on the wheel);
// value (0-10, black-white) maps to lightness, chroma (0-8ish) maps to
// saturation. This is a display estimate, not a substitute for the real chip.
function munsellToHsl(value: number, chroma: number): string {
  const lightness = Math.min(96, Math.max(4, (value / 10) * 100));
  const saturation = Math.min(70, (chroma / 8) * 70);
  return `hsl(30, ${saturation}%, ${lightness}%)`;
}

interface MunsellChipProps {
  colourText: string;
  hue: string;
  value: number;
  chroma: number;
}

function MunsellChip({ colourText, hue, value, chroma }: MunsellChipProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          border: '1px solid var(--mantine-color-gray-4)',
          background: munsellToHsl(value, chroma),
          flexShrink: 0
        }}
      />
      <Text size="sm">{colourText} ({hue} {value}/{chroma})</Text>
    </Group>
  );
}

export default MunsellChip;
