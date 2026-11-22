import { describe, it, expect } from 'vitest';
import { validarCpf, formatarCpf, normalizarCpf } from '../cpf';

describe('validarCpf', () => {
  it('deve validar CPF válido', () => {
    expect(validarCpf('52998224725')).toBe(true);
    expect(validarCpf('529.982.247-25')).toBe(true);
  });

  it('deve rejeitar CPF com dígitos verificadores inválidos', () => {
    expect(validarCpf('52998224726')).toBe(false);
    expect(validarCpf('12345678901')).toBe(false);
  });

  it('deve rejeitar CPF com menos de 11 dígitos', () => {
    expect(validarCpf('1234567890')).toBe(false);
  });

  it('deve rejeitar CPF com mais de 11 dígitos', () => {
    expect(validarCpf('123456789012')).toBe(false);
  });

  it('deve rejeitar CPF com todos os dígitos iguais', () => {
    expect(validarCpf('11111111111')).toBe(false);
    expect(validarCpf('22222222222')).toBe(false);
    expect(validarCpf('00000000000')).toBe(false);
  });

  it('deve aceitar CPF com ou sem máscara', () => {
    expect(validarCpf('52998224725')).toBe(true);
    expect(validarCpf('529.982.247-25')).toBe(true);
  });
});

describe('formatarCpf', () => {
  it('deve formatar CPF corretamente', () => {
    expect(formatarCpf('52998224725')).toBe('529.982.247-25');
  });
});

describe('normalizarCpf', () => {
  it('deve remover máscara do CPF', () => {
    expect(normalizarCpf('529.982.247-25')).toBe('52998224725');
    expect(normalizarCpf('52998224725')).toBe('52998224725');
  });
});