import {useState,useRef,useEffect} from "react";
import {Bot,Plus,Sparkles,ArrowUpRight,Send,ShieldCheck} from "lucide-react";
import {adkConfigured,createSession,askAgent} from "./services/adkApi";
type ChatMessage = {role:"assistant"|"user";text:string};
const prompts=["Quais estados tiveram mais acidentes?","Quais são os horários críticos?","Quais causas aparecem com mais frequência?"];
function ChatPanel({ context }: {context: string}) {
  const welcome: ChatMessage = {role:'assistant',text:'Olá! Sou o assistente de inteligência viária. Posso ajudar a explorar os dados de acidentes da PRF. O que você gostaria de investigar?'};
  const [messages,setMessages] = useState<ChatMessage[]>([welcome]);
  const [input,setInput] = useState('');
  const [sending,setSending] = useState(false);
  const [error,setError] = useState('');
  const [userId] = useState(() => crypto.randomUUID());
  const [sessionId,setSessionId] = useState(() => crypto.randomUUID());
  const sessionInitialized = useRef<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  async function send(question = input) {
    const value = question.trim();
    if (!value || sending) return;
    setMessages(prev=>[...prev,{role:'user',text:value}]);
    setInput(''); setSending(true); setError('');
    try {
      if (sessionInitialized.current !== sessionId) {
        await createSession(userId, sessionId);
        sessionInitialized.current = sessionId;
      }
      // Contexto do dashboard só é enviado como texto quando filtros foram sincronizados.
      const enriched = context ? `${value}\n\n[Contexto de filtros do Power BI (JSON): ${context}]` : value;
      const answer = await askAgent(enriched, userId, sessionId);
      setMessages(prev=>[...prev,{role:'assistant',text:answer}]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Falha desconhecida';
      setError(`Não foi possível consultar o agente: ${detail}. Confira o endpoint, CORS, autenticação e o nome do app.`);
    } finally { setSending(false); }
  }
  function newConversation() {
    if (sending) return;
    setSessionId(crypto.randomUUID());
    sessionInitialized.current = null;
    setMessages([welcome]); setInput(''); setError('');
  }
  return <aside className="chat-panel"><div className="chat-heading"><div className="agent-avatar"><Bot size={22}/><span className="online-dot"/></div><div><h2>Assistente PRF <span className="ai-label">AI</span></h2><p>Seu copiloto de análise de dados</p></div><button className="icon-button chat-more" aria-label="Nova conversa" title="Nova conversa" onClick={newConversation} disabled={sending}><Plus size={20}/></button></div><div className="chat-status"><span className="status-dot"/> {adkConfigured ? 'Endpoint ADK configurado' : 'Endpoint ADK não configurado'} <span className="status-separator">•</span> {adkConfigured ? 'Aguardando teste' : 'Preencha o .env'}</div><div className="chat-scroll"><div className="chat-date">HOJE</div>{messages.map((m,i)=><div key={i} className={`message ${m.role}`}><div className="message-avatar">{m.role==='assistant'?<Sparkles size={15}/>: 'V'}</div><div className="message-bubble">{m.text}</div></div>)}{sending&&<div className="message assistant"><div className="message-avatar"><Sparkles size={15}/></div><div className="message-bubble typing">Consultando os dados<span className="dots">...</span></div></div>}{error&&<div className="chat-error" role="alert">{error}</div>}<div ref={bottom}/>{messages.length===1&&<div className="suggestions"><div className="suggestion-title"><Sparkles size={13}/> EXPLORE OS DADOS</div>{prompts.map(p=><button key={p} disabled={sending || !adkConfigured} onClick={()=>void send(p)}>{p}<ArrowUpRight size={15}/></button>)}</div>}</div><form className="chat-compose" onSubmit={e=>{e.preventDefault();void send();}}><div className="compose-box"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void send();}}} rows={2} placeholder="Pergunte sobre os dados da PRF..." aria-label="Mensagem ao agente"/><div className="compose-actions"><span>Enter para enviar</span><button type="submit" disabled={!input.trim()||sending||!adkConfigured} aria-label="Enviar mensagem"><Send size={17}/></button></div></div><div className="chat-disclaimer"><ShieldCheck size={12}/> Respostas devem ser verificadas com os dados oficiais.</div></form></aside>;
}

export default ChatPanel;
