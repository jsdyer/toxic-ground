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
