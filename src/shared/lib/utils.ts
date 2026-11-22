import { validarCpf, validarCnpj, formatarCpf, formatarCnpj } from '../validators';

export function formatDocumento(documento: string, tipo: 'cpf' | 'cnpj'): string {
  if (tipo === 'cpf') {
    return formatarCpf(documento);
  }
  return formatarCnpj(documento);
}

export function validarDocumento(documento: string, tipo: 'cpf' | 'cnpj'): boolean {
  if (tipo === 'cpf') {
    return validarCpf(documento);
  }
  return validarCnpj(documento);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR');
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}