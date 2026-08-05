import {
  Button, Group, Stack, Switch, Tabs, Text, UnstyledButton
} from '@mantine/core';
import type {
  AvatarFullConfig, EarSize, EyeBrowStyle, EyeStyle, GlassesStyle, HairStyle, HatStyle, MouthStyle, NoseStyle, Sex, ShirtStyle
} from 'react-nice-avatar';

// react-nice-avatar's colour fields accept any hex string, but its own
// genConfig() only ever randomizes among these — sampled directly from the
// library so every swatch here produces a combination genConfig() itself
// could have generated.
const FACE_COLORS = ['#F9C9B6', '#AC6651'];
const HAIR_AND_HAT_COLORS = ['#506AF4', '#ffffff', '#D2EFF3', '#000000', '#F48150', '#77311D', '#FC909F'];
const SHIRT_COLORS = ['#F4D150', '#9287FF', '#6BD9E9', '#FC909F', '#77311D'];
const BG_COLORS = [
  '#9287FF', '#F48150', '#FFEBA4', '#D2EFF3', '#74D153', '#E0DDFF',
  '#506AF4', '#FC909F', '#F4D150', '#FFEDEF', '#6BD9E9'
];

interface AvatarEditorProps {
  config: Required<AvatarFullConfig>;
  onChange: (patch: Partial<AvatarFullConfig>) => void;
}

