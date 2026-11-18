# Vida nas Vias — React Dark Analytics v2

SPA React/TypeScript com seis abas e indicadores reais derivados do CSV `public/datatran2026.csv`, exportado do Power BI Web. Não requer Power BI Service para executar os dashboards.

## Executar

1. `npm install`
2. Copie `.env.example` para `.env`.
3. Inicie o Google ADK localmente na porta 8000 (`adk api_server`), com o aplicativo `agente_acidentes` disponível. Ajuste as permissões de origem conforme sua versão do ADK, se necessário.
4. `npm run dev` e abra `http://localhost:5173`.

O Vite encaminha `/adk` para `http://127.0.0.1:8000`. Para produção, configure um backend/proxy seguro; o proxy Vite não existe após `npm run build`.

## Indicadores

- `Qtd IDs`: `DISTINCTCOUNT(id)`.
- `Acidentes com Mortes`: `COUNTROWS` com `mortos > 0`.
- `Taxa de Letalidade`: acidentes com mortes / total de registros.
- `Share UF`: `DISTINCTCOUNT(id)` no contexto atual / `DISTINCTCOUNT(id)` removendo apenas o filtro global de UF.
- `Qtd Envolvidos Selecionados`: `SUM(pessoas|mortos|feridos_leves|feridos_graves)`.
- `Nº Mês`: mês extraído de `data_inversa`.

## Limitações e validação

- O CSV é de janeiro a agosto de 2026: não comparar como ano completo.
- Os gráficos são uma primeira reprodução analítica das seis páginas, não uma cópia pixel a pixel de todos os 71 visuais do PBIX.
- A aba Geografia contém rankings reais; mapa por coordenadas ainda não foi implementado.
- A navegação e os filtros globais são interativos. Os filtros e interações específicos do Power BI devem ser validados visual a visual.
- O contexto de filtros enviado ao agente é informativo: o ADK precisa interpretar o contexto e consultar uma fonte compatível para responder com os mesmos recortes.
- O CSV em `public` é baixado pelo navegador: não hospede dados confidenciais nessa pasta.
