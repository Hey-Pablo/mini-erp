/**
 * Validação de CPF (Cadastro de Pessoas Físicas)
 * @param cpf - String contendo o CPF (com ou sem máscara)
 * @returns true se o CPF for válido, false caso contrário
 */
export function validarCpf(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cpfNumerico = cpf.replace(/\D/g, '');

  // CPF deve ter 11 dígitos
  if (cpfNumerico.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1+$/.test(cpfNumerico)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfNumerico[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpfNumerico[9])) {
    return false;
  }

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfNumerico[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpfNumerico[10])) {
    return false;
  }

  return true;
}

/**
 * Formata CPF com máscara
 * @param cpf - String contendo o CPF
 * @returns CPF formatado como XXX.XXX.XXX-XX
 */
export function formatarCpf(cpf: string): string {
  const cpfNumerico = cpf.replace(/\D/g, '');
  return cpfNumerico.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Normaliza CPF removendo máscara
 * @param cpf - String contendo o CPF formatado ou não
 * @returns CPF sem máscara
 */
export function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}