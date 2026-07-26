import { forwardRef } from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import type { Icon as PhosphorIcon, IconProps } from '@phosphor-icons/react';

export type IconName = Exclude<keyof typeof PhosphorIcons, 'IconContext'>;

interface Props extends IconProps {
  name: IconName;
}

export const Icon = forwardRef<SVGSVGElement, Props>(({ name, ...props }, ref) => {
  const Component = PhosphorIcons[name] as PhosphorIcon;
  return <Component ref={ref} {...props} />;
});

Icon.displayName = 'Icon';
