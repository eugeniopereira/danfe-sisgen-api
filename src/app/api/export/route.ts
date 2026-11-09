import { NextRequest, NextResponse } from 'next/server';
import { getDanfes } from '@/services/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const numero_danfe = searchParams.get('numero_danfe') || '';
  const nome_fornecedor = searchParams.get('nome_fornecedor') || '';
  const cnpj = searchParams.get('cnpj') || '';

  try {
    // Buscamos até 5000 registros para a exportação de uma vez para não estourar a memória
    // e ser razoável para o arquivo gerado
    const danfes = await getDanfes({
      limit: 5000,
      offset: 0,
      numero_danfe,
      nome_fornecedor,
      cnpj
    });

    if (!danfes || danfes.length === 0) {
      return new NextResponse('Nenhum dado encontrado para exportar com os filtros atuais.', { status: 404 });
    }

    // Usamos as chaves do primeiro registro como cabeçalhos do CSV
    const headers = Object.keys(danfes[0]);
    
    // Construção das linhas do CSV
    const csvRows = [];
    
    // Cabeçalho (usando ponto e vírgula para compatibilidade nativa com Excel no Brasil)
    csvRows.push(headers.join(';')); 

    // Valores
    for (const row of danfes) {
      const values = headers.map(header => {
        const val = (row as any)[header];
        // Tratamento para valores nulos, aspas e quebras de linha
        const stringVal = val !== null && val !== undefined ? String(val) : '';
        const escapedVal = stringVal.replace(/"/g, '""');
        return `"${escapedVal}"`;
      });
      csvRows.push(values.join(';'));
    }

    const csvString = csvRows.join('\n');

    // Adicionamos o BOM (\uFEFF) para o Excel reconhecer a codificação UTF-8 automaticamente
    return new NextResponse('\uFEFF' + csvString, { 
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="danfes_export.csv"',
      },
    });

  } catch (error: any) {
    return new NextResponse(`Erro na exportação: ${error.message}`, { status: 500 });
  }
}