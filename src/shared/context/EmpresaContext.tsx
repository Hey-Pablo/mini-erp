import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../api/client';
import type { Empresa, Perfil, Usuario } from '../types';

interface EmpresaContextType {
  empresa: Empresa | null;
  usuario: Usuario | null;
  perfil: Perfil | null;
  carregando: boolean;
  temPermissao: (papels: Perfil['papel'][]) => boolean;
  signOut: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const fetchEmpresaEEmpresa = async () => {
      try {
        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setCarregando(false);
          return;
        }

        // Montar usuário local
        const usuarioLocal: Usuario = {
          id: user.id,
          email: user.email || '',
          nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
          documento: user.user_metadata?.documento || '',
          tipo_documento: user.user_metadata?.tipo_documento || 'cpf',
        };

        setUsuario(usuarioLocal);

        // Buscar perfil do usuário
        const { data: perfilData } = await supabase
          .from<Perfil, 'perfis'>('perfis')
          .select('*')
          .eq('usuario_id', user.id)
          .single();

        if (perfilData) {
          setPerfil(perfilData);

          // Buscar empresa
          const { data: empresaData } = await supabase
            .from<Empresa, 'empresas'>('empresas')
            .select('*')
            .eq('empresa_id', perfilData.empresa_id)
            .single();

          if (empresaData) {
            setEmpresa(empresaData);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar contexto da empresa:', error);
      } finally {
        setCarregando(false);
      }
    };

    fetchEmpresaEEmpresa();

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (newSession) {
          fetchEmpresaEEmpresa();
        } else {
          setEmpresa(null);
          setUsuario(null);
          setPerfil(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const temPermissao = (papels: Perfil['papel'][]) => {
    if (!perfil) return false;
    return papels.includes(perfil.papel);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmpresa(null);
    setUsuario(null);
    setPerfil(null);
  };

  const value: EmpresaContextType = {
    empresa,
    usuario,
    perfil,
    carregando,
    temPermissao,
    signOut,
  };

  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  );
}

export const useEmpresa = () => {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error('useEmpresa must be used within an EmpresaProvider');
  }
  return context;
};