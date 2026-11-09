// src/services/api.ts

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let tokenExpirationTime = 0;

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`A variável de ambiente ${key} não está definida.`);
  }
  return value;
};

// Configurações extraídas das variáveis de ambiente (Server Side)
const getApiConfig = () => ({
  clientId: getEnvVar('CLIENT_ID'),
  tokenUrl: getEnvVar('TOKEN_URL'),
  apiBaseUrl: getEnvVar('API_BASE_URL'),
  clientSecret: getEnvVar('CLIENT_SECRET')
});

export async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Use cached token if valid (with 30s margin)
  if (cachedToken && now < tokenExpirationTime - 30) {
    return cachedToken;
  }

  const config = getApiConfig();
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', config.clientId);
  params.append('client_secret', config.clientSecret);

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain token: ${response.status} ${errorText}`);
  }

  const data: TokenResponse = await response.json();
  cachedToken = data.access_token;
  tokenExpirationTime = now + data.expires_in;

  return cachedToken;
}

export interface DanfeRow {
  numero_danfe: string;
  designacao: string;
  cre: string;
  cnpj: string;
  nome_fornecedor: string;
  valor_da_nota: string;
  data_emissao_nota: string;
  data_entrada_sisgen: string;
}

export interface GetDanfesParams {
  limit?: number;
  offset?: number;
  numero_danfe?: string;
  nome_fornecedor?: string;
  cnpj?: string;
}

export async function getDanfes(params: GetDanfesParams = {}): Promise<DanfeRow[]> {
  const { limit = 10, offset = 0, numero_danfe, nome_fornecedor, cnpj } = params;
  
  const token = await getToken();

  const queryParams = new URLSearchParams();
  queryParams.append('limit', limit.toString());
  queryParams.append('offset', offset.toString());
  queryParams.append('order', 'data_entrada_sisgen.desc,numero_danfe.asc');

  if (numero_danfe) {
    queryParams.append('numero_danfe', `ilike.*${numero_danfe}*`);
  }
  if (nome_fornecedor) {
    queryParams.append('nome_fornecedor', `ilike.*${nome_fornecedor}*`);
  }
  if (cnpj) {
    queryParams.append('cnpj', `ilike.*${cnpj}*`);
  }

  const config = getApiConfig();
  const url = `${config.apiBaseUrl}/tb_sisgen_fornecedores?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept-Profile': 'sme_danfe_sisgen'
    },
    // We can use next.js fetch cache configuration if needed, 
    // but since we want fresh data, we might want to opt out of aggressive caching
    cache: 'no-store'
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token might have expired just before the request, clear cache and retry once
      cachedToken = null;
      tokenExpirationTime = 0;
      
      const retriedToken = await getToken();
      const retryResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${retriedToken}`,
          'Accept-Profile': 'sme_danfe_sisgen'
        },
        cache: 'no-store'
      });

      if (!retryResponse.ok) {
        throw new Error(`Failed to fetch data after retry: ${retryResponse.status}`);
      }
      return retryResponse.json();
    }
    
    throw new Error(`Failed to fetch data: ${response.status}`);
  }

  return response.json();
}
