import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

const Pagination = ({ currentPage, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) => {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];

    if (currentPage === 1) {
      pages.push(1);
      if (totalPages > 1) {
        pages.push(2);
        if (totalPages > 3) pages.push('ellipsis');
        for (let i = totalPages - 1; i <= totalPages; i++) {
          pages.push(i);
        }
      }
    } else if (currentPage === totalPages) {
      for (let i = 1; i <= totalPages - 1; i++) {
        if (i === 1) pages.push(1);
        else if (i === 2) pages.push(2);
        else if (i === totalPages - 1) {
          if (totalPages > 3) pages.push('ellipsis');
          pages.push(totalPages - 1);
        }
        else if (i === totalPages) pages.push(totalPages);
        else if (totalPages > 3) {
          if (i === totalPages - 2) {
            if (totalPages > 4) pages.push('ellipsis');
          }
          pages.push(i);
        }
      }
      pages.push(totalPages);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('ellipsis');
      } else {
        if (currentPage > 2) pages.push(2);
        if (currentPage > 3) pages.push(3);
      }
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        if (i !== 1 && i !== totalPages && i !== currentPage) {
          pages.push(i);
        }
      }
      if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) {
          pages.push('ellipsis');
        }
        pages.push(totalPages - 1);
      }
      if (currentPage < totalPages) pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <nav className="flex items-center space-x-1">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Primeira página"
      >
        <ChevronLeft className="h-4 w-4" />
        <ChevronRight className="absolute h-4 w-4 rotate-180" />
      </button>

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, idx) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${idx}`} className="flex h-8 w-8 items-center justify-center text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`
              flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium
              ${currentPage === page
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }
            `}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page as number}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Próxima página"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Última página"
      >
        <ChevronRight className="h-4 w-4" />
        <ChevronLeft className="absolute h-4 w-4 rotate-180" />
      </button>
    </nav>
  );
};

export { Pagination };