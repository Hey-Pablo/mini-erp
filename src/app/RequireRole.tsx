import React from 'react';
import { Navigate } from 'react-router-dom';
import { useEmpresa } from '../shared/context';
import type { Perfil } from '../shared/types';
import { Button } from '../shared/ui/Button';

export function RequireRole({
  roles,
  children
}: {
  children: React.ReactElement;
  roles: Perfil['papel'][];
}) {
  const { perfil, carregando } = useEmpresa();

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!perfil) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(perfil.papel)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  return children;
}