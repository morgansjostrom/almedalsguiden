(()=>{'use strict';
const clean=s=>String(s||'').normalize('NFC').replace(/\s+/g,' ').trim();
const normalize=s=>clean(s).toLocaleLowerCase('sv');
const eventRef=e=>[e.id,e.day,e.start].join('|');
function organizationKey(value){const compact=normalize(value).replace(/[^\p{L}\p{N}]/gu,'');const aliases={s:'socialdemokraterna',socialdemokraternas:'socialdemokraterna',m:'moderaterna',moderaternam:'moderaterna',kd:'kristdemokraterna',kristdemokraternakd:'kristdemokraterna',v:'vänsterpartiet',vänsterpartietv:'vänsterpartiet',mp:'miljöpartiet',miljöpartietmp:'miljöpartiet',sd:'sverigedemokraterna',sverigedemokraternasd:'sverigedemokraterna',sverigedemorkaternasd:'sverigedemokraterna',c:'centerpartiet',centerpartietc:'centerpartiet',l:'liberalerna',liberalernal:'liberalerna'};return aliases[compact]||compact}
function buildSpeakers(events){const people=new Map();for(const event of events){for(const entry of event.speakers||[]){const name=clean(entry.name);if(!name)continue;const organization=clean(entry.organization),key=normalize(name);let person=people.get(key);if(!person){person={name,organizations:new Map(),titles:new Map(),events:new Map()};people.set(key,person)}if(organization){const orgKey=organizationKey(organization),old=person.organizations.get(orgKey);if(!old||organization.length>old.length)person.organizations.set(orgKey,organization)}const title=clean(entry.title);if(title&&!person.titles.has(normalize(title)))person.titles.set(normalize(title),title);person.events.set(eventRef(event),event)}}return [...people.values()].map(p=>({name:p.name,key:normalize(p.name),organization:[...p.organizations.values()].join(' · '),titles:[...p.titles.values()],events:[...p.events.values()].sort((a,b)=>(a.day+'T'+a.start).localeCompare(b.day+'T'+b.start)||a.title.localeCompare(b.title,'sv'))})).sort((a,b)=>a.name.localeCompare(b.name,'sv'))}

const subjects=events=>[...new Set(events.flatMap(e=>[clean(e.subject),clean(e.subject2)]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'sv'));
const profileURL=name=>'talare.html?namn='+encodeURIComponent(normalize(name));
const surname=name=>clean(name).replace(/\s*\([^)]*\)\s*$/,'').trim().split(' ').at(-1)||clean(name);
function select(people,{query='',year='',subject='',sort='first'}={}){
 const terms=normalize(query).split(' ').filter(Boolean);
 const result=people.map(p=>({...p,events:p.events.filter(e=>!year||e.day.startsWith(year+'-'))})).filter(p=>p.events.length&&(!subject||subjects(p.events).includes(subject))&&terms.every(term=>normalize([p.name,p.organization,...p.titles].join(' ')).includes(term)));
 return result.sort((a,b)=>
  (sort==='popular'?b.events.length-a.events.length:sort==='last'?surname(a.name).localeCompare(surname(b.name),'sv'):0)||a.name.localeCompare(b.name,'sv'));
}
const cancelled=e=>String(e.status||e.sourceData?.Status||'').trim()==='Inställd';
window.AlmedalSpeakerData={cancelled,buildSpeakers,normalize,clean,eventRef,subjects,profileURL,surname,select};
})();
