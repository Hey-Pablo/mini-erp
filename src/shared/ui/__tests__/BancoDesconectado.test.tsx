import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BancoDesconectado } from '../BancoDesconectado';

describe('BancoDesconectado', () => {
  it('deve renderizar o aviso padrão (warning)', () => {
    render(<BancoDesconectado />);

    expect(screen.getByText('Banco não conectado')).toBeInTheDocument();
    expect(screen.getByText(/Configurar o banco no README/i)).toBeInTheDocument();
  });

  it('deve renderizar com variant info', () => {
    render(<BancoDesconectado variant="info" />);

    expect(screen.getByText('Banco não conectado')).toBeInTheDocument();
  });

  it('deve ter link para o README', () => {
    render(<BancoDesconectado />);

    const link = screen.getByText('Configurar o banco no README');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toContain('github.com');
  });
});