import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={ref}
          className={`
            w-full rounded-lg border border-gray-300 bg-white px-10 py-2 text-sm
            placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500
            disabled:cursor-not-allowed disabled:opacity-50
            dark:border-gray-600 dark:bg-gray-800 dark:placeholder-gray-400
            dark:focus:border-primary-400 dark:focus:ring-primary-400
            ${className || ''}
          `}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };