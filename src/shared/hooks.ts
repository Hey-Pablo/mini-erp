import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email || '' } : null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email || '' } : null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signOut };
}

export function useEmpresa() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const empresaId = localStorage.getItem('empresa_id');
    if (empresaId) {
      supabase.from('empresas').select('*').eq('id', empresaId).single()
        .then(({ data }) => {
          setEmpresa(data);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const temPapel = useCallback((papeis: string[]) => {
    return perfil ? papeis.includes(perfil.papel) : false;
  }, [perfil]);

  return { empresa, perfil, loading, temPapel };
}

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
