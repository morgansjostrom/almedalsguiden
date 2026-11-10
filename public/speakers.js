(()=>{'use strict';
const $=id=>document.getElementById(id),root=$('speaker-directory');if(!root)return;
const data=window.AlmedalSpeakerData,programs=window.AlmedalSpeakerPrograms,esc=programs.escape;
let speakers=[],limit=24,restored=false,view='cards',fullByKey=new Map(),comingYear='';try{view=localStorage.getItem('almedal-speakers-layout')==='list'?'list':'cards'}catch{}
const initials=n=>String(n||'').replace(/[^\p{L}\s-]/gu,'').split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const MAX_ROLES=3,capList=items=>{const shown=items.slice(0,MAX_ROLES);return esc(shown.join(' · '))+(items.length>shown.length?'<span class="speaker-roles-more"> · och ytterligare '+(items.length-shown.length)+'</span>':'')};
const status=$('speaker-directory-status'),bar=document.createElement('div');bar.className='network-resultbar speaker-resultbar';status.parentNode.insertBefore(bar,status);bar.appendChild(status);bar.insertAdjacentHTML('beforeend','<div role="group" aria-label="Visning"><button type="button" class="week-secondary" data-speaker-view="cards" aria-label="Kortvy" title="Kortvy">▦</button><button type="button" class="week-secondary" data-speaker-view="list" aria-label="Listvy" title="Listvy">☰</button></div>');
bar.addEventListener('click',e=>{const b=e.target.closest('[data-speaker-view]');if(!b)return;view=b.dataset.speakerView;try{localStorage.setItem('almedal-speakers-layout',view)}catch{}render()});
const filters=['search','year','subject','sort'];
function read(){return Object.fromEntries(filters.map(k=>[k,$('speaker-directory-'+k).value]));}
function state(){try{sessionStorage.setItem('almedal-speakers-view',JSON.stringify({...read(),limit,scrollY:window.scrollY}))}catch{}}
function render(){
 const options=read(),filtered=data.select(speakers,{...options,query:options.search});
 const order={first:'Förnamn A–Ö',last:'Efternamn A–Ö',popular:'Flest programpunkter'}[options.sort];
 $('speaker-directory-status').textContent=filtered.length?'Visar '+Math.min(limit,filtered.length)+' av '+filtered.length.toLocaleString('sv-SE')+' talare och medverkande · '+order+(options.year?' · '+options.year:'')+'.':'Inga talare matchar din sökning.';
 for(const b of bar.querySelectorAll('[data-speaker-view]'))b.setAttribute('aria-pressed',String(b.dataset.speakerView===view));
 root.classList.toggle('speaker-list-view',view==='list');
 root.innerHTML=filtered.slice(0,limit).map(p=>{const url=esc(data.profileURL(p.name)+(options.year?'&year='+encodeURIComponent(options.year):'')),count=p.events.length+' '+(p.events.length===1?'programpunkt':'programpunkter');
  const head='<div class="speaker-card-heading"><span class="speaker-initials" aria-hidden="true">'+esc(initials(p.name))+'</span><div><h3><a class="speaker-name-link" data-speaker-profile href="'+url+'">'+esc(p.name)+'</a></h3>'+(p.titles.length?'<p class="speaker-role">'+capList(p.titles)+'</p>':'')+(p.organization?'<p class="speaker-organization">'+capList(p.organization.split(' · '))+'</p>':'')+'</div></div>';
  if(view==='list')return '<article class="speaker-card speaker-row">'+head+'<span class="speaker-count">'+count+'</span><a class="speaker-profile-link" data-speaker-profile href="'+url+'">Visa talarprofil →</a></article>';
  const all=(fullByKey.get(p.key)||p).events,upcoming=comingYear?all.filter(e=>e.day.startsWith(comingYear+'-')).length:0,history=all.length-upcoming,unit=n=>n===1?'programpunkt':'programpunkter';
  const counts='<p class="speaker-counts">'+(comingYear?'<span><strong>'+upcoming+'</strong> '+unit(upcoming)+' '+comingYear+'</span>':'')+'<span><strong>'+history+'</strong> '+unit(history)+' historiskt</span></p>';
  return '<article class="speaker-card">'+head+(window.AlmedalSpeakerProfiles?.actions(p.name)||'')+counts+'<a class="speaker-profile-link" data-speaker-profile href="'+url+'">Visa talarprofil →</a></article>'}).join('');
 $('more-speakers').hidden=limit>=filtered.length;
}
function reset(){limit=24;render();state()}
for(const k of filters)$('speaker-directory-'+k).addEventListener(k==='search'?'input':'change',reset);
$('more-speakers').onclick=()=>{limit+=24;render();state()};
root.addEventListener('click',event=>{if(event.target.closest('[data-speaker-profile]'))state()});
document.addEventListener('speakerprofilesready',()=>{if(speakers.length)render()});
window.AlmedalSpeakers={init(events){
 speakers=data.buildSpeakers(events);
 fullByKey=new Map(speakers.map(p=>[p.key,p]));
 const today=new Date().toISOString().slice(0,10),lastDay=new Map();
 for(const e of speakers.flatMap(p=>p.events)){const y=e.day.slice(0,4),old=lastDay.get(y);if(!old||e.day>old)lastDay.set(y,e.day)}
 comingYear=[...lastDay.keys()].filter(y=>lastDay.get(y)>=today).sort()[0]||'';
 $('speaker-directory-year').innerHTML='<option value="">Alla år</option>'+[...new Set(events.map(e=>e.day.slice(0,4)))].sort().map(y=>'<option value="'+esc(y)+'">'+esc(y)+'</option>').join('');
 $('speaker-directory-subject').innerHTML='<option value="">Alla ämnen</option>'+data.subjects(events).map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join('');
 if(!restored){restored=true;try{const previous=JSON.parse(sessionStorage.getItem('almedal-speakers-view')||'null');if(previous){for(const k of filters){const el=$('speaker-directory-'+k);if(k==='search'||[...el.options].some(o=>o.value===previous[k]))el.value=previous[k]||''}if(!$('speaker-directory-sort').value)$('speaker-directory-sort').value='first';limit=Math.max(24,Math.min(Number(previous.limit)||24,speakers.length));}}catch{}}
 const params=new URLSearchParams(location.search);
 if(params.has('speakerSubject')){$('speaker-directory-search').value='';$('speaker-directory-year').value='';}
 for(const [param,field] of [['speakerSubject','subject'],['speakerYear','year']]){const value=params.get(param),el=$('speaker-directory-'+field);if(value!==null&&[...el.options].some(o=>o.value===value)){el.value=value;limit=24}}
 render();
}};
})();
