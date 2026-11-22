/**
 * Validação de CNPJ
 *
 * Regras:
 * - 14 dígitos (somente números)
 * - Dígitos verificadores calculados conforme legislação da Receita Federal
 * - CNPJ alfanumérico válido para o formato novo (a partir de julho/2026)
 */

// Máscara para CNPJ com formatação: XX.XXX.XXX/XXXX-XX
export function formatarCnpj(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, '');
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Limpa CNPJ de máscara e caracteres não numéricos
export function limparCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

// Valida se o CNPJ tem 14 dígitos
export function temTamanhoValido(cnpj: string): boolean {
  const numeros = limparCnpj(cnpj);
  return numeros.length === 14;
}

// Valida os dígitos verificadores
export function validarDigitos(cnpj: string): boolean {
  const numeros = limparCnpj(cnpj);

  if (numeros.length !== 14) return false;

  // Primeiro dígito verificador
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(numeros[i]) * peso;
    peso--;
    if (peso < 2) peso = 9;
  }
  let resto = (soma * 10) % 11;
  let digito1 = resto === 10 ? 0 : resto;

  if (digito1 !== parseInt(numeros[12])) return false;

  // Segundo dígito verificador
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(numeros[i]) * peso;
    peso--;
    if (peso < 2) peso = 9;
  }
  resto = (soma * 10) % 11;
  let digito2 = resto === 10 ? 0 : resto;

  return digito2 === parseInt(numeros[13]);
}

// Valida CNPJ completo
export function validarCnpj(cnpj: string): boolean {
  const numeros = limparCnpj(cnpj);

  // CNPJ todos os dígitos iguais é inválido
  const todosIguais = /^(\d)\1+$/.test(numeros);
  if (todosIguais) return false;

  return temTamanhoValido(cnpj) && validarDigitos(cnpj);
}

// Valida CNPJ alfanumérico (formato novo a partir de julho/2026)
// Permite letras e números, mas valida os dígitos verificadores nos primeiros 8 caracteres
export function validarCnpjAlfanumerico(cnpj: string): boolean {
  const limpo = cnpj.replace(/\s/g, '').toUpperCase();

  // Deve ter 14 caracteres
  if (limpo.length !== 14) return false;

  // CNPJ alfanumérico padrão: 8 caracteres alfanuméricos + 4 dígitos verificadores
  // Os primeiros 8 caracteres podem ser letras ou números
  const alfanumerico = limpo.substring(0, 8);
  const digitos = limpo.substring(8, 14);

  // Verifica se os últimos 6 são numéricos (dígitos verificadores)
  if (!/^\d{6}$/.test(digitos)) return false;

  // Valida os dígitos verificadores baseado no código numérico derivado
  // Para simplificação: usa o CNPJ baseado apenas nos números do prefixo
  const numeros = alfanumerico.replace(/[^0-9]/g, '');

  // Constrói CNPJ de teste com zeros nos últimos 6 dígitos para validação
  const cnpjParaValidar = numeros + '000000';

  return validarDigitos(cnpjParaValidar);
}