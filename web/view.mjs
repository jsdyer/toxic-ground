export function node(tag,text){const v=document.createElement(tag);v.textContent=text;return v}
export function facts(container, pairs){
 const dl=document.createElement('dl');
 for(const [label,value] of pairs){if(value!==null&&value!==undefined&&value!=='')dl.append(node('dt',label),node('dd',String(value)))}
 container.append(dl);
}
export function tabular(container, title, headers, rows){
 if(!rows.length)return;
 container.append(node('h3',title));const wrap=document.createElement('div');wrap.className='scroller';
 const t=document.createElement('table'),head=t.createTHead().insertRow(),body=t.createTBody();
 for(const h of headers)head.append(node('th',h));for(const row of rows){const tr=body.insertRow();for(const cell of row)tr.append(node('td',cell===null||cell===undefined||cell===''?'—':cell))}
 wrap.append(t);container.append(wrap)
}
export function href(container,label,url){const p=document.createElement('p'),a=node('a',label);a.href=url;p.append(a);container.append(p)}
export const primaryColumns=[['Record ID',r=>r.id],['Name',r=>r.title],['Place',r=>r.place],['Province',r=>r.province],['Category',r=>r.kind],['Status',r=>r.status],['Custodian or publisher',r=>r.owner],['Latitude',r=>r.geo?.[0]],['Longitude',r=>r.geo?.[1]]];
