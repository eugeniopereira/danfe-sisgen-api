# Acesso aos dados SISGEN (DANFEs) via Data Proxy: ambiente de homologação

Esta API devolve a tabela de notas fiscais já carregadas no SISGEN (`brutos_danfe_ai.tb_sisgen_fornecedores`), somente leitura.

---

## Credenciais

| Item | Valor |
| :--- | :--- |
| **Base da API** | `https://staging.data-proxy.dados.rio` |
| **Token URL** | `https://id-staging.rio.gov.br/realms/rio/protocol/openid-connect/token` |
| **client_id** | `sme-danfe-sisgen-data-proxy` |
| **client secret** | `<CLIENT_SECRET>` *(enviado em canal separado; guarde em cofre, não no código)* |
| **Tabela** | `/tb_sisgen_fornecedores` |
| **Header obrigatório** | `Accept-Profile: sme_danfe_sisgen` |

---

## 1. Obter o token (OAuth2 client credentials)

```bash
TOKEN=$(curl -s -X POST "https://id-staging.rio.gov.br/realms/rio/protocol/openid-connect/token" \
  -d grant_type=client_credentials \
  -d client_id=sme-danfe-sisgen-data-proxy \
  --data-urlencode client_secret="$CLIENT_SECRET" | jq -r .access_token)
```

> O token vale **300 segundos** (`expires_in`).

---

## 2. Renovar o token

Neste fluxo (*client credentials*) não existe *refresh token*: a resposta traz apenas `access_token` e `expires_in`.

O comportamento correto é pedir um novo token com as mesmas credenciais quando o atual estiver perto de expirar. Reutilize o token enquanto for válido e **não gere um token por requisição**.

```bash
CLIENT_ID=sme-danfe-sisgen-data-proxy
TOKEN_URL=https://id-staging.rio.gov.br/realms/rio/protocol/openid-connect/token

get_token() {
  local now resp
  now=$(date +%s)
  if [ -z "${TOKEN:-}" ] || [ "$now" -ge "${TOKEN_EXP:-0}" ]; then
    resp=$(curl -s -X POST "$TOKEN_URL" \
      -d grant_type=client_credentials \
      -d client_id="$CLIENT_ID" \
      --data-urlencode client_secret="$CLIENT_SECRET")
    TOKEN=$(jq -r .access_token <<<"$resp")
    TOKEN_EXP=$((now + $(jq -r .expires_in <<<"$resp") - 30)) # margem de 30 s
  fi
}

get_token # chame antes de cada consulta; só renova quando preciso
```

Em código de aplicação, a maioria das bibliotecas OAuth2 (por exemplo, `authlib` ou `requests-oauthlib` em Python) faz esse cache e a renovação automaticamente. Se uma consulta responder **401**, solicite um token novo e repita a requisição uma vez.

---

## 3. Consultar

Todas as chamadas exigem os headers `Authorization: Bearer $TOKEN` e `Accept-Profile: sme_danfe_sisgen`.

```bash
H=(-H "Authorization: Bearer $TOKEN" -H "Accept-Profile: sme_danfe_sisgen")
URL=https://staging.data-proxy.dados.rio/tb_sisgen_fornecedores

# Primeiras linhas
curl -s --compressed "${H[@]}" "$URL?limit=5" | jq

# Quais destes DANFEs já entraram no SISGEN, e quando?
curl -s --compressed "${H[@]}" \
  "$URL?numero_danfe=in.(000000001,000000002)&select=numero_danfe,data_entrada_sisgen"

# Entradas a partir de uma data, mais recentes primeiro
curl -s --compressed "${H[@]}" \
  "$URL?data_entrada_sisgen=gte.2026-11-01&order=data_entrada_sisgen.desc&limit=20"

# Paginação
curl -s --compressed "${H[@]}" \
  "$URL?select=numero_danfe&order=numero_danfe&limit=1000&offset=2000"

# Total de linhas (cabeçalho Content-Range)
curl -s -D - -o /dev/null "${H[@]}" -H "Prefer: count=exact" "$URL?limit=1" \
  | grep -i content-range
```

Os filtros utilizam a sintaxe padrão do **PostgREST** (`eq.`, `in.(...)`, `gte.`, `lte.`, `like.`), com parâmetros `select`, `order`, `limit` e `offset`.

---

## Campos

| Campo | Observação |
| :--- | :--- |
| `numero_danfe` | texto, com zeros à esquerda (ex.: `000000001`) |
| `designacao`, `cre`, `cnpj`, `nome_fornecedor` | texto |
| `valor_da_nota` | vem como texto (ex.: `"27.83"`); converta no seu código |
| `data_emissao_nota`, `data_entrada_sisgen` | data (`AAAA-MM-DD`) |

---

## Códigos de Resposta

| Código | Significado |
| :--- | :--- |
| **200/206** | OK (`206` em consultas paginadas ou com contagem) |
| **401** | Token ausente, inválido ou expirado: gere outro |
| **404/406** | Schema ou tabela errados: confira a URL e o header `Accept-Profile` |

---

## Observações Importantes

* **Ambiente de homologação:** A URL e as credenciais de produção serão enviadas à parte.
* **Linhas repetidas:** Hoje, apenas cerca de 749 mil das 1,47 milhão de linhas são distintas, e um mesmo `numero_danfe` pode aparecer várias vezes. Para verificar se *"o DANFE já entrou no SISGEN?"*, trate duplicatas na sua aplicação (ou utilize `limit=1` por DANFE) até que a origem seja normalizada.
* **Frequência de atualização:** [a confirmar].
* **Permissões:** A conta de serviço possui acesso apenas de **leitura**. Não há operações de escrita.