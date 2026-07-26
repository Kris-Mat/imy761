import { forwardRef } from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import type { Icon as PhosphorIcon, IconProps } from '@phosphor-icons/react';

export type IconName = Exclude<keyof typeof PhosphorIcons, 'IconContext'>;

interface Props extends IconProps {
  name: IconName;
}

// eslint-disable-next-line @typescript-eslint/naming-convention -- JSX requires a PascalCase identifier to render as a component
export const Icon = forwardRef<SVGSVGElement, Props>(({ name, ...props }, ref) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- JSX requires a PascalCase identifier to render as a component
  const Component = PhosphorIcons[name] as PhosphorIcon;
  return <Component ref={ref} {...props} />;
});

Icon.displayName = 'Icon';
