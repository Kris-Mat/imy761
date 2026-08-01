import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Button,
  MantineProvider,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title
} from '@mantine/core';
import '@mantine/core/styles.css';
import { useForm } from '@mantine/form';
import { authApi } from '@shared/api/services/auth.api';

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormValues>({
    initialValues: { password: '', confirmPassword: '' },
    validate: {
      password: (value) => (value.length < 8 ? 'Password must be at least 8 characters' : null),
      confirmPassword: (value, values) => (value === values.password ? null : 'Passwords do not match')
    }
  });

  useEffect(() => {
    const { data } = authApi.onPasswordRecovery(() => setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setSubmitting(true);
    try {
      const { error } = await authApi.updatePassword(values.password);
      if (error) {
        form.setErrors({ password: error.message });
      } else {
        setDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MantineProvider>
      <Stack
        align="center"
        justify="center"
        mih="100vh"
        p="md"
      >
        <Paper
          withBorder
          shadow="md"
          radius="md"
          p="xl"
          w={400}
        >
          <Title order={2} ta="center">
            Set a new password
          </Title>

          {!ready && !done && (
            <Text
              c="dimmed"
              size="sm"
              ta="center"
              mt={5}
            >
              Waiting for the reset link to be verified...
            </Text>
          )}

          {done ? (
            <>
              <Text
                c="dimmed"
                size="sm"
                ta="center"
                mt={5}
              >
                Your password has been updated.
              </Text>
              <Button
                fullWidth
                mt="xl"
                color="dark"
                onClick={() => navigate('/login')}
              >
                Back to log in
              </Button>
            </>
          ) : ready && (
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack mt="lg">
                <PasswordInput
                  required
                  label="New password"
                  placeholder="Your new password"
                  {...form.getInputProps('password')}
                />
                <PasswordInput
                  required
                  label="Confirm password"
                  placeholder="Confirm new password"
                  {...form.getInputProps('confirmPassword')}
                />
                <Button
                  type="submit"
                  fullWidth
                  mt="xl"
                  color="dark"
                  loading={submitting}
                >
                  Update password
                </Button>
              </Stack>
            </form>
          )}
        </Paper>
      </Stack>
    </MantineProvider>
  );
}

export default ResetPasswordPage;
