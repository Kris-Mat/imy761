export type Role = 'ADMIN' | 'USER';

// Deliberately generic rather than importing react-nice-avatar's own type:
// this model is shared with server code and the plain app, neither of which
// depend on that (client-only, gamified-only) package.
export type AvatarConfig = Record<string, string | number | boolean>;

export interface User {
  id: number;
  supabaseId: string | null;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarConfig: AvatarConfig | null;
}
