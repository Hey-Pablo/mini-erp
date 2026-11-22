import { limparCnpj, validarCnpj, temTamanhoValido, formatarCnpj } from '../cnpj';

describe('Validação de CNPJ', () => {
  describe('limparCnpj', () => {
    it('remove máscara e caracteres não numéricos', () => {
      expect(limparCnpj('11.444.777/0001-61')).toBe('11444777000161');
      expect(limparCnpj('11 444 777 0001 61')).toBe('11444777000161');
      expect(limparCnpj('11444777000161')).toBe('11444777000161');
    });
  });

  describe('temTamanhoValido', () => {
    it('retorna true para CNPJ com 14 dígitos', () => {
      expect(temTamanhoValido('11444777000161')).toBe(true);
      expect(temTamanhoValido('11.444.777/0001-61')).toBe(true);
    });

    it('retorna false para CNPJ com tamanho inválido', () => {
      expect(temTamanhoValido('114447770001')).toBe(false);
      expect(temTamanhoValido('114447770001616')).toBe(false);
    });
  });

  describe('validarCnpj', () => {
    it('retorna true para CNPJ válido', () => {
      // CNPJ conhecido válido: 11.444.777/0001-61
      expect(validarCnpj('11444777000161')).toBe(true);
      expect(validarCnpj('11.444.777/0001-61')).toBe(true);
    });

    it('retorna false para CNPJ com dígitos verificadores inválidos', () => {
      expect(validarCnpj('11444777000162')).toBe(false);
      expect(validarCnpj('11222333000149')).toBe(false); // último dígito errado
    });

    it('retorna false para CNPJ com todos os dígitos iguais', () => {
      expect(validarCnpj('11111111111111')).toBe(false);
      expect(validarCnpj('22222222222222')).toBe(false);
    });

    it('retorna false para CNPJ com tamanho inválido', () => {
      expect(validarCnpj('114447770001')).toBe(false);
      expect(validarCnpj('114447770001616')).toBe(false);
    });
  });

  describe('formatarCnpj', () => {
    it('formata CNPJ com máscara correta', () => {
      expect(formatarCnpj('11444777000161')).toBe('11.444.777/0001-61');
      expect(formatarCnpj('66.095.179/0001-75')).toBe('66.095.179/0001-75');
    });
  });
});