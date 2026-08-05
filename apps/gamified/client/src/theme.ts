import { createTheme } from '@mantine/core';

// Global colour scheme for the gamified client, sampled from the soil-scientist
// illustration on the login page: rust/terracotta amoeba, mustard-gold molecule
// diagram, olive-green grass and bacteria, charcoal soil layer.
// Import `theme` anywhere via `import { theme } from '@gamified-client/theme'` if you
// need to read a raw value; every Mantine component already inherits it through the
// single <MantineProvider> in src/root.tsx, so `color="terracotta"` etc. just works.
export const theme = createTheme({
  primaryColor: 'terracotta',
  colors: {
    terracotta: [
      '#fdf1ec', '#fadfd2', '#f3c0ac', '#eb9f84', '#e2805f',
      '#d66b48', '#c9603f', '#ad4f34', '#8a3f2a', '#5f2b1d'
    ],
    mustard: [
      '#fdf8ec', '#fbeed0', '#f6dfa8', '#f0cd7c', '#e8ba54',
      '#e2ae4c', '#dba24a', '#b98a3d', '#926d30', '#695022'
    ],
    moss: [
      '#f4f4e8', '#e6e6c8', '#d3d59e', '#bfc274', '#a8ac52',
      '#939651', '#7c7a4c', '#656341', '#4e4d33', '#363524'
    ],
    charcoal: [
      '#eef0f2', '#d4d8dd', '#b3bac2', '#8f99a4', '#6b7783',
      '#4d5762', '#3a424c', '#2b2f3a', '#1f232b', '#14171c'
    ]
  }
});
