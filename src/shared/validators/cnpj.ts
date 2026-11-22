/**
 * Validação de CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * @param cnpj - String contendo o CNPJ (com ou sem máscara)
 * @returns true se o CNPJ for válido, false caso contrário
 */
export function validarCnpj(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cnpjNumerico = cnpj.replace(/\D/g, '');

  // CNPJ deve ter 14 dígitos
  if (cnpjNumerico.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1+$/.test(cnpjNumerico)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjNumerico[i]) * pesos1[i];
  }
  let resto = soma % 11;
  const dig1 = resto < 2 ? 0 : 11 - resto;
  if (dig1 !== parseInt(cnpjNumerico[12])) {
    return false;
  }

  // Validação do segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjNumerico[i]) * pesos2[i];
  }
  resto = soma % 11;
  const dig2 = resto < 2 ? 0 : 11 - resto;
  if (dig2 !== parseInt(cnpjNumerico[13])) {
    return false;
  }

  return true;
}

/**
 * Formata CNPJ com máscara
 * @param cnpj - String contendo o CNPJ
 * @returns CNPJ formatado como XX.XXX.XXX/XXXX-XX
 */
export function formatarCnpj(cnpj: string): string {
  const cnpjNumerico = cnpj.replace(/\D/g, '');
  return cnpjNumerico.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Normaliza CNPJ removendo máscara
 * @param cnpj - String contendo o CNPJ formatado ou não
 * @returns CNPJ sem máscara
 */
export function normalizarCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}