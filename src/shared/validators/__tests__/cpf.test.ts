import { limparCpf, validarCpf, temTamanhoValido } from '../cpf';

describe('Validação de CPF', () => {
  describe('limparCpf', () => {
    it('remove máscara e caracteres não numéricos', () => {
      expect(limparCpf('123.456.789-00')).toBe('12345678900');
      expect(limparCpf('123 456 789 00')).toBe('12345678900');
      expect(limparCpf('12345678900')).toBe('12345678900');
    });
  });

  describe('temTamanhoValido', () => {
    it('retorna true para CPF com 11 dígitos', () => {
      expect(temTamanhoValido('12345678900')).toBe(true);
      expect(temTamanhoValido('123.456.789-00')).toBe(true);
    });

    it('retorna false para CPF com tamanho inválido', () => {
      expect(temTamanhoValido('123456789')).toBe(false);
      expect(temTamanhoValido('123456789001')).toBe(false);
    });
  });

  describe('validarCpf', () => {
    it('retorna true para CPF válido', () => {
      // CPF conhecido válido: 529.982.247-25
      expect(validarCpf('52998224725')).toBe(true);
      expect(validarCpf('529.982.247-25')).toBe(true);
    });

    it('retorna false para CPF com dígitos verificadores inválidos', () => {
      expect(validarCpf('52998224726')).toBe(false);
      expect(validarCpf('12345678901')).toBe(false);
    });

    it('retorna false para CPF com todos os dígitos iguais', () => {
      expect(validarCpf('11111111111')).toBe(false);
      expect(validarCpf('22222222222')).toBe(false);
    });

    it('retorna false para CPF com tamanho inválido', () => {
      expect(validarCpf('123456789')).toBe(false);
      expect(validarCpf('123456789001')).toBe(false);
    });
  });
});