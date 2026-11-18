# README — Executando o agente Google ADK localmente

Este guia explica como configurar o ambiente Python, gerar uma chave de API do Gemini pelo Google AI Studio, instalar as dependências e executar o agente `agente_acidentes` localmente.

O agente será executado na porta **8000**, permitindo sua integração com a aplicação React Vida nas Vias, executada na porta **5173**.

## 1. Pré-requisitos

Antes de começar, tenha instalado:

- Python 3.11 ou superior, compatível com a versão do Google ADK utilizada.
- Git (opcional).
- `pip` ou `uv` para gerenciamento das dependências.
- Uma chave de API do Gemini.

Verifique se o Python está instalado:

```bash
python --version
```

Se utilizar `uv`, verifique:

```bash
uv --version
```

Caso não tenha o `uv`, instale com:

```bash
pip install uv
```

## 2. Gerar uma chave de API do Gemini

O agente utiliza os modelos Gemini por meio da API do Google.

Para gerar uma chave:

1. Acesse https://aistudio.google.com/apikey.
2. Faça login com sua conta Google.
3. Clique em **Create API Key** (Criar chave de API).
4. Se solicitado, selecione ou crie um projeto do Google Cloud.
5. Copie a chave gerada e guarde-a em um local seguro.

A disponibilidade dos modelos, os limites gratuitos e eventuais cobranças dependem da configuração da conta e do projeto.

**Importante:** nunca compartilhe sua chave de API nem a inclua em commits do GitHub.

## 3. Configurar a chave de API

Na pasta do agente, onde está o arquivo `agent.py`, crie um arquivo chamado `.env`.

Adicione:

```dotenv
GOOGLE_API_KEY=SUA_CHAVE_GEMINI
GOOGLE_GENAI_USE_VERTEXAI=FALSE
```

Substitua `SUA_CHAVE_GEMINI` pela chave gerada no Google AI Studio.

A variável `GOOGLE_GENAI_USE_VERTEXAI=FALSE` indica que utilizaremos a Gemini Developer API, e não o Vertex AI.

Garanta que o arquivo `.env` esteja incluído no `.gitignore`:

```gitignore
.env
.venv/
__pycache__/
```

## 4. Criar e ativar o ambiente virtual

Abra um terminal na pasta raiz do projeto Python.

### Utilizando venv e pip

Crie o ambiente virtual:

```bash
python -m venv .venv
```

Ative o ambiente no Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

Se estiver utilizando o Prompt de Comando (CMD):

```cmd
.venv\Scripts\activate.bat
```

No Linux ou macOS:

```bash
source .venv/bin/activate
```

Quando o ambiente estiver ativo, normalmente aparecerá `(.venv)` no início da linha do terminal.

Atualize o `pip`:

```bash
python -m pip install --upgrade pip
```

### Utilizando uv

Se o projeto possuir um arquivo `pyproject.toml` e `uv.lock`, execute:

```bash
uv sync
```

Esse comando cria ou atualiza automaticamente o ambiente `.venv` e instala as dependências declaradas.

Se quiser ativar o ambiente manualmente, utilize os mesmos comandos de ativação apresentados acima.

**Observação:** com `uv run`, não é necessário ativar manualmente o ambiente virtual.

## 5. Instalar as dependências

### Opção A — Com pip

Com o ambiente virtual ativado, instale as dependências do projeto:

```bash
pip install -r requirements.txt
```

Caso o projeto não tenha um `requirements.txt`, instale pelo menos o Google ADK:

```bash
pip install google-adk
```

Se o agente importar outras bibliotecas, elas também deverão ser instaladas.

### Opção B — Com uv

Se o projeto utilizar `pyproject.toml`:

```bash
uv sync
```

Se não houver um arquivo de dependências, você pode instalar o ADK diretamente:

```bash
uv pip install google-adk
```

Nesse último caso, crie e ative o ambiente virtual antes da instalação, caso ainda não exista.

## 6. Estrutura esperada do projeto

