import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from './Card';

interface BancoDesconectadoProps {
  variant?: 'info' | 'warning';
}

export function BancoDesconectado({ variant = 'warning' }: BancoDesconectadoProps) {
  const isWarning = variant === 'warning';

  return (
    <Card className={isWarning ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-5 w-5 ${isWarning ? 'text-yellow-600' : 'text-blue-600'} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${isWarning ? 'text-yellow-800' : 'text-blue-800'}`}>
              Banco não conectado
            </p>
            <p className={`text-sm mt-1 ${isWarning ? 'text-yellow-700' : 'text-blue-700'}`}>
              Veja{' '}
              <a
                href="https://github.com/Hey-Pablo/mini-erp?tab=readme-ov-file#configurar-o-banco"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:underline-offset-2"
              >
                Configurar o banco no README
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}