function OptionPills<T extends string>({
  label, options, value, onSelect
}: {
  label: string;
  options: { value: T; label: string; }[];
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <Stack gap={6}>
      <Text
        fz="sm"
        fw={600}
        c="charcoal.7"
      >
        {label}
      </Text>
      <Group gap={8}>
        {options.map((option) => (
          <Button
            key={option.value}
            size="xs"
            radius="xl"
            variant={value === option.value ? 'filled' : 'default'}
            color="terracotta"
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </Group>
    </Stack>
  );
}

function ColorSwatches({
  label, options, value, onSelect
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <Stack gap={6}>
      <Text
        fz="sm"
        fw={600}
        c="charcoal.7"
      >
        {label}
      </Text>
      <Group gap={10}>
        {options.map((hex) => {
          const selected = value.toLowerCase() === hex.toLowerCase();
          return (
            <UnstyledButton
              key={hex}
              aria-label={hex}
              onClick={() => onSelect(hex)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: hex,
                border: selected ? '2px solid var(--mantine-color-terracotta-7)' : '1.5px solid var(--mantine-color-charcoal-3)',
                boxShadow: selected ? '0 0 0 2px var(--mantine-color-mustard-3)' : 'none',
                transition: 'box-shadow 150ms ease'
              }}
            />
          );
        })}
      </Group>
    </Stack>
  );
}

function AvatarEditor({ config, onChange }: AvatarEditorProps) {
  return (
    <Tabs
      defaultValue="face"
      color="terracotta"
    >
      <Tabs.List>
        <Tabs.Tab value="face">Face & Body</Tabs.Tab>
        <Tabs.Tab value="hair">Hair</Tabs.Tab>
        <Tabs.Tab value="accessories">Accessories</Tabs.Tab>
        <Tabs.Tab value="clothing">Clothing</Tabs.Tab>
        <Tabs.Tab value="background">Background</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="face">
        <Stack
          gap="lg"
          py="lg"
        >
          <OptionPills<Sex>
            label="Sex"
            value={config.sex}
            onSelect={(sex) => onChange({ sex })}
            options={[
              {
                value: 'man', label: 'Man' 
              },
              {
                value: 'woman', label: 'Woman' 
              }
            ]}
          />
          <ColorSwatches
            label="Face Color"
            options={FACE_COLORS}
            value={config.faceColor}
            onSelect={(faceColor) => onChange({ faceColor })}
          />
          <OptionPills<EarSize>
            label="Ear Size"
            value={config.earSize}
            onSelect={(earSize) => onChange({ earSize })}
            options={[
              {
                value: 'small', label: 'Small' 
              },
              {
                value: 'big', label: 'Big' 
              }
            ]}
          />
          <OptionPills<EyeStyle>
            label="Eye Style"
            value={config.eyeStyle}
            onSelect={(eyeStyle) => onChange({ eyeStyle })}
            options={[
              {
                value: 'circle', label: 'Circle' 
              },
              {
                value: 'oval', label: 'Oval' 
              },
              {
                value: 'smile', label: 'Smile' 
              }
            ]}
          />
          <OptionPills<EyeBrowStyle>
            label="Eyebrow Style"
            value={config.eyeBrowStyle}
            onSelect={(eyeBrowStyle) => onChange({ eyeBrowStyle })}
            options={[
              {
                value: 'up', label: 'Up' 
              },
              {
                value: 'upWoman', label: 'Raised' 
              }
            ]}
          />
          <OptionPills<NoseStyle>
            label="Nose Style"
            value={config.noseStyle}
            onSelect={(noseStyle) => onChange({ noseStyle })}
            options={[
              {
                value: 'short', label: 'Short' 
              },
              {
                value: 'long', label: 'Long' 
              },
              {
                value: 'round', label: 'Round' 
              }
            ]}
          />
          <OptionPills<MouthStyle>
            label="Mouth Style"
            value={config.mouthStyle}
            onSelect={(mouthStyle) => onChange({ mouthStyle })}
            options={[
              {
                value: 'laugh', label: 'Laugh' 
              },
              {
                value: 'smile', label: 'Smile' 
              },
              {
                value: 'peace', label: 'Peace' 
              }
            ]}
          />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="hair">
        <Stack
          gap="lg"
          py="lg"
        >
          <OptionPills<HairStyle>
            label="Hair Style"
            value={config.hairStyle}
            onSelect={(hairStyle) => onChange({ hairStyle })}
            options={[
              {
                value: 'normal', label: 'Normal' 
              },
              {
                value: 'thick', label: 'Thick' 
              },
              {
                value: 'mohawk', label: 'Mohawk' 
              },
              {
                value: 'womanLong', label: 'Long' 
              },
              {
                value: 'womanShort', label: 'Short' 
              }
            ]}
          />
          <ColorSwatches
            label="Hair Color"
            options={HAIR_AND_HAT_COLORS}
            value={config.hairColor}
            onSelect={(hairColor) => onChange({ hairColor })}
          />
          <Switch
            label="Randomize hair color highlights"
            checked={config.hairColorRandom}
            onChange={(event) => onChange({ hairColorRandom: event.currentTarget.checked })}
            color="terracotta"
          />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="accessories">
        <Stack
          gap="lg"
          py="lg"
        >
          <OptionPills<GlassesStyle>
            label="Glasses Style"
            value={config.glassesStyle}
            onSelect={(glassesStyle) => onChange({ glassesStyle })}
            options={[
              {
                value: 'none', label: 'None' 
              },
              {
                value: 'round', label: 'Round' 
              },
              {
                value: 'square', label: 'Square' 
              }
            ]}
          />
          <OptionPills<HatStyle>
            label="Hat Style"
            value={config.hatStyle}
            onSelect={(hatStyle) => onChange({ hatStyle })}
            options={[
              {
                value: 'none', label: 'None' 
              },
              {
                value: 'beanie', label: 'Beanie' 
              },
              {
                value: 'turban', label: 'Turban' 
              }
            ]}
          />
          <ColorSwatches
            label="Hat Color"
            options={HAIR_AND_HAT_COLORS}
            value={config.hatColor}
            onSelect={(hatColor) => onChange({ hatColor })}
          />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="clothing">
        <Stack
          gap="lg"
          py="lg"
        >
          <OptionPills<ShirtStyle>
            label="Shirt Style"
            value={config.shirtStyle}
            onSelect={(shirtStyle) => onChange({ shirtStyle })}
            options={[
              {
                value: 'hoody', label: 'Hoody' 
              },
              {
                value: 'short', label: 'Short Sleeve' 
              },
              {
                value: 'polo', label: 'Polo' 
              }
            ]}
          />
          <ColorSwatches
            label="Shirt Color"
            options={SHIRT_COLORS}
            value={config.shirtColor}
            onSelect={(shirtColor) => onChange({ shirtColor })}
          />
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="background">
        <Stack
          gap="lg"
          py="lg"
        >
          <ColorSwatches
            label="Background Color"
            options={BG_COLORS}
            value={config.bgColor}
            onSelect={(bgColor) => onChange({ bgColor })}
          />
          <Switch
            label="Gradient background"
            checked={config.isGradient}
            onChange={(event) => onChange({ isGradient: event.currentTarget.checked })}
            color="terracotta"
          />
        </Stack>
      </Tabs.Panel>
    </Tabs>
  );
}

export default AvatarEditor;
