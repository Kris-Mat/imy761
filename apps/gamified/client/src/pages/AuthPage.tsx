import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Anchor,
  Box,
  Button,
  Checkbox,
  Flex,
  Group,
  Image,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { useForm, isNotEmpty, isEmail } from '@mantine/form';
import { Icon } from '@shared/ui/Icon';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import soilScientistImg from '../assets/soil-scientist.jpg';

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

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [submitting, setSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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
    setAuthError(null);
    try {
      const { error } = isLogin
        ? await authApi.login(values.email, values.password)
        : await authApi.signUp(values.email, values.password, {
          username: values.username,
          firstName: values.firstName,
          lastName: values.lastName
        });
      if (error) {
        setAuthError(error.message);
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
    setAuthError(null);
    forgotForm.reset();
  };

  return (
    <Box
      bg="white"
      mih="100vh"
      w="100%"
    >
      <Flex
        direction={{
          base: 'column', md: 'row'
        }}
        align="center"
        justify="center"
        gap={60}
        mih="100vh"
        p="xl"
      >
        <Box style={{
          flex: 1, maxWidth: 680
        }}
        >
          <Image
            src={soilScientistImg}
            alt=""
            radius="md"
          />
        </Box>

        <Box style={{
          flex: 1, maxWidth: 380, width: '100%' 
        }}
        >
          <Title
            order={1}
            c="charcoal.7"
          >
            {isForgot ? 'Reset password' : isLogin ? 'Login' : 'Sign up'}
          </Title>
          <Text
            c="dimmed"
            size="sm"
            mt={5}
            mb="lg"
          >
            {isForgot ? (
              forgotSent
                ? "We've sent a password reset link to your email."
                : "Enter your email and we'll send you a reset link."
            ) : (
              <>
                {isLogin ? 'Do not have an account yet? ' : 'Already have an account? '}
                <Anchor
                  size="sm"
                  component="button"
                  type="button"
                  onClick={() => {
                    setMode(isLogin ? 'signup' : 'login');
                    setAuthError(null);
                  }}
                >
                  {isLogin ? 'Create account' : 'Log in'}
                </Anchor>
              </>
            )}
          </Text>

          {isForgot ? (
            <>
              {!forgotSent && (
                <form onSubmit={forgotForm.onSubmit(handleForgotSubmit)}>
                  <Stack>
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
                onClick={backToLogin}
              >
                Back to log in
              </Anchor>
            </>
          ) : (
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
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
                      onClick={() => {
                        setMode('forgot');
                        setAuthError(null);
                      }}
                    >
                      Forgot password?
                    </Anchor>
                  </Group>
                )}

                {authError && (
                  <Text c="red" size="sm">
                    {authError}
                  </Text>
                )}

                <Button
                  type="submit"
                  fullWidth
                  mt="xl"
                  loading={submitting}
                >
                  {isLogin ? 'Log in' : 'Create account'}
                </Button>
              </Stack>
            </form>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

export default AuthPage;