O Google ADK identifica o agente pelo nome da pasta.

A estrutura básica esperada é:

```text
projeto/
│
├── agente_acidentes/
│   ├── __init__.py
│   ├── agent.py
│   └── .env
│
├── requirements.txt
└── .venv/
```

O arquivo `agent.py` deve expor um agente chamado `root_agent`, conforme a convenção do Google ADK.

**Atenção:** o servidor ADK deve ser iniciado na pasta pai de `agente_acidentes`, e não dentro da pasta do agente.

## 7. Executar o agente na porta 8000

Abra o terminal na pasta `projeto/`, que contém o diretório `agente_acidentes/`.

### Com pip e venv

Certifique-se de que o ambiente virtual esteja ativo e execute:

```bash
adk api_server --host 127.0.0.1 --port 8000 .
```

### Com uv

```bash
uv run adk api_server --host 127.0.0.1 --port 8000 .
```

O servidor ficará disponível em:

```text
http://127.0.0.1:8000
```

Para visualizar a documentação interativa da API, abra:

http://127.0.0.1:8000/docs

A execução deve permanecer ativa no terminal enquanto a aplicação React estiver utilizando o agente.

## 8. Executar a aplicação React

Abra um segundo terminal na pasta do projeto React Vida nas Vias.

Instale as dependências:

```bash
npm install
```

No arquivo `.env` da aplicação React, configure:

```dotenv
VITE_ADK_API_URL=/adk
VITE_ADK_APP_NAME=agente_acidentes
```

Inicie a aplicação:

```bash
npm run dev
```

Acesse:

http://localhost:5173

A aplicação utiliza um proxy do Vite para encaminhar as chamadas `/adk` ao servidor ADK local na porta `8000`.

O proxy precisa estar configurado no arquivo `vite.config.ts`.

## 9. Verificar se tudo está funcionando

Com os dois serviços executando:

| Serviço             | Endereço                   |
| ------------------- | -------------------------- |
| Google ADK          | http://127.0.0.1:8000      |
| Documentação da API | http://127.0.0.1:8000/docs |
| React Vida nas Vias | http://localhost:5173      |

Abra a aplicação React, acesse o chatbot e envie uma pergunta sobre os acidentes rodoviários.

Se o agente responder, a integração está funcionando.

## 10. Problemas comuns

**Erro: `ModuleNotFoundError`**

Uma dependência Python não foi instalada ou o ambiente virtual correto não está ativo.

Execute:

```bash
pip install -r requirements.txt
```

Ou, com `uv`:

```bash
uv sync
```

**Erro: `GOOGLE_API_KEY` não encontrada**

Verifique se o arquivo `.env` está dentro da pasta `agente_acidentes` e se a chave foi preenchida corretamente.

**Erro: `ECONNREFUSED`**

O servidor ADK provavelmente não está executando na porta `8000`. Confirme que ele foi iniciado e permanece ativo.

**Erro: `403 Forbidden: origin not allowed`**

Pode existir uma restrição de origem no servidor ADK.

Verifique as opções disponíveis na versão instalada:

```bash
adk api_server --help
```

Se houver suporte à opção `--allow_origins`, execute:

```bash
adk api_server --host 127.0.0.1 --port 8000 --allow_origins http://localhost:5173 .
```

Essa configuração deve ser restrita às origens necessárias.

**Erro: `404 Not Found`**

Confirme que o nome da pasta do agente é `agente_acidentes` e que a variável `VITE_ADK_APP_NAME` utiliza exatamente esse nome.

## 11. Encerrar os serviços

Para interromper o servidor ADK ou a aplicação React, pressione:

```text
Ctrl + C
```

Para desativar o ambiente virtual Python:

```bash
deactivate
```

---

**Resumo:** execute o agente Google ADK na porta `8000` e o React na porta `5173`. Mantenha os dois terminais ativos durante o desenvolvimento e nunca exponha a chave de API do Gemini no código frontend.
