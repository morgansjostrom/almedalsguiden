(()=>{'use strict';
const $=id=>document.getElementById(id),list=$('organizer-program-list'),year=$('organizer-program-year'),status=$('organizer-program-status');if(!list||!year)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ').replace(/ AB$/i,'').toLocaleLowerCase('sv-SE');
const belongs=e=>String(e.organizer||'').split(/[,;]/).some(name=>normalize(name)==='almedalskompassen');
let events=[];
const title=e=>window.AlmedalEventI18n?.html(e,'title')||esc(e.title);
const date=day=>new Date(day+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
function render(){
 const rows=events.filter(e=>!year.value||e.day.startsWith(year.value)).sort((a,b)=>(a.day+a.start).localeCompare(b.day+b.start)||a.title.localeCompare(b.title,'sv'));
 const days=[...new Set(rows.map(e=>e.day))];
 status.textContent=rows.length+' programpunkter · '+(year.value||'Alla år')+' · Almedalskompassen';
 $('organizer-program-summary').textContent=events.length+' programpunkter · '+new Set(events.map(e=>e.day.slice(0,4))).size+' år';
 list.innerHTML=rows.length?days.map(day=>'<section class="org-agenda-day"><h3>'+esc(date(day))+'</h3>'+window.AlmedalSpeakerPrograms.list(rows.filter(e=>e.day===day),{scope:'organizer',summarySubjects:true,scheduleStyle:true})+'</section>').join(''):'<div class="week-empty"><h3>Inga programpunkter för '+esc(year.value)+'</h3><p>I det här årets programunderlag finns inga programpunkter där Almedalskompassen är angiven som arrangör eller medarrangör. Välj ett annat år eller visa alla år.</p></div>';
}
year.addEventListener('change',render);
document.addEventListener('almedal-language-changed',()=>{if(events.length)render()});
window.addEventListener('favoriteschanged',()=>{if(events.length)render()});
for(const id of ['organizer-print-program','organizer-pdf-program'])$(id)?.addEventListener('click',()=>{
 document.getElementById('tab-schedule').click();const original=document.title;document.title='Almedalskompassen-Vår-Almedalsvecka-'+(year.value||'alla-år');window.print();document.title=original;
});
Promise.all([window.AlmedalProgramData.metadata(),window.AlmedalProgramData.loadAll()]).then(([meta,rows])=>{
 events=rows.filter(belongs);year.innerHTML='<option value="">Alla år</option>'+meta.years.slice().sort().reverse().map(y=>'<option value="'+esc(y)+'">'+esc(y)+' · '+events.filter(e=>e.day.startsWith(y)).length+' programpunkter</option>').join('');render();
}).catch(()=>{status.textContent='Programpunkterna kunde inte laddas. Ladda om sidan för att försöka igen.';list.replaceChildren();$('organizer-program-summary').textContent='Programmet kunde inte laddas';});
})();

(()=>{const list=document.getElementById('week-recommendations'),bar=document.querySelector('.org-suggest-bar');if(!list||!bar)return;let view='cards';try{view=localStorage.getItem('almedal-org-suggest-view')||'cards'}catch{}const apply=()=>{list.classList.toggle('org-suggestions-list',view==='list');for(const b of bar.querySelectorAll('[data-suggest-view]'))b.setAttribute('aria-pressed',String(b.dataset.suggestView===view))};bar.addEventListener('click',e=>{const b=e.target.closest('[data-suggest-view]');if(!b)return;view=b.dataset.suggestView;try{localStorage.setItem('almedal-org-suggest-view',view)}catch{}apply()});apply()})();
