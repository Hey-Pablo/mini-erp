import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
  onMudarPagina: (pagina: number) => void;
  maxBotoes?: number;
}

export function Pagination({
  paginaAtual,
  totalPaginas,
  totalItens,
  itensPorPagina,
  onMudarPagina,
  maxBotoes = 7,
}: PaginationProps) {
  if (totalPaginas <= 1) return null;

  const criarIntervalo = () => {
    const intervalo: (number | string)[] = [];
    const meio = Math.floor(maxBotoes / 2);

    let inicio = Math.max(1, paginaAtual - meio);
    let fim = Math.min(totalPaginas, inicio + maxBotoes - 1);

    // Ajustar se estourar o fim
    if (fim - inicio < maxBotoes - 1) {
      fim = Math.min(totalPaginas, fim);
      inicio = Math.max(1, fim - maxBotoes + 1);
    }

    for (let i = inicio; i <= fim; i++) {
      intervalo.push(i);
    }

    return intervalo;
  };

  const intervalo = criarIntervalo();

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        Mostrando{' '}
        <strong className="text-gray-900">
          {(paginaAtual - 1) * itensPorPagina + 1} a{' '}
          {Math.min(paginaAtual * itensPorPagina, totalItens)}
        </strong>{' '}
        de <strong className="text-gray-900">{totalItens}</strong> itens
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onMudarPagina(1)}
          disabled={paginaAtual === 1}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          aria-label="Primeira página"
        >
          <ChevronLeft className="h-4 w-4 -rotate-90" />
        </button>

        <button
          onClick={() => onMudarPagina(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {intervalo.map((item, idx) => {
          if (item === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-8 w-8 items-center justify-center text-gray-400"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          return (
            <button
              key={item}
              onClick={() => onMudarPagina(item as number)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                paginaAtual === item
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100',
              )}
              aria-current="page"
            >
              {item}
            </button>
          );
        })}

        <button
          onClick={() => onMudarPagina(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => onMudarPagina(totalPaginas)}
          disabled={paginaAtual === totalPaginas}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          aria-label="Última página"
        >
          <ChevronRight className="h-4 w-4 -rotate-90" />
        </button>
      </div>
    </div>
  );
}