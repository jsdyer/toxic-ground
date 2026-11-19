export function folded(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}
export function selectRows(records, query, kind, status, owner, special) {
  const terms=folded(query).split(/\s+/).filter(Boolean);
  return records.filter(row => (!kind || row.kind===kind) && (!status || row.status===status)
    && (!owner || row.owner===owner) && special(row) && terms.every(term=>row.search.includes(term)));
}
export function quote(value) { return '"'+String(value??'').replaceAll('"','""')+'"'; }
export function currency(value) { return new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(value); }
export function knownSum(values) {
  return values.some(v=>Number.isFinite(v)) ? values.reduce((t,v)=>t+(Number.isFinite(v)?v:0),0) : null;
}

export function stepStreak(rows){
  const steps=new Map();
  for(const [period,step] of rows){
    const year=Number(String(period).slice(0,4));
    if(!Number.isInteger(year)||year<1900)continue;
    const value=Number(step);
    if(!steps.has(year))steps.set(year,new Set());
    steps.get(year).add(Number.isInteger(value)&&value>=1&&value<=10?value:null);
  }
  if(!steps.size)return 0;
  let year=Math.max(...steps.keys());
  const latest=steps.get(year);
  if(latest.size!==1||latest.has(null))return 0;
  const code=[...latest][0];
  let count=0;
  for(;steps.get(year)?.size===1&&steps.get(year).has(code);year--)count++;
  return count;
}
