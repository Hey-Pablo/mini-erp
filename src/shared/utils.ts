export function cn(...inputs: any[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatCurrency(value: number, locale = 'pt-BR', currency = 'BRL'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatDate(date: string | Date, locale = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: string | Date, locale = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function formatDocumento(doc: string, tipo: 'cpf' | 'cnpj'): string {
  const cleaned = doc.replace(/\D/g, '');
  if (tipo === 'cpf') {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function isValidCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
  return true;
}

export function isValidCnpj(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) return false;
  return true;
}
