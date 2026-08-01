import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  layout('layouts/RequireAuth.tsx', [
    index('App.tsx')
  ]),
  route('login', 'pages/AuthPage.tsx')
] satisfies RouteConfig;
