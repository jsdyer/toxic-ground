import {folded,selectRows,quote} from './model.mjs';
import {config, details, columns, qualifies, extraTerms} from './project.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const v=document.createElement(tag);if(text!==undefined)v.textContent=text;if(cls)v.className=cls;return v};
export {el};
function link(label,url){const a=el('a',label);a.href=url;return a}
export {link};
const map=L.map('map',{preferCanvas:true,scrollWheelZoom:false,zoomControl:true,maxZoom:18}).setView([49,-95],3);
const areas=L.layerGroup().addTo(map), marks=L.layerGroup().addTo(map);
const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'});
map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
fetch('./basemap.json').then(r=>r.json()).then(data=>{
 const shape=L.geoJSON(data,{interactive:false,style:f=>({color:'#97ad9b',weight:1,fillColor:f.properties.country==='Canada'?'#dae1cc':'#e7e5d8',fillOpacity:1})});areas.addLayer(shape);shape.bringToBack();
}).catch(()=>{$('mapnote').textContent='The regional outline could not load. Street map and record lists are still available.'});
tiles.on('tileerror',()=>{$('mapnote').textContent='Some street tiles are unavailable. The regional outlines and record points remain available.'});
$('streets').onchange=()=>{if($('streets').checked){tiles.addTo(map);map.removeLayer(areas)}else{map.removeLayer(tiles);areas.addTo(map);areas.eachLayer(s=>s.bringToBack())}};
let records=[], filtered=[],selected=null,start=0,manifest, generation=0;
const perPage=24;
function options(id,list,first){
 const input=$(id);const current=input.value;
 input.replaceChildren(new Option(first,''),...Array.from(new Set(list.filter(Boolean))).sort((a,b)=>a.localeCompare(b)).map(x=>new Option(x,x)));
 if([...input.options].some(x=>x.value===current))input.value=current;
}
function gridMarkers(){
 marks.clearLayers();const bins=new Map(),bounds=map.getBounds().pad(.1), zoom=map.getZoom();
 for(const r of filtered){
  if(!r.geo||!bounds.contains(r.geo))continue;
  const p=map.project(r.geo,zoom),cell=zoom<12?44:20,key=Math.floor(p.x/cell)+','+Math.floor(p.y/cell);
  if(!bins.has(key))bins.set(key,[]);bins.get(key).push(r);
 }
 for(const group of bins.values()){
  const first=group[0],cluster=group.length>1, marker=L.circleMarker(first.geo,{radius:cluster?Math.min(18,8+Math.log2(group.length)*1.7):6,weight:2,color:'#fffdf4',fillColor:cluster?'#28554e':'#ac4c23',fillOpacity:.94}).addTo(marks);
  marker.bindTooltip(el('span',cluster?group.length+' records':first.title));
  marker.on('click',()=>{
   if(cluster&&zoom<17){map.fitBounds(group.map(x=>x.geo),{padding:[40,40],maxZoom:zoom+3});return}
   if(cluster){
    const div=el('div');div.append(el('strong',group.length+' records here'));const box=el('div',undefined,'map-group');div.append(box);
    for(const row of group){const b=el('button',row.title);b.onclick=()=>{map.closePopup();pick(row,false)};box.append(b)}marker.bindPopup(div).openPopup();
   } else pick(first,false);
  });
 }
}
map.on('moveend zoomend',gridMarkers);
function frame(){
 const pts=filtered.filter(x=>x.geo).map(x=>x.geo);
 if(pts.length)map.fitBounds(pts,{padding:[24,24],maxZoom:12});
 else map.setView(config.center,config.zoom);
 gridMarkers();
}
function pick(row,move=true){
 selected=row;$('detail').replaceChildren();
 if(row){const d=$('detail');const h=el('h2',row.title);d.append(el('p',row.kind+' · '+row.status,'eyebrow'),h,el('p',[row.place,row.province].filter(Boolean).join(', '),'subtitle'));details(row,d);
  if(move&&row.geo){map.setView(row.geo,Math.max(12,map.getZoom()));gridMarkers()}
 }else $('detail').append(el('p','No matching record.'));
 drawList();const u=new URL(location.href);if(row)u.searchParams.set('id',row.id);else u.searchParams.delete('id');for(const id of ['query','kind','status','owner','extra']){const key=id==='query'?'q':id,val=$(id).value;if(val)u.searchParams.set(key,val);else u.searchParams.delete(key)}history.replaceState(null,'',u);
}
function drawList(){
 const wrap=$('recordlist');wrap.replaceChildren();
 for(const row of filtered.slice(start,start+perPage)){
  const li=el('li'),btn=el('button');btn.type='button';btn.className=row.id===selected?.id?'active':'';
  btn.setAttribute('aria-pressed',String(row.id===selected?.id));btn.append(el('strong',row.title),el('small',[row.place,row.province].filter(Boolean).join(' · ')));btn.onclick=()=>pick(row);li.append(btn);wrap.append(li)
 }
 $('paging').textContent=filtered.length?(start+1)+'–'+Math.min(start+perPage,filtered.length)+' of '+filtered.length.toLocaleString('en-CA'):'0 results';
 $('prev').disabled=start===0;$('next').disabled=start+perPage>=filtered.length;
}
function render(fit=true,preferred){
 const old=selected?.id;
 filtered=selectRows(records,$('query').value,$('kind').value,$('status').value,$('owner').value,r=>qualifies(r,$('extra').value));
 start=0;
 const choice=preferred?filtered.find(r=>r.id===preferred):filtered.find(r=>r.id===old)||filtered[0];
 if(choice&&preferred){start=Math.floor(filtered.indexOf(choice)/perPage)*perPage;}
 $('count').textContent=filtered.length.toLocaleString('en-CA')+' matching records · '+filtered.filter(x=>x.geo).length.toLocaleString('en-CA')+' mapped';
 pick(choice,false);if(preferred&&!choice)$('detail').replaceChildren(el('h2','Record unavailable'),el('p','This record ID is absent from the selected region or current filters. Clear filters or select a listed record.'));if(fit)frame();
}
async function read(file){const r=await fetch(file);if(!r.ok)throw Error('Record file failed');return r.json()}
async function region(preferred, initial){
 const version=++generation; const g=$('region').value;
 const data=await read('./data/'+g+'.json');if(version!==generation)return;
 records=data.map(r=>({...r,search:folded([r.title,r.province,r.place,r.address,r.id,r.property,r.kind,r.status,r.owner,...extraTerms(r)].join(' '))})).sort((a,b)=>a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
 options('kind',records.map(r=>r.kind),config.allKind);options('owner',records.map(r=>r.owner),config.allOwner);options('status',records.map(r=>r.status),config.allStatus);
 if(initial)for(const k of ['kind','status','owner','extra']){const val=initial.get(k);if([...$(k).options].some(o=>o.value===val))$(k).value=val}
 const u=new URL(location.href);u.searchParams.set('region',g);history.replaceState(null,'',u);render(true,preferred);
}
function fail(){ $('count').textContent='The record file could not load. Reload this page to try again.'; }
$('region').onchange=()=>{for(const id of ['query','kind','owner','status','extra'])$(id).value='';region().catch(fail)};
$('query').oninput=()=>render();
for(const id of ['kind','status','owner','extra'])$(id).onchange=()=>render();
$('clear').onclick=()=>{for(const id of ['query','kind','status','owner','extra'])$(id).value='';render()};
$('prev').onclick=()=>{start=Math.max(0,start-perPage);drawList()};$('next').onclick=()=>{start+=perPage;drawList()};
$('frame').onclick=frame;
$('export').onclick=()=>{
 const fields=columns(), text=[fields.map(f=>quote(f[0])),...filtered.map(r=>fields.map(f=>quote(f[1](r))))].map(row=>row.join(',')).join('\r\n');
 const href=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const a=link('Download',href);a.download=config.slug+'-'+$('region').value+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(href),3000)
};
async function startApp(){
 manifest=await read('./data/status.json');
 const qs=new URLSearchParams(location.search);
 for(const g of manifest.groups)$('region').add(new Option(config.groups[g]||g,g));
 $('region').value=manifest.groups.includes(qs.get('region'))?qs.get('region'):config.defaultGroup;
 $('extra').replaceChildren(...config.extras.map(([v,l])=>new Option(l,v)));
 $('retrieved').textContent='Retrieved '+manifest.retrieved+' · '+manifest.count.toLocaleString('en-CA')+' records in this edition';
 for(const s of manifest.sources)$('sources').append(link(s.name,s.url));
 $('query').value=qs.has('q')?qs.get('q'):(qs.has('id')?'':config.defaultQuery);
 await region(qs.get('id'),qs);
}
startApp().catch(fail);
