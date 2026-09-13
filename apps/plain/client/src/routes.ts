import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  layout('layouts/RequireAuth.tsx', [
    layout('components/Layout.tsx', [
      index('pages/Home.tsx'),
      route('tests', 'pages/Tests.tsx'),
      route('tests/:monolithId', 'pages/ChapterRunner.tsx'),
      route('completed', 'pages/Completed.tsx'),
      route('profile', 'pages/Profile.tsx'),
      // Not linked from student-facing nav — AdminNavLink (in Layout) only
      // renders itself for ADMIN accounts, and RequireAdmin gates the page
      // itself. See RequireAdmin.tsx / AdminNavLink.tsx.
      layout('layouts/RequireAdmin.tsx', [
        route('admin', 'pages/Admin.tsx')
      ])
    ])
  ]),
  route('login', 'pages/AuthPage.tsx'),
  route('reset-password', 'pages/ResetPasswordPage.tsx')
] satisfies RouteConfig;
