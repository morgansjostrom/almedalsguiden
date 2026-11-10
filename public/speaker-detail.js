(async()=>{'use strict';
const $=id=>document.getElementById(id),data=window.AlmedalSpeakerData,programs=window.AlmedalSpeakerPrograms,esc=programs.escape;
const params=new URLSearchParams(location.search),requested=data.normalize(params.get('namn')||'');let person,activeSubject=params.get('subject')||'';
function refreshLinks(){if(person)$('speaker-detail-links').innerHTML=window.AlmedalSpeakerProfiles?.actions(person.name)||''}
function updateURL(){const url=new URL(location.href),year=$('speaker-detail-year').value;if(year)url.searchParams.set('year',year);else url.searchParams.delete('year');if(activeSubject)url.searchParams.set('subject',activeSubject);else url.searchParams.delete('subject');history.replaceState(null,'',url)}
function render(){
 const year=$('speaker-detail-year').value,yearEvents=person.events.filter(e=>!year||e.day.startsWith(year+'-'));
 const topics=data.subjects(yearEvents);
 if(activeSubject&&!topics.includes(activeSubject))activeSubject='';
 const events=yearEvents.filter(e=>!activeSubject||data.subjects([e]).includes(activeSubject)).slice().sort((a,b)=>((b.day+'T'+b.start).localeCompare(a.day+'T'+a.start))||b.title.localeCompare(a.title,'sv'));
 const open=new Set([...$('speaker-detail-programs').querySelectorAll('details[open]')].map(d=>d.dataset.speakerEvent));
 $('speaker-booking-count').textContent=yearEvents.length;
 $('speaker-booking-label').textContent=yearEvents.length===1?'programpunkt':'programpunkter';
 $('speaker-booking-years').textContent=year||'Alla programår';
 $('speaker-program-status').textContent='Visar '+events.length+' av '+yearEvents.length+' programpunkter'+(activeSubject?' · '+activeSubject:'')+'.';
 $('speaker-detail-programs').innerHTML=events.length?programs.list(events,{scope:person.key}):'<p>Inga programpunkter matchar dina val.</p>';
 for(const details of $('speaker-detail-programs').querySelectorAll('details'))if(open.has(details.dataset.speakerEvent))details.open=true;
 const subjectRoot=$('speaker-detail-subjects'),signature=JSON.stringify(topics);
 if(subjectRoot.dataset.topics!==signature){
  subjectRoot.dataset.topics=signature;
  subjectRoot.innerHTML=topics.length?['',...topics].map(subject=>'<button type="button" data-speaker-subject="'+esc(subject)+'" aria-pressed="false" aria-controls="speaker-detail-programs">'+esc(subject||'Alla ämnen')+'</button>').join(''):'<p>Inga ämnen angivna.</p>';
 }
 for(const button of subjectRoot.querySelectorAll('[data-speaker-subject]'))button.setAttribute('aria-pressed',String(button.dataset.speakerSubject===activeSubject));
 updateURL();
}
$('speaker-detail-subjects').addEventListener('click',event=>{const button=event.target.closest('[data-speaker-subject]');if(!button||!person)return;activeSubject=activeSubject===button.dataset.speakerSubject?'':button.dataset.speakerSubject;render()});
document.addEventListener('speakerprofilesready',refreshLinks);
try{
 if(!requested)throw new Error('Ingen talare har valts. Gå tillbaka till talarlistan och välj en person.');
 const response=await window.AlmedalProgramData.fetch();if(!response.ok)throw new Error('Programmet kunde inte laddas. Försök ladda om sidan.');
 const events=await response.json();person=data.buildSpeakers(events).find(p=>p.key===requested);
 if(!person)throw new Error('Talaren finns inte i det aktuella programunderlaget.');
 document.title=person.name+' – Almedalskompassen';
 $('speaker-name').textContent=person.name;
 $('speaker-titles').textContent=person.titles.join(' · ');$('speaker-titles').hidden=!person.titles.length;
 $('speaker-organizations').textContent=person.organization;$('speaker-organizations').hidden=!person.organization;
 $('speaker-detail-year').innerHTML='<option value="">Alla år</option>'+[...new Set(person.events.map(e=>e.day.slice(0,4)))].sort().map(y=>'<option value="'+esc(y)+'">'+esc(y)+'</option>').join('');
 const wanted=params.get('year');if(wanted&&[...$('speaker-detail-year').options].some(o=>o.value===wanted))$('speaker-detail-year').value=wanted;
 $('speaker-detail-year').onchange=render;
 refreshLinks();render();$('speaker-detail-status').hidden=true;$('speaker-detail').hidden=false;
}catch(error){$('speaker-detail-status').textContent=error.message||'Talarprofilen kunde inte laddas. Försök igen.';}
})();
