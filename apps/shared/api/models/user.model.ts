export type Role = 'ADMIN' | 'USER';

export interface User {
  id: number;
  supabaseId: string | null;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}
