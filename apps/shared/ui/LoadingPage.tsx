import { Loader, MantineProvider, Stack } from '@mantine/core';
import '@mantine/core/styles.css';

export function LoadingPage() {
  return (
    <MantineProvider>
      <Stack
        align="center"
        justify="center"
        mih="100vh"
      >
        <Loader color="dark" />
      </Stack>
    </MantineProvider>
  );
}
