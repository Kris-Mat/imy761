import { supabase } from './supabase.client';
import type { Session } from '@supabase/supabase-js';

class AuthApi {
  async signUp(
    email: string,
    password: string,
    profile: { username: string; firstName: string; lastName: string }
  ) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: profile }
    });
  }

  async login(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  async logout() {
    return supabase.auth.signOut();
  }

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => callback(session));
  }
}

export const authApi = new AuthApi();
