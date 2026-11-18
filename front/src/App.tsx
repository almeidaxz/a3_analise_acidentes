import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  MapPinned,
  Route,
  Table2,
  Filter,
  RotateCcw,
  Download,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ChatPanel from "./ChatPanel";
import {
  parseCSV,
  Row,
  num,
  nfmt,
  pct,
  distinct,
  fatal,
  letalidade,
  sum,
  rank,
  byMonth,
} from "./data";
import "./styles.css";
const tabs = [
  { name: "Panorama executivo", short: "Panorama", icon: Activity },
  { name: "Causas e tipos", short: "Causas", icon: BarChart3 },
  { name: "Quando acontece", short: "Temporal", icon: CalendarDays },
  { name: "Onde acontece", short: "Geografia", icon: MapPinned },
  { name: "Perfil da via e PRF", short: "Vias e PRF", icon: Route },
  { name: "Detalhamento", short: "Ocorrências", icon: Table2 },
];
const colors = [
  "#55a8ff",
  "#33d3c1",
  "#b48aff",
  "#ffbd69",
  "#ff718c",
  "#83a5c8",
];
const involved = [
  "Pessoas",
  "Mortos",
  "Feridos leves",
  "Feridos graves",
] as const;
type Involved = (typeof involved)[number];
const involvedKey: Record<Involved, string> = {
  Pessoas: "pessoas",
  Mortos: "mortos",
  "Feridos leves": "feridos_leves",
  "Feridos graves": "feridos_graves",
};
function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
function ChartBars({
  data,
  color = colors[0],
  height = 290,
  vertical = false,
}: {
  data: { name: string; value: number }[];
  color?: string;
  height?: number;
  vertical?: boolean;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={vertical ? "vertical" : "horizontal"}
          margin={{
            left: vertical ? 16 : 0,
            right: 10,
            bottom: vertical ? 0 : 30,
          }}
        >
          <CartesianGrid
            stroke="#25374b"
            strokeDasharray="3 5"
            horizontal={!vertical}
            vertical={vertical}
          />
          {vertical ? (
            <>
              <XAxis type="number" tick={{ fill: "#9badc4", fontSize: 11 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={130}
                tick={{ fill: "#bdcde1", fontSize: 10 }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                angle={-25}
                textAnchor="end"
                interval={0}
                height={55}
                tick={{ fill: "#a8b9cf", fontSize: 10 }}
              />
              <YAxis tick={{ fill: "#9badc4", fontSize: 11 }} />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: "#16253a",
              border: "1px solid #34445b",
              color: "#fff",
            }}
            formatter={(v: number) => nfmt(v)}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function Donut({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div style={{ height: 290 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={98}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#16253a",
              border: "1px solid #34445b",
            }}
            formatter={(v: number) => nfmt(v)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
function Trend({ data }: { data: ReturnType<typeof byMonth> }) {
  return (
    <div style={{ height: 310 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ left: 0, right: 18, top: 10, bottom: 0 }}
        >
          <CartesianGrid stroke="#25374b" strokeDasharray="3 5" />
          <XAxis dataKey="name" tick={{ fill: "#a8b9cf", fontSize: 11 }} />
          <YAxis tick={{ fill: "#a8b9cf", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#16253a",
              border: "1px solid #34445b",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="acidentes"
            name="Acidentes"
            stroke="#55a8ff"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="mortos"
            name="Mortos"
            stroke="#ff718c"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
const options = (rows: Row[], key: string) =>
  [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
export default function App() {
  const [rows, setRows] = useState<Row[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [tab, setTab] = useState(0),
    [uf, setUf] = useState(""),
    [month, setMonth] = useState(""),
    [classificacao, setClassificacao] = useState(""),
    [involvement, setInvolvement] = useState<Involved>("Pessoas"),
    [chatOpen, setChatOpen] = useState(true),
    [page, setPage] = useState(0),
    [search, setSearch] = useState("");
  useEffect(() => {
    fetch("/datatran2026.csv")
      .then((r) => {
        if (!r.ok) throw new Error("CSV não encontrado");
        return r.text();
      })
      .then((t) => setRows(parseCSV(t)))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);
  const nonUF = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!month || r.data_inversa?.slice(5, 7) === month) &&
          (!classificacao || r.classificacao_acidente === classificacao),
      ),
    [rows, month, classificacao],
  );
  const filtered = useMemo(
    () => nonUF.filter((r) => !uf || r.uf === uf),
    [nonUF, uf],
  );
  const trend = useMemo(() => byMonth(filtered), [filtered]);
  const filteredDetail = useMemo(
    () =>
      filtered.filter(
        (r) =>
          !search ||
          [
            r.id,
            r.uf,
            r.municipio,
            r.causa_acidente,
            r.tipo_acidente,
            r.br,
          ].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(search.toLowerCase()),
          ),
      ),
    [filtered, search],
  );
  const context = useMemo(
    () =>
      JSON.stringify({
        fonte: "PRF",
        periodo: "2026-01 a 2026-08 (base parcial)",
        filtros: {
          uf: uf || "Todas",
          mes: month || "Todos",
          classificacao: classificacao || "Todas",
        },
        aba: tabs[tab].name,
        metricas: {
          acidentes: distinct(filtered),
          mortos: sum(filtered, "mortos"),
          acidentes_com_mortes: fatal(filtered),
          taxa_letalidade: letalidade(filtered),
        },
      }),
    [uf, month, classificacao, tab, filtered],
  );
  const share = useMemo(() => {
    const denom = distinct(nonUF);
    return denom ? distinct(filtered) / denom : 0;
  }, [filtered, nonUF]);
  const kpis = [
    ["Acidentes", nfmt(distinct(filtered))],
    ["Mortos", nfmt(sum(filtered, "mortos"))],
    ["Feridos graves", nfmt(sum(filtered, "feridos_graves"))],
    ["Veículos", nfmt(sum(filtered, "veiculos"))],
    ["Taxa de letalidade", pct(letalidade(filtered))],
  ];
  function reset() {
    setUf("");
    setMonth("");
    setClassificacao("");
    setSearch("");
    setPage(0);
  }
  function download() {
    const fields = [
      "id",
      "data_inversa",
      "uf",
      "municipio",
      "br",
      "km",
      "causa_acidente",
      "tipo_acidente",
      "mortos",
      "feridos_graves",
    ];
    const text = [
      fields.join(";"),
      ...filtered.map((r) =>
        fields
          .map((f) => '"' + String(r[f] || "").replace(/"/g, '""') + '"')
          .join(";"),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "vida-nas-vias-filtrado.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <Activity size={24} />
          <div>
            <strong>VIDA NAS VIAS</strong>
            <small>INTELIGÊNCIA VIÁRIA · PRF 2026</small>
          </div>
        </div>
        <div className="header-right">
          <span className="data-label">Dados reais · Jan–Ago 2026</span>
          <button
            className="chat-toggle"
            onClick={() => setChatOpen((v) => !v)}
          >
            {chatOpen ? (
              <PanelRightClose size={17} />
            ) : (
              <PanelRightOpen size={17} />
            )}{" "}
            <span>{chatOpen ? "Ocultar IA" : "Mostrar IA"}</span>
          </button>
        </div>
      </header>
      <div className="tabstrip" role="tablist" aria-label="Dashboards">
        {tabs.map((t, i) => {
          const Icon = t.icon;
          return (
            <button
              role="tab"
              aria-selected={tab === i}
              className={"tab " + (tab === i ? "active" : "")}
              key={t.name}
              onClick={() => {
                setTab(i);
                setPage(0);
              }}
            >
              <Icon size={16} />
              {t.short}
            </button>
          );
        })}
      </div>
      <div className="filters">
        <div className="filters-label">
          <Filter size={16} /> Filtros globais
        </div>
        <label>
          UF
          <select
            value={uf}
            onChange={(e) => {
              setUf(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Todas as UFs</option>
            {options(rows, "uf").map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Mês
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Todos os meses</option>
            {Array.from({ length: 12 }, (_, i) => ({
              v: String(i + 1).padStart(2, "0"),
              label: new Date(2026, i, 1).toLocaleString("pt-BR", {
                month: "long",
              }),
            })).map((m) => (
              <option key={m.v} value={m.v}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Classificação
          <select
            value={classificacao}
            onChange={(e) => {
              setClassificacao(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Todas</option>
            {options(rows, "classificacao_acidente").map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button className="reset" onClick={reset}>
          <RotateCcw size={15} /> Limpar
        </button>
        <button className="reset" onClick={download} disabled={!rows.length}>
          <Download size={15} /> CSV
        </button>
      </div>
      <div className={"body " + (!chatOpen ? "chat-hidden" : "")}>
        <main className="dashboard">
          <div className="title-row">
            <div>
              <div className="eyebrow">
                DASHBOARD {String(tab + 1).padStart(2, "0")} / 06
              </div>
              <h1>{tabs[tab].name}</h1>
              <p>
                Análise de acidentes nas rodovias federais · Base parcial de
                2026
              </p>
            </div>
            <div className="count-tag">
              {nfmt(filtered.length)} registros filtrados
            </div>
          </div>
          {loading ? (
            <div className="loading">Carregando base de acidentes...</div>
          ) : error ? (
            <div className="loading">Erro: {error}</div>
          ) : (
            <>
              <div className="kpis">
                {kpis.map(([label, value]) => (
                  <div className="kpi" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              {tab === 0 && (
                <>
                  <div className="chart-grid">
                    <Panel
                      title="Evolução mensal"
                      subtitle="Acidentes e mortes por mês"
                    >
                      <Trend data={trend} />
                    </Panel>
                    <Panel
                      title="Acidentes por UF"
                      subtitle="Ranking de ocorrências"
                    >
                      <ChartBars
                        data={rank(filtered, "uf", "id", 10)}
                        vertical
                      />
                    </Panel>
                  </div>
                  <div className="chart-grid">
                    <Panel
                      title="Participação da UF"
                      subtitle="DISTINCTCOUNT(id) / total sem filtro UF"
                    >
                      <div className="big-metric">{pct(share)}</div>
                      <p className="small-note">
                        Mantém os filtros de mês e classificação; remove apenas
                        UF no denominador.
                      </p>
                    </Panel>
                    <Panel
                      title="Envolvidos — indicador dinâmico"
                      subtitle="Equivalente à medida Qtd Envolvidos Selecionados"
                    >
                      <div className="segmented">
                        {involved.map((v) => (
                          <button
                            className={involvement === v ? "selected" : ""}
                            key={v}
                            onClick={() => setInvolvement(v)}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <div className="big-metric">
                        {nfmt(sum(filtered, involvedKey[involvement]))}
                      </div>
                    </Panel>
                  </div>
                </>
              )}
              {tab === 1 && (
                <>
                  <div className="chart-grid">
                    <Panel title="Principais causas de acidentes">
                      <ChartBars
                        data={rank(filtered, "causa_acidente", "id", 10)}
                        vertical
                        height={360}
                      />
                    </Panel>
                    <Panel title="Tipos de acidente mais frequentes">
                      <ChartBars
                        data={rank(filtered, "tipo_acidente", "id", 10)}
                        vertical
                        height={360}
                      />
                    </Panel>
                  </div>
                  <div className="chart-grid">
                    <Panel title="Classificação do acidente">
                      <Donut data={rank(filtered, "classificacao_acidente")} />
                    </Panel>
                    <Panel title="Mortos por tipo de acidente">
                      <ChartBars
                        data={rank(filtered, "tipo_acidente", "mortos", 10)}
                        vertical
                      />
                    </Panel>
                  </div>
                </>
              )}
              {tab === 2 && (
                <>
                  <div className="chart-grid">
                    <Panel title="Acidentes e mortes por mês">
                      <Trend data={trend} />
                    </Panel>
                    <Panel title="Acidentes por dia da semana">
                      <ChartBars data={rank(filtered, "dia_semana", "id", 7)} />
                    </Panel>
                  </div>
                  <div className="chart-grid">
                    <Panel title="Fase do dia">
                      <Donut data={rank(filtered, "fase_dia")} />
                    </Panel>
                    <Panel title="Condição meteorológica">
                      <ChartBars
                        data={rank(
                          filtered,
                          "condicao_metereologica",
                          "id",
                          10,
                        )}
                        vertical
                      />
                    </Panel>
                  </div>
                  <Panel
                    title="Dia da semana × fase do dia"
                    subtitle="Matriz de ocorrências"
                  >
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Dia</th>
                            {options(filtered, "fase_dia").map((x) => (
                              <th key={x}>{x}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {options(filtered, "dia_semana").map((d) => (
                            <tr key={d}>
                              <th>{d}</th>
                              {options(filtered, "fase_dia").map((f) => (
                                <td key={f}>
                                  {nfmt(
                                    filtered.filter(
                                      (r) =>
                                        r.dia_semana === d && r.fase_dia === f,
                                    ).length,
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                </>
              )}
              {tab === 3 && (
                <>
                  <div className="chart-grid">
                    <Panel title="Estados com mais ocorrências">
                      <ChartBars
                        data={rank(filtered, "uf", "id", 12)}
                        vertical
                        height={360}
                      />
                    </Panel>
                    <Panel title="Rodovias BR com mais ocorrências">
                      <ChartBars
                        data={rank(filtered, "br", "id", 12)}
                        vertical
                        height={360}
                      />
                    </Panel>
                  </div>
                  <div className="chart-grid">
                    <Panel title="Municípios com mais ocorrências">
                      <ChartBars
                        data={rank(filtered, "municipio", "id", 10)}
                        vertical
                      />
                    </Panel>
                    <Panel title="Mortos por UF">
                      <ChartBars
                        data={rank(filtered, "uf", "mortos", 10)}
                        vertical
                        color={colors[4]}
                      />
                    </Panel>
                  </div>
                  <Panel
                    title="Trechos rodoviários"
                    subtitle="BR e quilômetro com mais ocorrências"
                  >
                    <ChartBars
                      data={(() => {
                        const m = new Map<string, number>();
                        filtered.forEach((r) => {
                          const k = `BR ${r.br} · km ${r.km}`;
                          m.set(k, (m.get(k) || 0) + 1);
                        });
                        return [...m]
                          .map(([name, value]) => ({ name, value }))
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 12);
                      })()}
                      vertical
                      height={370}
                    />
                  </Panel>
                  <p className="note">
                    Mapa geográfico por coordenadas será incorporado em uma
                    etapa posterior; os rankings usam dados reais.
                  </p>
                </>
              )}
              {tab === 4 && (
                <>
                  <div className="chart-grid">
                    <Panel title="Tipo de pista">
                      <Donut data={rank(filtered, "tipo_pista")} />
                    </Panel>
                    <Panel title="Uso do solo">
                      <Donut data={rank(filtered, "uso_solo")} />
                    </Panel>
                  </div>
                  <div className="chart-grid">
                    <Panel title="Traçado da via">
                      <ChartBars
                        data={rank(filtered, "tracado_via", "id", 12)}
                        vertical
                      />
                    </Panel>
                    <Panel title="Sentido da via">
                      <ChartBars
                        data={rank(filtered, "sentido_via", "id", 10)}
                      />
                    </Panel>
                  </div>
                  <div className="chart-grid">
                    <Panel title="Ocorrências por regional">
                      <ChartBars
                        data={rank(filtered, "regional", "id", 12)}
                        vertical
                      />
                    </Panel>
                    <Panel title="Ocorrências por delegacia">
                      <ChartBars
                        data={rank(filtered, "delegacia", "id", 12)}
                        vertical
                      />
                    </Panel>
                  </div>
                </>
              )}
              {tab === 5 && (
                <Panel
                  title="Registros de ocorrências"
                  subtitle="Busca, paginação e exportação respeitando os filtros globais"
                >
                  <div className="table-tools">
                    <input
                      placeholder="Buscar ID, município, causa, BR..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                      }}
                    />
                    <span>{nfmt(filteredDetail.length)} resultados</span>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          {[
                            "ID",
                            "Data",
                            "UF",
                            "Município",
                            "BR",
                            "KM",
                            "Causa",
                            "Tipo",
                            "Mortos",
                            "Feridos graves",
                          ].map((x) => (
                            <th key={x}>{x}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDetail
                          .slice(page * 25, page * 25 + 25)
                          .map((r, i) => (
                            <tr key={r.id + "-" + i}>
                              <td>{r.id}</td>
                              <td>{r.data_inversa}</td>
                              <td>{r.uf}</td>
                              <td>{r.municipio}</td>
                              <td>{r.br}</td>
                              <td>{r.km}</td>
                              <td>{r.causa_acidente}</td>
                              <td>{r.tipo_acidente}</td>
                              <td>{num(r.mortos)}</td>
                              <td>{num(r.feridos_graves)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination">
                    <button
                      disabled={!page}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {page + 1} de{" "}
                      {Math.max(1, Math.ceil(filteredDetail.length / 25))}
                    </span>
                    <button
                      disabled={(page + 1) * 25 >= filteredDetail.length}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Próxima
                    </button>
                  </div>
                </Panel>
              )}
            </>
          )}
          <footer>
            Fonte: PRF · Base exportada do modelo semântico do Power BI · 2026
            (período parcial) · Projeto acadêmico
          </footer>
        </main>
        {chatOpen && (
          <div className="chat-side">
            <ChatPanel context={context} />
          </div>
        )}
      </div>
    </div>
  );
}
