# Vida nas Vias

Aplicação de análise de acidentes em rodovias federais brasileiras, com **dashboards interativos** e **agente conversacional** para consultas em linguagem natural. O frontend utiliza React/Vite; o agente utiliza Google ADK, Gemini e Google BigQuery.

## Estrutura do projeto

```text
.
├── analise_dados_big_data/     # Entregáveis da UC de Análise de Dados e Big Data
├── inteligencia_artificial/    # Entregáveis da UC de Inteligência Artificial
├── front/                      # Frontend React
└── server/                     # Servidor Google ADK
    └── agente_acidentes/
        ├── __init__.py
        └── agent.py
```

> **Entregáveis acadêmicos:** os materiais de cada unidade curricular estão separados nas pastas `analise_dados_big_data` e `inteligencia_artificial` e os links dos pitchs estão em arquivos chamados `link_pitch_**.txt` da pasta de cada UC.
> [Link do pitch UC Inteligência Artificial](https://youtu.be/uQj69As2R74)
> [Link do pitch UC Análise de Dados e Big Data](https://youtu.be/3tMrZo64GJY)

## Pré-requisitos

- Node.js e npm para o frontend.
- Python e `pip` (ou `uv`) para o agente.
- Credenciais e permissões válidas para os serviços Google utilizados pelo agente (Gemini e BigQuery), configuradas conforme o backend.

## Executar frontend e servidor simultaneamente

Use **dois terminais abertos ao mesmo tempo**: um para o servidor e outro para o frontend.

### Terminal 1 — Servidor do agente (porta 8000)

No diretório pai de `agente_acidentes`:

```powershell
# Com pip
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1 # mac ou linux: source .venv/bin/activate
pip install -r requirements.txt
adk api_server --host 127.0.0.1 --port 8000 .

# Com UV
cd server
uv venv
.\.venv\Scripts\Activate.ps1 # mac ou linux: source .venv/bin/activate
uv sync
adk api_server --host 127.0.0.1 --port 8000 .
```

Confirme que o agente está disponível em:

- API: http://127.0.0.1:8000/docs
- Agentes disponíveis: http://127.0.0.1:8000/list-apps

A lista deve incluir `agente_acidentes`.

### Terminal 2 — Frontend (porta 5173)

Na pasta da aplicação React:

```powershell
cd front
npm install
Copy-Item .env.example .env
npm run dev
```

No Linux/macOS, use `cp .env.example .env` no lugar de `Copy-Item`.

Confira as variáveis do `.env` (essas não devem ser alteradas):

```dotenv
VITE_ADK_API_URL=/adk
VITE_ADK_APP_NAME=agente_acidentes
```

Abra **http://localhost:5173** no navegador.

O Vite encaminha as requisições a `/adk` para `http://127.0.0.1:8000`, conforme a configuração de proxy em `vite.config.ts`. **Mantenha ambos os terminais em execução** para utilizar os dashboards e o agente conversacional juntos.

## Como encerrar

Pressione `Ctrl+C` em cada terminal para interromper o frontend e o servidor.

## Problemas comuns

| Problema                          | Verificação                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| O chat não responde               | Confira se o ADK está ativo na porta 8000 e se `agente_acidentes` aparece em `/list-apps`.   |
| Erro `404` na API                 | Inicie o ADK a partir da pasta **pai** de `agente_acidentes` e confirme `VITE_ADK_APP_NAME`. |
| Erro de conexão (`ECONNREFUSED`)  | Verifique a porta 8000 e o proxy em `vite.config.ts`.                                        |
| Erro de autenticação ou consulta  | Confira as credenciais, permissões e configurações do Gemini/BigQuery no backend.            |
| Alterações no `.env` não refletem | Reinicie o processo `npm run dev`.                                                           |

## Entregáveis por unidade curricular

- **`analise_dados_big_data/`** — documentação, análises, dashboards e demais materiais da UC com foco na análise de dados.
- **`inteligencia_artificial/`** — documentação, demonstrações e demais materiais da UC com foco no agente conversacional e sua integração.

> [!IMPORTANT]
> **Aviso sobre a disponibilidade da API de Inteligência Artificial**
>
> Durante a utilização do agente conversacional, podem ocorrer erros HTTP **429, 503 ou 504**, geralmente associados a limites de requisições, sobrecarga ou indisponibilidade temporária da API do Gemini.
>
> Esses erros não indicam necessariamente uma falha na nossa aplicação, podendo estar relacionados à capacidade ou às restrições do serviço de IA, principalmente por se tratar do tier gratuito, quando não há garantia de SLA dos modelos.
>
> Caso ocorram, recomenda-se:
>
> - **Tentar novamente após alguns minutos**, quando a API poderá estar menos congestionada.
> - **Alterar o modelo Gemini utilizado** para outra versão disponível e compatível, respeitando os limites de utilização de cada modelo.
>
> A disponibilidade e o desempenho da API dependem da infraestrutura e dos limites estabelecidos pelo provedor do modelo.
> A primeira requisição ao modelo pode apresentar uma latência consideravelmente alta (~5 min). Não encerre o processo caso aconteça. Aguarde o fim da requisição. As requisições subsequentes já terão latência nominal normal.
