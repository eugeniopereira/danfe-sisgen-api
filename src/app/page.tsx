import { getDanfes, DanfeRow } from '@/services/api';

export const instant = false;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const filterDanfe = typeof resolvedSearchParams.numero_danfe === 'string' ? resolvedSearchParams.numero_danfe : '';
  const filterFornecedor = typeof resolvedSearchParams.nome_fornecedor === 'string' ? resolvedSearchParams.nome_fornecedor : '';
  const filterCnpj = typeof resolvedSearchParams.cnpj === 'string' ? resolvedSearchParams.cnpj : '';

  let danfes: DanfeRow[] = [];
  let error = null;

  try {
    danfes = await getDanfes({
      limit,
      offset,
      numero_danfe: filterDanfe,
      nome_fornecedor: filterFornecedor,
      cnpj: filterCnpj
    });
  } catch (err: any) {
    error = err.message;
  }

  // Função para manter os filtros nas URLs de paginação
  const buildPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    if (filterDanfe) params.set('numero_danfe', filterDanfe);
    if (filterFornecedor) params.set('nome_fornecedor', filterFornecedor);
    if (filterCnpj) params.set('cnpj', filterCnpj);
    return `/?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-inter py-8 px-4 sm:px-6 lg:px-8">
      <main className="max-w-7xl mx-auto">
        <div className="bg-opus-primary text-white p-6 rounded-t-lg flex justify-between items-center shadow-md">
          <div>
            <h1 className="text-3xl font-bold font-rubik tracking-tight">DANFEs - SISGEN</h1>
            <p className="text-sm text-blue-200 mt-1 font-medium">
              Ambiente de Homologação
            </p>
          </div>
        </div>

        <form method="GET" action="/" className="bg-white p-6 rounded-b-lg shadow-md mb-8 flex flex-wrap gap-5 items-end border border-gray-100">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="numero_danfe" className="block text-sm font-medium text-gray-700 mb-1">Número DANFE</label>
            <input 
              type="text" 
              name="numero_danfe" 
              id="numero_danfe" 
              defaultValue={filterDanfe}
              placeholder="Ex: 000000001"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="nome_fornecedor" className="block text-sm font-medium text-gray-700 mb-1">Nome do Fornecedor</label>
            <input 
              type="text" 
              name="nome_fornecedor" 
              id="nome_fornecedor" 
              defaultValue={filterFornecedor}
              placeholder="Parte do nome..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input 
              type="text" 
              name="cnpj" 
              id="cnpj" 
              defaultValue={filterCnpj}
              placeholder="Apenas números ou formatado"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="flex gap-3">
            <button 
              type="submit" 
              className="bg-opus-accent text-white px-5 py-2.5 rounded-md hover:bg-opus-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opus-accent font-medium text-sm transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">Filtrar</span>
            </button>
            <a 
              href="/" 
              className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 font-medium text-sm transition-all shadow-sm flex items-center gap-2 border border-slate-200"
            >
              <span className="material-symbols-outlined text-[20px]">Limpar</span>
            </a>
            <a 
              href={`/api/export?numero_danfe=${filterDanfe}&nome_fornecedor=${filterFornecedor}&cnpj=${filterCnpj}`}
              target="_blank"
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 font-medium text-sm transition-all shadow-sm flex items-center gap-2 ml-auto"
              title="Exportar página atual ou resultados do filtro (máx 5000)"
            >
              <span className="material-symbols-outlined text-[20px]">Exportar CSV</span>
            </a>
          </div>
        </form>

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Erro ao carregar os dados: {error}
                </p>
                <p className="text-xs text-red-500 mt-2">
                  Verifique se a variável de ambiente CLIENT_SECRET está configurada corretamente.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-slate-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <a href={page > 1 ? buildPaginationUrl(page - 1) : '#'} className={`relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 ${page <= 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                  Anterior
                </a>
                <a href={buildPaginationUrl(page + 1)} className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                  Próxima
                </a>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Mostrando <span className="font-semibold text-opus-primary">{danfes.length > 0 ? offset + 1 : 0}</span> a <span className="font-semibold text-opus-primary">{offset + danfes.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <a href={page > 1 ? buildPaginationUrl(page - 1) : '#'} className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors ${page <= 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                      <span className="sr-only">Anterior</span>
                      <span className="material-symbols-outlined text-[20px]">&lt;&lt; anterior</span>
                    </a>
                    <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-slate-50 text-sm font-medium text-opus-primary">
                      Página {page}
                    </span>
                    <a href={buildPaginationUrl(page + 1)} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                      <span className="sr-only">Próxima</span>
                      <span className="material-symbols-outlined text-[20px]">próxima &gt;&gt;</span>
                    </a>
                  </nav>
                </div>
              </div>
            </div>

          <div className="bg-white shadow-md overflow-hidden sm:rounded-xl border border-slate-200">
         
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-rubik">Nº DANFE</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-rubik">Fornecedor</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-rubik">CNPJ</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-rubik">Valor</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-rubik">Emissão</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider font-rubik">Entrada SISGEN</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {danfes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                          <p>Nenhum registro encontrado com os filtros atuais.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    danfes.map((danfe, i) => (
                      <tr key={`${danfe.numero_danfe}-${i}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-opus-primary">{danfe.numero_danfe}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          <div className="truncate max-w-[250px]" title={danfe.nome_fornecedor}>
                            {danfe.nome_fornecedor}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono text-xs">{danfe.cnpj}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                          {danfe.valor_da_nota ? `R$ ${parseFloat(danfe.valor_da_nota).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {danfe.data_emissao_nota ? new Date(danfe.data_emissao_nota).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {danfe.data_entrada_sisgen ? new Date(danfe.data_entrada_sisgen).toLocaleDateString('pt-BR') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
