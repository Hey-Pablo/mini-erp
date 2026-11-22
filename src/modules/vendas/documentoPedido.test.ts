import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import { gerarDocumentoPedido } from './documentoPedido';

describe('gerarDocumentoPedido', () => {
  it('gera PDF com total e aviso fiscal', async () => {
    const bytes = await gerarDocumentoPedido(
      { id: 'pedido-1', cliente: 'Cliente ficticio', vencimento: '2026-12-01' },
      [{ produto_id: 'produto-1', quantidade: 2, preco: 12.5 }],
    );
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    const pdf = await PDFDocument.load(bytes);
    const conteudo = Array.from(pdf.context.enumerateIndirectObjects())
      .map(([, obj]) => obj instanceof PDFRawStream ? new TextDecoder().decode(decodePDFRawStream(obj).decode()) : '')
      .join('\n');
    // Texto das fontes padrão é codificado em hexadecimal no fluxo do PDF.
    expect(conteudo).toContain('546F74616C3A2052242032352C3030');
    expect(conteudo).toContain('446F63756D656E746F20696E7465726E6F202D2073656D2076616C6F722066697363616C');
  });
});
