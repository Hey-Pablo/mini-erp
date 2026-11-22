export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatarMoeda(valor: number, moeda = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda,
  }).format(valor);
}

export function formatarData(data: string | Date): string {
  const date = data instanceof Date ? data : new Date(data);
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function formatarCnpj(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, '');
  return numeros.replace(/(\d{2})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4');
}

export function formatarCpf(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function gerarId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}