import { PDFDocument, StandardFonts } from 'pdf-lib';

interface PedidoDocumento {
  id: string;
  cliente: string;
  vencimento: string;
}

interface ItemDocumento {
  produto_id: string;
  quantidade: number;
  preco: number;
}

/** Gera um documento interno; não emite nota fiscal. */
export async function gerarDocumentoPedido(pedido: PedidoDocumento, itens: ItemDocumento[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonte = await pdf.embedFont(StandardFonts.Helvetica);
  const moeda = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;
  let pagina = pdf.addPage();
  let y = pagina.getHeight() - 50;

  const novaPagina = () => {
    pagina.drawText('Documento interno - sem valor fiscal', { x: 40, y: 25, size: 10, font: fonte });
    pagina = pdf.addPage();
    y = pagina.getHeight() - 50;
  };
  const linha = (texto: string) => {
    // Quebra por largura para não perder dados longos fora da página.
    let restante = texto;
    while (restante.length > 0) {
      let fim = restante.length;
      while (fim > 1 && fonte.widthOfTextAtSize(restante.slice(0, fim), 11) > pagina.getWidth() - 80) fim--;
      if (y < 50) novaPagina();
      pagina.drawText(restante.slice(0, fim), { x: 40, y, size: 11, font: fonte });
      y -= 18;
      restante = restante.slice(fim);
    }
  };

  linha(`Pedido: ${pedido.id}`);
  linha(`Cliente: ${pedido.cliente}`);
  linha(`Vencimento: ${pedido.vencimento}`);
  linha('Itens:');
  for (const item of itens) {
    linha(`${item.produto_id} | Quantidade: ${item.quantidade} | Preco: ${moeda(item.preco)} | Subtotal: ${moeda(item.quantidade * item.preco)}`);
  }
  linha(`Total: ${moeda(itens.reduce((total, item) => total + item.quantidade * item.preco, 0))}`);
  pagina.drawText('Documento interno - sem valor fiscal', { x: 40, y: 25, size: 10, font: fonte });
  return pdf.save();
}
