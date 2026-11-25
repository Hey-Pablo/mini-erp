import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { SearchInput } from '../../../shared/ui/SearchInput';
import { Pagination } from '../../../shared/ui/Pagination';
import { useEmpresa } from '../../../shared/context';
import { usePedidos, useFaturarPedido, useCancelarPedido, useProdutos, useCreatePedido } from '../../../shared/api/hooks';
import type { PedidoComItens, Produto } from '../../../shared/types';
import { gerarDocumentoPedido } from '../documentoPedido';
import {
  Plus,
  Eye,
  Truck,
  XCircle,
  AlertCircle,
  Package,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR');
}

interface StatusBadgeProps {
  status: 'aberto' | 'faturado' | 'cancelado';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    aberto: 'bg-blue-100 text-blue-800',
    faturado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
  };

  const labels = {
    aberto: 'Aberto',
    faturado: 'Faturado',
    cancelado: 'Cancelado',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

interface PedidoRowProps {
  pedido: PedidoComItens;
  onView: (pedido: PedidoComItens) => void;
  onFaturar: (pedido: PedidoComItens) => void;
  onCancelar: (pedido: PedidoComItens) => void;
  onBaixarPDF?: (pedido: PedidoComItens) => void;
}

function PedidoRow({ pedido, onView, onFaturar, onCancelar, onBaixarPDF }: PedidoRowProps) {
  const [expanded, setExpanded] = useState(false);
  const total = pedido.itens.reduce((acc, item) => acc + item.quantidade * item.preco, 0);

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onView(pedido)}>
        <td className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </td>
        <td className="px-4 py-3 font-mono text-sm text-gray-600">{pedido.id.slice(0, 8)}...</td>
        <td className="px-4 py-3 font-medium text-gray-900">{pedido.cliente}</td>
        <td className="px-4 py-3 text-gray-600">{formatDate(pedido.vencimento)}</td>
        <td className="px-4 py-3"><StatusBadge status={pedido.status} /></td>
        <td className="px-4 py-3 text-right font-medium text-gray-900">R$ {total.toFixed(2)}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(pedido); }}>
              <Eye className="w-4 h-4" />
            </Button>
            {pedido.status === 'aberto' && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onFaturar(pedido); }}>
                <Truck className="w-4 h-4" />
              </Button>
            )}
            {pedido.status === 'faturado' && (
              <>
                {onBaixarPDF && (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onBaixarPDF(pedido); }}>
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={(e) => { e.stopPropagation(); onCancelar(pedido); }}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-4 py-3">
            <div className="ml-8 border-l-2 border-gray-200 pl-4 space-y-2">
              <p className="text-xs font-medium text-gray-700">Itens do pedido</p>
              <div className="space-y-1">
                {pedido.itens.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-mono w-20">{item.produto?.codigo || item.produto_id.slice(0, 8)}</span>
                    <span className="flex-1">{item.produto?.nome || 'Produto'}</span>
                    <span className="text-right w-24">Qtd: {item.quantidade}</span>
                    <span className="text-right w-32">R$ {item.preco.toFixed(2)}</span>
                    <span className="text-right font-medium w-32">R$ {(item.quantidade * item.preco).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <p className="text-right font-medium text-gray-900">Total: R$ {total.toFixed(2)}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function PedidosPage() {
  const { empresa } = useEmpresa();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedPedido, setSelectedPedido] = useState<PedidoComItens | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPedido, setEditingPedido] = useState<PedidoComItens | null>(null);

  const { data, isLoading, error } = usePedidos(empresa?.empresa_id || '', search, page, pageSize);

  const faturarMutation = useFaturarPedido();
  const cancelarMutation = useCancelarPedido();

  const pedidos = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleView = (pedido: PedidoComItens) => {
    setSelectedPedido(pedido);
  };

  const handleFaturar = async (pedido: PedidoComItens) => {
    if (!empresa) return;

    try {
      await faturarMutation.mutateAsync({ empresaId: empresa.empresa_id, pedidoId: pedido.id });
      toast.success('Pedido faturado com sucesso');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao faturar pedido');
    }
  };

  const handleCancelar = async (pedido: PedidoComItens) => {
    if (!empresa) return;

    if (!window.confirm('Tem certeza que deseja cancelar este pedido faturado?')) return;

    try {
      await cancelarMutation.mutateAsync({ empresaId: empresa.empresa_id, pedidoId: pedido.id });
      toast.success('Pedido cancelado com sucesso');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar pedido');
    }
  };

  const handleNewPedido = () => {
    setEditingPedido(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPedido(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
  };

  const handleBaixarPDF = async (pedido: PedidoComItens) => {
    try {
      const documento = {
        id: pedido.id,
        cliente: pedido.cliente,
        vencimento: pedido.vencimento,
      };
      const itens = pedido.itens.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco: item.preco,
      }));
      const bytes = await gerarDocumentoPedido(documento, itens);
      const blob = new Blob([bytes as unknown as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedido-${pedido.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Erro ao gerar PDF: ' + (err.message || 'Erro desconhecido'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p>Erro ao carregar pedidos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pedidos de Venda</h3>
          <p className="text-sm text-gray-500">Gerencie os pedidos da sua empresa</p>
        </div>
        <Button onClick={handleNewPedido}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar pedidos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {pedidos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum pedido encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 w-10"></th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Cliente</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Vencimento</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Total</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                      <PedidoRow
                        key={pedido.id}
                        pedido={pedido}
                        onView={handleView}
                        onFaturar={handleFaturar}
                        onCancelar={handleCancelar}
                        onBaixarPDF={handleBaixarPDF}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes do pedido */}
      {selectedPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Pedido #{selectedPedido.id.slice(0, 8)}</h4>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPedido(null)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedPedido.cliente}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vencimento</p>
                  <p className="font-medium">{formatDate(selectedPedido.vencimento)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium"><StatusBadge status={selectedPedido.status} /></p>
                </div>
                <div>
                  <p className="text-gray-500">Criado em</p>
                  <p className="font-medium">{selectedPedido.criado_em ? formatDateTime(selectedPedido.criado_em) : 'Não disponível'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Itens</p>
                <div className="space-y-2">
                  {selectedPedido.itens.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.produto?.nome || 'Produto'}</p>
                        <p className="text-sm text-gray-500">{item.produto?.codigo || item.produto_id.slice(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Qtd: {item.quantidade}</p>
                        <p className="text-sm text-gray-600">R$ {item.preco.toFixed(2)} / un</p>
                        <p className="font-medium">R$ {(item.quantidade * item.preco).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-end">
                  <p className="text-xl font-bold text-gray-900">
                    Total: R$ {selectedPedido.itens.reduce((acc, item) => acc + item.quantidade * item.preco, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulário de pedido */}
      {showForm && (
        <PedidoFormModal
          empresaId={empresa?.empresa_id || ''}
          initialData={editingPedido}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

// Tipo para itens do formulário (sem empresa_id e pedido_id pois são novos)
interface FormItemPedido {
  produto_id: string;
  quantidade: number;
  preco: number;
}

// Componente do modal de formulário de pedido
interface PedidoFormModalProps {
  empresaId: string;
  initialData: PedidoComItens | null;
  onClose: () => void;
  onSuccess: () => void;
}

function PedidoFormModal({ empresaId, initialData, onClose, onSuccess }: PedidoFormModalProps) {
  const [cliente, setCliente] = useState(initialData?.cliente || '');
  const [vencimento, setVencimento] = useState(initialData?.vencimento?.split('T')[0] || '');
  const [itens, setItens] = useState<FormItemPedido[]>(
    initialData?.itens.map(item => ({
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco: item.preco
    })) || [{ produto_id: '', quantidade: 1, preco: 0 }]
  );
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Carregar produtos
  const { data: produtosData } = useProdutos(empresaId);

  useEffect(() => {
    if (produtosData) {
      setProdutos(produtosData);
    }
  }, [produtosData]);

  const { mutateAsync: createPedido } = useCreatePedido();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!cliente.trim()) newErrors.cliente = 'Cliente é obrigatório';
    if (!vencimento) newErrors.vencimento = 'Vencimento é obrigatório';
    if (itens.length === 0) newErrors.itens = 'Adicione pelo menos um item';
    else {
      itens.forEach((item, index) => {
        if (!item.produto_id) newErrors[`item_${index}_produto`] = 'Produto é obrigatório';
        if (item.quantidade <= 0) newErrors[`item_${index}_quantidade`] = 'Quantidade deve ser maior que zero';
        if (item.preco <= 0) newErrors[`item_${index}_preco`] = 'Preço deve ser maior que zero';
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const pedidoData = {
        cliente: cliente.trim(),
        vencimento,
      };

      const itensData = itens.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco: item.preco,
      }));

      await createPedido({ empresaId, pedido: pedidoData, itens: itensData });
      onSuccess();
      toast.success(initialData ? 'Pedido atualizado com sucesso' : 'Pedido criado com sucesso');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    setItens([...itens, { produto_id: '', quantidade: 1, preco: 0 }]);
  };

  const removeItem = (index: number) => {
    if (itens.length <= 1) return;
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FormItemPedido, value: string | number) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Editar Pedido' : 'Novo Pedido'}
          </h4>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${errors.cliente ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Nome do cliente"
              />
              {errors.cliente && <p className="text-sm text-red-500 mt-1">{errors.cliente}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento *</label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                data-testid="vencimento-input"
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${errors.vencimento ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.vencimento && <p className="text-sm text-red-500 mt-1">{errors.vencimento}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-gray-700">Itens do Pedido</h5>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Item
              </Button>
            </div>

            {errors.itens && <p className="text-sm text-red-500 mb-3">{errors.itens}</p>}

            <div className="space-y-3">
              {itens.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Produto *</label>
                    <select
                      value={item.produto_id}
                      onChange={(e) => {
                        const produto = produtos.find(p => p.id === e.target.value);
                        setItens(current => current.map((item, i) => i === index ? { ...item, produto_id: e.target.value, preco: produto?.preco_venda ?? item.preco } : item));
                      }}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${errors[`item_${index}_produto`] ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Selecione um produto</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>{p.codigo} - {p.nome}</option>
                      ))}
                    </select>
                    {errors[`item_${index}_produto`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_produto`]}</p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade *</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${errors[`item_${index}_quantidade`] ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors[`item_${index}_quantidade`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_quantidade`]}</p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Preço Unitário *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.preco}
                      onChange={(e) => updateItem(index, 'preco', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${errors[`item_${index}_preco`] ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors[`item_${index}_preco`] && (
                      <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_preco`]}</p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Subtotal</label>
                    <input
                      type="text"
                      value={`R$ ${(item.quantidade * item.preco).toFixed(2)}`}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md text-sm bg-gray-100 text-right font-medium"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 h-9"
                      onClick={() => removeItem(index)}
                      disabled={itens.length <= 1}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <p className="text-xl font-bold text-gray-900">
                Total: R$ {itens.reduce((acc, item) => acc + item.quantidade * item.preco, 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar Pedido'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}