/**
 * Validação de CPF
 *
 * Regras:
 * - 11 dígitos (somente números)
 * - Dígitos verificadores calculados conforme legislação da Receita Federal
 */

// Limpa CPF de máscara e caracteres não numéricos
export function limparCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

// Valida se o CPF tem 11 dígitos
export function temTamanhoValido(cpf: string): boolean {
  const numeros = limparCpf(cpf);
  return numeros.length === 11;
}

// Valida os dígitos verificadores
export function validarDigitos(cpf: string): boolean {
  const numeros = limparCpf(cpf);

  if (numeros.length !== 11) return false;

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  let digito1 = resto === 10 || resto === 11 ? 0 : resto;

  if (digito1 !== parseInt(numeros[9])) return false;

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  let digito2 = resto === 10 || resto === 11 ? 0 : resto;

  return digito2 === parseInt(numeros[10]);
}

// Valida CPF completo
export function validarCpf(cpf: string): boolean {
  const numeros = limparCpf(cpf);

  // CPF todos os dígitos iguais é inválido
  const todosIguais = /^(\d)\1+$/.test(numeros);
  if (todosIguais) return false;

  return temTamanhoValido(cpf) && validarDigitos(cpf);
}

// Import CNPJ validator for cross-validation
import { validarCnpj } from './cnpj';

// Valida se é um CPF ou CNPJ válido (formulário genérico)
export function validarDocumento(documento: string): { valido: boolean; tipo: 'cpf' | 'cnpj' | 'invalido' } {
  const numeros = documento.replace(/\D/g, '');

  if (numeros.length === 11) {
    return { valido: validarCpf(documento), tipo: 'cpf' };
  }

  if (numeros.length === 14) {
    return { valido: validarCnpj(documento), tipo: 'cnpj' };
  }

  return { valido: false, tipo: 'invalido' };
}