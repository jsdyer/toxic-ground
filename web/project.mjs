import {facts,tabular,href,node,primaryColumns} from './view.mjs';
import {knownSum,currency} from './model.mjs';
export const config={slug:'toxic-ground',groups:{BC:'British Columbia',NS:'Nova Scotia'},defaultGroup:'NS',defaultQuery:'Halifax',center:[47,-82],zoom:4,allKind:'Every classification',allStatus:'Every site status',allOwner:'All custodians',extras:[['','Every site'],['trend','At least ten fiscal years'],['spending','Recorded spending above zero'],['unknown','Without a map position']]};
const stepLabels=['','Identify suspected site','Review site history','Initial testing','Classify site','Detailed testing','Reclassify site','Develop strategy','Implement strategy','Confirmatory sampling and reporting','Long-term monitoring'];
const amount=v=>v==null?'—':currency(v/100);
function total(r){return knownSum(r.years.flatMap(y=>y.slice(2,6)))}
export function qualifies(r,k){return !k||({trend:r.years.length>=10,spending:total(r)>0,unknown:!r.geo})[k]}
export const extraTerms=r=>[...r.media.flat(),...r.strategy];
export function details(r,d){
 facts(d,[['Federal site ID',r.id],['Custodian',r.owner],['Record modified',r.updated],['Reported expenditures across fiscal records',amount(total(r))],['Management strategies',r.strategy.join(' · ')]]);
 if(r.description)d.append(node('p',r.description));
 tabular(d,'Recorded contaminants and media',['Contaminant','Medium'],r.media);
 tabular(d,'Fiscal history',['Fiscal year','Highest completed step','Assessment','Remediation','Care & maintenance','Monitoring','Reporting org.'],r.years.map(y=>[y[0],y[1]?(y[1]+' '+(stepLabels[Number(y[1])]||'')):'—',...y.slice(2,6).map(amount),y[6]]));
 if(r.property)href(d,'Find property '+r.property+' in Federal Property Atlas','https://coolcode.ca/federal-property-atlas/?region='+r.group+'&q='+encodeURIComponent(r.property));
 href(d,'Read the federal ten-step framework','https://www.canada.ca/en/environment-climate-change/services/federal-contaminated-sites/publications/decision-making-framework-version-4-1.html');
}
export const columns=()=>[...primaryColumns,['Property number',r=>r.property],['Fiscal rows',r=>r.years.length],['Reported expenditures CAD',r=>{const v=total(r);return v===null?'':(v/100).toFixed(2)}],['Source record modified',r=>r.updated]];
