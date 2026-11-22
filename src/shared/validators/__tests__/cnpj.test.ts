import { describe, it, expect } from 'vitest';
import { validarCnpj, formatarCnpj, normalizarCnpj } from '../cnpj';

describe('validarCnpj', () => {
  it('deve validar CNPJ válido', () => {
    expect(validarCnpj('11444777000161')).toBe(true);
    expect(validarCnpj('11.444.777/0001-61')).toBe(true);
  });

  it('deve rejeitar CNPJ com dígitos verificadores inválidos', () => {
    expect(validarCnpj('11444777000162')).toBe(false);
    expect(validarCnpj('12345678901234')).toBe(false);
  });

  it('deve rejeitar CNPJ com menos de 14 dígitos', () => {
    expect(validarCnpj('1234567890123')).toBe(false);
  });

  it('deve rejeitar CNPJ com todos os dígitos iguais', () => {
    expect(validarCnpj('11111111111111')).toBe(false);
    expect(validarCnpj('00000000000000')).toBe(false);
  });

  it('deve aceitar CNPJ com ou sem máscara', () => {
    expect(validarCnpj('11444777000161')).toBe(true);
    expect(validarCnpj('11.444.777/0001-61')).toBe(true);
  });
});

describe('formatarCnpj', () => {
  it('deve formatar CNPJ corretamente', () => {
    expect(formatarCnpj('11444777000161')).toBe('11.444.777/0001-61');
  });
});

describe('normalizarCnpj', () => {
  it('deve remover máscara do CNPJ', () => {
    expect(normalizarCnpj('11.444.777/0001-61')).toBe('11444777000161');
    expect(normalizarCnpj('11444777000161')).toBe('11444777000161');
  });
});