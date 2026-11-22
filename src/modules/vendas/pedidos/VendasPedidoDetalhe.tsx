import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/supabase';
import { useEmpresa } from '../../../shared/hooks';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '../../../shared/ui';
import { ArrowLeft, Truck, FileText, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn, formatCurrency, formatDate, formatDateTime, formatDocumento } from '../../../shared/utils';
import type { Pedido, PedidoItem, Cliente, Produto } from '../../../shared/types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  emitido: 'Emitido',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  rascunho: 'default',
  emitido: 'info',
  faturado: 'success',
  cancelado: 'danger',
};

async function fetchPedido(empresaId: string, pedidoId: string) {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      cliente:clientes(id, nome, documento, tipo_documento, endereco, cidade, uf, cep, email, telefone),
      itens:pedido_itens(*, produto:produtos(id, codigo, nome, unidade, ncm, cfop_padrao, preco_venda))
    `)
    .eq('empresa_id', empresaId)
    .eq('id', pedidoId)
    .single();

  if (error) throw error;
  return data as Pedido & { cliente: Cliente; itens: (PedidoItem & { produto: Produto })[] };
}

async function fetchEmpresa(empresaId: string) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();
  if (error) throw error;
  return data;
}

async function faturarPedido(pedidoId: string) {
  const { data, error } = await supabase.rpc('faturar_pedido', { p_pedido_id: pedidoId });
  if (error) throw error;
  return data;
}

async function generatePDF(pedido: Pedido & { cliente: Cliente; itens: (PedidoItem & { produto: Produto })[] }, empresa: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  // Header
  page.drawText('DOCUMENTO INTERNO DE FATURAMENTO', { x: 50, y, size: 18, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 25;
  page.drawText(`Pedido #${pedido.numero.toString().padStart(6, '0')}`, { x: 50, y, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 20;

  // Empresa emitente
  page.drawText('EMITENTE', { x: 50, y, size: 10, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
  y -= 15;
  page.drawText(empresa.nome, { x: 50, y, size: 11, font: fontBold });
  y -= 14;
  page.drawText(`CNPJ: ${formatDocumento(empresa.cnpj, 'cnpj')}`, { x: 50, y, size: 9, font });
  y -= 12;
  if (empresa.endereco) {
    page.drawText(empresa.endereco, { x: 50, y, size: 9, font });
    y -= 12;
  }

  y -= 10;

  // Cliente
  page.drawText('DESTINATÁRIO', { x: 50, y, size: 10, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
  y -= 15;
  page.drawText(pedido.cliente?.nome || '', { x: 50, y, size: 11, font: fontBold });
  y -= 14;
  if (pedido.cliente) {
    page.drawText(`${pedido.cliente.tipo_documento.toUpperCase()}: ${formatDocumento(pedido.cliente.documento, pedido.cliente.tipo_documento)}`, { x: 50, y, size: 9, font });
    y -= 12;
    if (pedido.cliente.endereco) {
      page.drawText(pedido.cliente.endereco, { x: 50, y, size: 9, font });
      y -= 12;
    }
    if (pedido.cliente.cidade && pedido.cliente.uf) {
      page.drawText(`${pedido.cliente.cidade}/${pedido.cliente.uf} - CEP: ${pedido.cliente.cep || ''}`, { x: 50, y, size: 9, font });
      y -= 12;
    }
  }

  y -= 10;

  // Dados do pedido
  page.drawText(`Data de Emissão: ${formatDate(pedido.data_emissao)}`, { x: 50, y, size: 9, font });
  y -= 12;
  page.drawText(`Data de Faturamento: ${pedido.data_faturamento ? formatDateTime(pedido.data_faturamento) : 'Não faturado'}`, { x: 50, y, size: 9, font });
  y -= 20;

  // Tabela de itens
  const colX = [50, 80, 280, 360, 430, 500];
  const colWidths = [30, 200, 80, 70, 70, 70];

  // Header da tabela
  page.drawRectangle({ x: 50, y: y - 15, width: 500, height: 20, color: rgb(0.9, 0.9, 0.9) });
  const headers = ['Item', 'Descrição', 'Qtd', 'Un.', 'Vl. Unit.', 'Total'];
  headers.forEach((header, i) => {
    page.drawText(header, { x: colX[i] + 2, y: y - 12, size: 8, font: fontBold });
  });
  y -= 20;

  // Itens
  pedido.itens.forEach((item, index) => {
    if (y < 100) {
      // Nova página se necessário
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      y = height - 50;
      page.drawRectangle({ x: 50, y: y - 15, width: 500, height: 20, color: rgb(0.9, 0.9, 0.9) });
      headers.forEach((header, i) => {
        page.drawText(header, { x: colX[i] + 2, y: y - 12, size: 8, font: fontBold });
      });
      y -= 20;
    }

    page.drawText(String(index + 1), { x: colX[0] + 2, y: y - 10, size: 8, font });
    page.drawText(item.produto?.nome || '', { x: colX[1] + 2, y: y - 10, size: 8, font, maxWidth: colWidths[1] - 4 });
    page.drawText(String(item.quantidade), { x: colX[2] + 2, y: y - 10, size: 8, font });
    page.drawText(item.produto?.unidade || '', { x: colX[3] + 2, y: y - 10, size: 8, font });
    page.drawText(formatCurrency(item.preco_unitario), { x: colX[4] + 2, y: y - 10, size: 8, font });
    page.drawText(formatCurrency(item.total), { x: colX[5] + 2, y: y - 10, size: 8, font });
    y -= 18;
  });

  y -= 10;

  // Totais
  const totalsX = 350;
  page.drawText(`Subtotal:`, { x: totalsX, y, size: 9, font });
  page.drawText(formatCurrency(pedido.subtotal), { x: totalsX + 120, y, size: 9, font: fontBold });
  y -= 15;
  page.drawText(`Desconto:`, { x: totalsX, y, size: 9, font });
  page.drawText(`- ${formatCurrency(pedido.desconto)}`, { x: totalsX + 120, y, size: 9, font });
  y -= 15;
  page.drawRectangle({ x: totalsX - 5, y: y - 5, width: 190, height: 20, color: rgb(0.95, 0.95, 0.95) });
  page.drawText(`Total:`, { x: totalsX, y, size: 11, font: fontBold });
  page.drawText(formatCurrency(pedido.total), { x: totalsX + 120, y, size: 11, font: fontBold });

  y -= 40;

  // Observações
  if (pedido.observacoes) {
    page.drawText('Observações:', { x: 50, y, size: 9, font: fontBold });
    y -= 14;
    page.drawText(pedido.observacoes, { x: 50, y, size: 9, font, maxWidth: 500 });
    y -= 20;
  }

  // Rodapé
  page.drawText('Este documento é um documento interno de faturamento e não substitui a Nota Fiscal Eletrônica (NF-e).',
    { x: 50, y: 50, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
  page.drawText(`Emitido em ${formatDateTime(new Date())} pelo Mini ERP`,
    { x: 50, y: 40, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export function VendasPedidoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { empresa, perfil } = useEmpresa();
  const queryClient = useQueryClient();
  const [faturarConfirm, setFaturarConfirm] = useState(false);
  const [faturarError, setFaturarError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const { data: pedido, isLoading, error } = useQuery({
    queryKey: ['pedido', empresa?.id, id],
    queryFn: () => fetchPedido(empresa!.id, id!),
    enabled: !!empresa?.id && !!id,
  });

  const { data: empresaData } = useQuery({
    queryKey: ['empresa-detalhe', empresa?.id],
    queryFn: () => fetchEmpresa(empresa!.id),
    enabled: !!empresa?.id,
  });

  const faturarMutation = useMutation({
    mutationFn: faturarPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido', empresa?.id, id] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      setFaturarConfirm(false);
      setFaturarError(null);
    },
    onError: (error: Error) => {
      setFaturarError(error.message);
    },
  });

  const handleGeneratePDF = async () => {
    if (!pedido || !empresaData) return;
    setPdfGenerating(true);
    try {
      const pdfBytes = await generatePDF(pedido, empresaData);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedido-${pedido.numero.toString().padStart(6, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const canManage = perfil?.papel === 'administrador' || perfil?.papel === 'vendas';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="p-8 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Pedido não encontrado</h2>
        <Button variant="secondary" onClick={() => navigate('/vendas/pedidos')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para pedidos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vendas/pedidos')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedido #{pedido.numero.toString().padStart(6, '0')}</h1>
            <p className="text-gray-500">Detalhes do pedido de venda</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={STATUS_COLORS[pedido.status] || 'default'} className="text-sm">
            {STATUS_LABELS[pedido.status] || pedido.status}
          </Badge>
          {canManage && pedido.status === 'rascunho' && (
            <Button onClick={() => setFaturarConfirm(true)} disabled={faturarMutation.isPending}>
              <Truck className="w-4 h-4 mr-2" />
              Faturar
            </Button>
          )}
          {['emitido', 'faturado'].includes(pedido.status) && (
            <Button onClick={handleGeneratePDF} disabled={pdfGenerating}>
              <FileText className="w-4 h-4 mr-2" />
              {pdfGenerating ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="font-medium">{pedido.cliente?.nome}</p>
            <p className="text-sm text-gray-500">{pedido.cliente ? formatDocumento(pedido.cliente.documento, pedido.cliente.tipo_documento) : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Data de Emissão</p>
            <p className="font-medium">{formatDate(pedido.data_emissao)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Data de Faturamento</p>
            <p className="font-medium">{pedido.data_faturamento ? formatDateTime(pedido.data_faturamento) : 'Não faturado'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total do Pedido</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(pedido.total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cliente Details */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Endereço</p>
              <p>{pedido.cliente?.endereco || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cidade/UF</p>
              <p>{pedido.cliente?.cidade && pedido.cliente?.uf ? `${pedido.cliente.cidade}/${pedido.cliente.uf}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CEP</p>
              <p>{pedido.cliente?.cep || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">E-mail</p>
              <p>{pedido.cliente?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p>{pedido.cliente?.telefone || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead>Un.</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedido.itens.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{item.produto?.codigo}</TableCell>
                    <TableCell>{item.produto?.nome}</TableCell>
                    <TableCell className="text-center">{item.quantidade}</TableCell>
                    <TableCell>{item.produto?.unidade}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.preco_unitario)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.desconto)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(pedido.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Desconto</span>
                <span className="text-red-600">- {formatCurrency(pedido.desconto)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(pedido.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {pedido.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{pedido.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Faturar Confirm Modal */}
      <Modal
        isOpen={faturarConfirm}
        onClose={() => { setFaturarConfirm(false); setFaturarError(null); }}
        title="Confirmar Faturamento"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setFaturarConfirm(false); setFaturarError(null); }}>
              Cancelar
            </Button>
            <Button onClick={() => faturarMutation.mutate(id!)} disabled={faturarMutation.isPending}>
              {faturarMutation.isPending ? 'Faturando...' : 'Confirmar Faturamento'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-600">
            Confirma o faturamento do pedido <strong>#{pedido.numero.toString().padStart(6, '0')}</strong>?
          </p>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">O faturamento irá:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Baixar o estoque dos itens do pedido</li>
                  <li>Gerar títulos a receber baseados no pagamento</li>
                  <li>Marcar o pedido como faturado</li>
                </ul>
                <p className="mt-2">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
          </div>
          {faturarError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md flex items-start gap-2">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{faturarError}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}