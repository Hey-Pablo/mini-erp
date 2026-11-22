import React from 'react';
import { forwardRef } from 'react';

const Badge = ({ variant = 'default', children }: { variant?: any; children: React.ReactNode }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variant === 'success' ? 'bg-green-100 text-green-800' : variant === 'danger' ? 'bg-red-100 text-red-800' : variant === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
    {children}
  </span>
);

const Button = ({ variant = 'primary', size = 'default', disabled, children, onClick }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : variant === 'secondary' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300' : 'bg-transparent hover:bg-gray-100'}`}
  >
    {children}
  </button>
);

const Input = ({ className = '', ...props }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

const Label = ({ children, ...props }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1" {...props}>{children}</label>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-500 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full caption-bottom text-sm">
      {children}
    </table>
  </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="[&_tr]:border-b">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
);

const TableRow = ({ children, ...props }: { children: React.ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className="border-b border-gray-200 transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100" {...props}>
    {children}
  </tr>
);

const TableHead = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</th>
);

const TableCell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</td>
);

const Select = ({ children, className = '', ...props }: any) => (
  <select
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </select>
);

export { Badge, Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select };
