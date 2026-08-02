import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  layout('layouts/RequireAuth.tsx', [
    layout('components/Layout.tsx', [
      index('pages/Home.tsx'),
      route('profile', 'pages/Profile.tsx')
    ])
  ]),
  route('login', 'pages/AuthPage.tsx'),
  route('reset-password', 'pages/ResetPasswordPage.tsx')
] satisfies RouteConfig;
