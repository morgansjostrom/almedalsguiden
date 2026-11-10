/* Explicit event fields: original records and filtering keys stay unchanged. */
(()=>{'use strict';
const records=new Map(),originals=new Set();
const fields=['title','description','extendedDescription','detail','category','subject','subject2','eventType','organizationType','accessibility','instructions'];
const ref=e=>e.ref||[e.id,e.day,e.start].join('|');
const source=e=>Object.fromEntries([...fields.map(k=>[k,k==='instructions'?(e.sourceData?.['Instruktion till deltagare']||''):(e[k]||'')]),['speakers',(e.speakers||[]).map(p=>({name:p.name,title:p.title||'',organization:p.organization||''}))]]);
const signature=e=>JSON.stringify(source(e));
function language(){if(window.AlmedalLanguage)return window.AlmedalLanguage.current;try{return localStorage.getItem('almedalskompassen:language')==='en'?'en':'sv'}catch{return 'sv'}}
const locale=()=>language()==='en'?'en-GB':'sv-SE';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function remember(e){const r=ref(e);if(!records.has(r)||e.id)records.set(r,e);return r;}
function original(e){return records.get(ref(e))||e;}
function sourceInfo(e){const a=original(e),info=window.AlmedalSwedishEventTranslations?.[ref(a)];return info?.sourceSignature===signature(a)?info:null;}
function entry(e,lang='en'){const a=original(e),tr=(lang==='sv'?window.AlmedalSwedishEventTranslations:window.AlmedalEventTranslations)?.[ref(a)];return tr?.content&&tr.sourceSignature===signature(a)?tr:null;}
function translated(e){return !originals.has(ref(e))&&!!entry(e,language());}
function value(e,field){const a=original(e),tr=translated(a)?entry(a,language()).content:null;if(field.startsWith('speakerTitle:')){const i=Number(field.split(':')[1]);return tr&&Array.isArray(tr.speakerTitles)&&Object.hasOwn(tr.speakerTitles,i)?tr.speakerTitles[i]||'':a.speakers?.[i]?.title||'';}if(field==='language')return a.language||a.sourceData?.['Språk']||'';return tr&&Object.hasOwn(tr,field)?tr[field]||'':field==='instructions'?a.sourceData?.['Instruktion till deltagare']||'':a[field]||'';}
function fieldLanguage(e,field){if(translated(e)){const tr=entry(e,language()).content,i=field.startsWith('speakerTitle:')?Number(field.split(':')[1]):null;if(i!==null?Array.isArray(tr.speakerTitles)&&Object.hasOwn(tr.speakerTitles,i):Object.hasOwn(tr,field))return language();}return sourceInfo(e)?.sourceLanguages?.[field]||(sourceInfo(e)?'und':'sv');}
function html(e,field,limit=0){remember(e);const text=value(e,field),cut=limit&&text.length>limit?text.slice(0,limit)+'…':text;return '<span class="event-localized-field" data-no-translate data-event-ref="'+esc(ref(e))+'" data-event-field="'+esc(field)+'" data-event-limit="'+limit+'" lang="'+fieldLanguage(e,field)+'">'+esc(cut)+'</span>';}
function label(e){if(translated(e))return language()==='en'?'Machine translated':'Maskinöversatt';if(language()==='sv')return sourceInfo(e)?(entry(e,'sv')?'Original':'Original · svensk översättning saknas'):'';if(sourceInfo(e))return 'Original';return entry(e)?'Swedish original':'Swedish original · English translation pending';}
function toggleText(e){return language()==='sv'?(originals.has(ref(e))?'Visa svensk översättning':'Visa original'):(originals.has(ref(e))?'Show English translation':sourceInfo(e)?'Show original':'Show Swedish original');}
function status(e,toggle=true){remember(e);return '<span class="event-translation-controls" data-no-translate data-event-status="'+esc(ref(e))+'" lang="'+language()+'"><span class="event-translation-label" aria-live="polite"'+(label(e)?'':' hidden')+'>'+esc(label(e))+'</span>'+(toggle?'<button type="button" class="event-original-toggle" data-event-original="'+esc(ref(e))+'"'+(entry(e,language())?'':' hidden')+' aria-pressed="'+originals.has(ref(e))+'">'+esc(toggleText(e))+'</button>':'')+'</span>';}
function dateHTML(day,long=false){return '<span data-no-translate data-event-date="'+esc(day)+'" data-event-date-long="'+long+'" lang="'+language()+'">'+esc(date(day,long))+'</span>';}
function date(day,long=false){return new Date(day+'T12:00:00Z').toLocaleDateString(locale(),{timeZone:'Europe/Stockholm',weekday:long?'long':'short',day:'numeric',month:long?'long':'short',year:'numeric'});}
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
function matches(e,q){const a=original(e),texts=[a,entry(a,'en')?.content,entry(a,'sv')?.content];return normalize([a.place,a.organizer,...texts.flatMap(t=>t?[t.title,t.description,t.extendedDescription,t.subject,t.subject2]:[])].join(' ')).includes(normalize(q));}
let observer,queued=false;
function refresh(){queued=false;if(!document.body)return;observer?.disconnect();for(const el of document.querySelectorAll('[data-event-field]')){const e=records.get(el.dataset.eventRef);if(!e)continue;let text=value(e,el.dataset.eventField),limit=Number(el.dataset.eventLimit)||0;if(limit&&text.length>limit)text=text.slice(0,limit)+'…';if(el.textContent!==text)el.textContent=text;el.lang=fieldLanguage(e,el.dataset.eventField);}for(const el of document.querySelectorAll('[data-event-status]')){const e=records.get(el.dataset.eventStatus);if(!e)continue;el.lang=language();const text=label(e),l=el.querySelector('.event-translation-label'),b=el.querySelector('[data-event-original]');if(l){if(l.textContent!==text)l.textContent=text;l.hidden=!text;}if(b){b.hidden=!entry(e,language());const text=toggleText(e);if(b.textContent!==text)b.textContent=text;b.setAttribute('aria-pressed',String(originals.has(ref(e))));}}for(const el of document.querySelectorAll('[data-event-date]')){const text=date(el.dataset.eventDate,el.dataset.eventDateLong==='true');if(el.textContent!==text)el.textContent=text;el.lang=language();}observer?.observe(document.body,{childList:true,subtree:true});}
function schedule(){if(!queued){queued=true;requestAnimationFrame(refresh);}}
function register(events){events.forEach(remember);schedule();}
function toggle(r,show){show?originals.add(r):originals.delete(r);refresh();}
function start(){observer=new MutationObserver(schedule);refresh();}
window.AlmedalEventI18n={ref,source,signature,register,entry,value,html,status,dateHTML,date,locale,matches,translated,language,refresh};
document.addEventListener('almedal-language-changed',schedule);
document.addEventListener('click',event=>{const b=event.target.closest('[data-event-original]');if(!b)return;event.preventDefault();event.stopImmediatePropagation();const r=b.dataset.eventOriginal,show=!originals.has(r);toggle(r,show);const message={type:'almedal-event-original',ref:r,show};for(const frame of document.querySelectorAll('iframe'))try{frame.contentWindow.postMessage(message,location.origin)}catch{}if(parent!==window)parent.postMessage(message,location.origin);},true);
window.addEventListener('message',event=>{if(event.origin===location.origin&&event.data?.type==='almedal-event-original')toggle(event.data.ref,!!event.data.show);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
