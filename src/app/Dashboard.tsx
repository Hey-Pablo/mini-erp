import { Card, CardHeader, CardTitle, CardContent } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">125</p>
            <p className="text-xs text-gray-500">Total de clientes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">48</p>
            <p className="text-xs text-gray-500">Total de fornecedores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">342</p>
            <p className="text-xs text-gray-500">Total de produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1</p>
            <p className="text-xs text-gray-500">Sua empresa</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="primary" className="justify-start">
                Gerenciar Clientes
              </Button>
              <Button variant="primary" className="justify-start">
                Gerenciar Fornecedores
              </Button>
              <Button variant="primary" className="justify-start">
                Gerenciar Produtos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}