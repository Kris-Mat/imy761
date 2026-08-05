import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  layout('layouts/RequireAuth.tsx', [
    index('App.tsx')
  ]),
  route('login', 'pages/AuthPage.tsx'),
  route('reset-password', 'pages/ResetPasswordPage.tsx')
] satisfies RouteConfig;
