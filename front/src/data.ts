export type Row = Record<string, string> & { id: string };
export const num = (v: string | undefined) => Number((v || '0').replace(',','.')) || 0;
export const nfmt = (n:number) => new Intl.NumberFormat('pt-BR').format(n);
export const pct = (n:number) => new Intl.NumberFormat('pt-BR',{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
// CSV da PRF exportado pelo usuário: aspas duplas e campos com delimitadores internos.
export function parseCSV(text:string):Row[] {
  const lines:string[][]=[];let line:string[]=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"') {if(quoted && text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===';'&&!quoted){line.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;line.push(cell);if(line.some(Boolean))lines.push(line);line=[];cell='';}
    else cell+=c;
  }
  if(cell||line.length){line.push(cell);lines.push(line);}
  const [headers,...values]=lines;
  return values.map(cells=>Object.fromEntries(headers.map((h,i)=>[h.replace(/^\uFEFF/,''),cells[i]||''])) as Row);
}
export const distinct = (rows:Row[]) => new Set(rows.map(r=>r.id)).size;
export const fatal = (rows:Row[]) => rows.filter(r=>num(r.mortos)>0).length;
export const letalidade = (rows:Row[]) => rows.length ? fatal(rows)/rows.length : 0;
export const sum = (rows:Row[],field:string) => rows.reduce((s,r)=>s+num(r[field]),0);
export function rank(rows:Row[],key:string,metric='id',limit=12) {
  const map=new Map<string,number>();
  rows.forEach(r=>{const k=r[key]||'Não informado';map.set(k,(map.get(k)||0)+(metric==='id'?1:num(r[metric])));});
  return [...map].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,limit);
}
export function byMonth(rows:Row[]) {
 const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
 return months.map((name,i)=>({name,acidentes:0,mortos:0,feridos:0,mes:i+1})).map(o=>{const subset=rows.filter(r=>Number(r.data_inversa?.slice(5,7))===o.mes);return {...o,acidentes:distinct(subset),mortos:sum(subset,'mortos'),feridos:sum(subset,'feridos_graves')};});
}
