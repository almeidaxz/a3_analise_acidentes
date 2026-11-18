import google.auth
from google.adk.agents import Agent
from google.adk.integrations.bigquery import BigQueryCredentialsConfig, BigQueryToolset
from google.adk.integrations.bigquery.config import BigQueryToolConfig, WriteMode

credentials, _ = google.auth.default(
    scopes=["https://www.googleapis.com/auth/bigquery"]
)

project_id = "blissful-cell-468919-i2"

bq_tools = BigQueryToolset(
    credentials_config=BigQueryCredentialsConfig(credentials=credentials),
    bigquery_tool_config=BigQueryToolConfig(
        location="US",
        write_mode=WriteMode.BLOCKED,
        default_project_id=project_id,
        compute_project_id=project_id,
    ),
)

prompt = """
    Você é um agente analista de dados.
    Seu trabalho é utilizar o MCP `bq_tools` para realizar buscas semânticas na tabela, traduzindo a pergunta do usuário em código SQL.
    Sempre use a tabela:
    `blissful-cell-468919-i2.dados_acidente_prf.acidentes_rodovias`

    Responda em português, apenas com os dados. Não é necessário demonstrar a query utilizada.
    """

root_agent = Agent(
    name="root_agent",
    instruction=prompt,
    model="gemini-3.5-flash-lite",
    tools=[bq_tools]
)