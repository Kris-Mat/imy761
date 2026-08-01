import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Anchor,
  Badge,
  Button,
  Checkbox,
  Group,
  MantineProvider,
  Paper,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import '@mantine/core/styles.css';
import { useForm, isNotEmpty, isEmail } from '@mantine/form';
import { Icon } from '@shared/ui/Icon';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';

type AuthMode = 'login' | 'signup' | 'forgot';

interface AuthFormValues {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  rememberMe: boolean;
}

interface ForgotFormValues {
  email: string;
}

const BADGES = [
  {
    icon: 'Trophy', label: 'Earn XP'
  },
  {
    icon: 'Sparkle', label: 'Level up'
  },
  {
    icon: 'RocketLaunch', label: 'Unlock badges'
  }
] as const;

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [submitting, setSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const isLogin = mode === 'login';
  const isForgot = mode === 'forgot';
  const navigate = useNavigate();

  const form = useForm<AuthFormValues>({
    initialValues: {
      email: '', password: '', username: '', firstName: '', lastName: '', rememberMe: false
    },
    validate: {
      email: isEmail('Enter a valid email'),
      password: isLogin
        ? isNotEmpty('Enter your password')
        : (value) => (value.length < 8 ? 'Password must be at least 8 characters' : null),
      username: isLogin ? undefined : isNotEmpty('Username is required'),
      firstName: isLogin
        ? undefined
        : (value) => (value.trim().length > 0 ? null : 'First name is required'),
      lastName: isLogin
        ? undefined
        : (value) => (value.trim().length > 0 ? null : 'Last name is required')
    }
  });

  const forgotForm = useForm<ForgotFormValues>({
    initialValues: { email: '' },
    validate: { email: isEmail('Enter a valid email') }
  });

  useEffect(() => {
    const { data } = authApi.onAuthStateChange((session) => {
      if (!session) return;
      userApi
        .syncUser(session.access_token)
        .then(() => navigate('/'))
        .catch((error) => console.error('Failed to sync user after authentication', error));
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (values: AuthFormValues) => {
    setSubmitting(true);
    try {
      const { error } = isLogin
        ? await authApi.login(values.email, values.password)
        : await authApi.signUp(values.email, values.password, {
          username: values.username,
          firstName: values.firstName,
          lastName: values.lastName
        });
      if (error) {
        form.setErrors({ email: error.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (values: ForgotFormValues) => {
    setSubmitting(true);
    try {
      const { error } = await authApi.resetPasswordForEmail(values.email);
      if (error) {
        forgotForm.setErrors({ email: error.message });
      } else {
        setForgotSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backToLogin = () => {
    setMode('login');
    setForgotSent(false);
    forgotForm.reset();
  };

  return (
    <MantineProvider>
      <Stack
        align="center"
        justify="center"
        mih="100vh"
        p="md"
      >
        <Group gap="xs">
          {BADGES.map((badge) => (
            <Badge
              key={badge.icon}
              size="lg"
              radius="sm"
              variant="outline"
              color="dark"
              leftSection={<Icon name={badge.icon} size={14} />}
            >
              {badge.label}
            </Badge>
          ))}
        </Group>

        <Paper
          withBorder
          shadow="lg"
          radius="lg"
          p="xl"
          w={400}
          mt="sm"
        >
          {!isForgot && (
            <SegmentedControl
              fullWidth
              value={mode}
              onChange={(value) => setMode(value as AuthMode)}
              data={[
                {
                  label: 'Log in', value: 'login'
                },
                {
                  label: 'Sign up', value: 'signup'
                }
              ]}
            />
          )}

          <Title
            order={2}
            ta="center"
            mt="lg"
          >
            {isForgot ? 'Reset your password' : isLogin ? 'Ready to dig in?' : "Let's get started"}
          </Title>
          <Text
            c="dimmed"
            size="sm"
            ta="center"
            mt={5}
          >
            {isForgot
              ? forgotSent
                ? "We've sent a password reset link to your email."
                : "Enter your email and we'll send you a reset link."
              : isLogin
                ? 'Log in to keep your streak going.'
                : 'Create an account and start earning XP.'}
          </Text>

          {isForgot ? (
            <>
              {!forgotSent && (
                <form onSubmit={forgotForm.onSubmit(handleForgotSubmit)}>
                  <Stack mt="lg">
                    <TextInput
                      required
                      label="Email"
                      placeholder="you@example.com"
                      leftSection={<Icon name="EnvelopeSimple" size={16} />}
                      {...forgotForm.getInputProps('email')}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      mt="xl"
                      color="dark"
                      loading={submitting}
                    >
                      Send reset link
                    </Button>
                  </Stack>
                </form>
              )}
              <Anchor
                size="sm"
                component="button"
                type="button"
                mt="lg"
                display="block"
                ta="center"
                onClick={backToLogin}
              >
                Back to log in
              </Anchor>
            </>
          ) : (
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack mt="lg">
                <TextInput
                  required
                  label="Email"
                  placeholder="you@example.com"
                  leftSection={<Icon name="EnvelopeSimple" size={16} />}
                  {...form.getInputProps('email')}
                />
                <PasswordInput
                  required
                  label="Password"
                  placeholder="Your password"
                  {...form.getInputProps('password')}
                />
                {!isLogin && (
                  <>
                    <TextInput
                      required
                      label="Username"
                      placeholder="soildigger42"
                      {...form.getInputProps('username')}
                    />
                    <Group grow>
                      <TextInput
                        required
                        label="First name"
                        placeholder="Jane"
                        {...form.getInputProps('firstName')}
                      />
                      <TextInput
                        required
                        label="Last name"
                        placeholder="Doe"
                        {...form.getInputProps('lastName')}
                      />
                    </Group>
                  </>
                )}
                {isLogin && (
                  <Group justify="space-between">
                    <Checkbox
                      label="Remember me"
                      {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                    />
                    <Anchor
                      size="sm"
                      component="button"
                      type="button"
                      onClick={() => setMode('forgot')}
                    >
                      Forgot password?
                    </Anchor>
                  </Group>
                )}

                <Button
                  type="submit"
                  fullWidth
                  mt="xl"
                  color="dark"
                  loading={submitting}
                >
                  {isLogin ? 'Log in' : 'Create account'}
                </Button>
              </Stack>
            </form>
          )}
        </Paper>
      </Stack>
    </MantineProvider>
  );
}

export default AuthPage;
