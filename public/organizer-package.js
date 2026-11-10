(()=>{'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ').replace(/ AB$/i,'').toLocaleLowerCase('sv-SE');
const ref=e=>[e.id,e.day,e.start].join('|');
const date=d=>new Date(d+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
let state,events=[],logoKey,imageKey;
async function api(body){const r=await fetch('/api/organizer-content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Något gick fel. Försök igen.');return d;}
async function upload(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('Välj en bild i JPEG, PNG eller WebP.');
 const bmp=await createImageBitmap(file),scale=Math.min(1,1600/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.round(bmp.width*scale);c.height=Math.round(bmp.height*scale);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bmp,0,0,c.width,c.height);bmp.close();
 const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',0.85));const r=await fetch('/api/organizer-media',{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Bilden kunde inte sparas.');return {key:d.key,url:URL.createObjectURL(blob)};
}
const label=e=>date(e.day)+' '+e.start+' · '+e.title;
async function load(){
 const r=await fetch('/api/organizer-content',{cache:'no-store'});
 if(r.status===403){$('pk-status').innerHTML='Logga in som arrangör för att hantera ert paket. <a class="info-link" href="arrangor-start.html">Logga in →</a>';return;}
 state=await r.json();const o=state.organizer;
 $('pk-kicker').textContent=o.name.toLocaleUpperCase('sv-SE')+' · '+o.packageLabel.toLocaleUpperCase('sv-SE');
 for(const el of document.querySelectorAll('.pk-name'))el.textContent=o.name;
 const pub=$('pk-public-link');pub.href='/'+o.slug;pub.textContent=location.host+'/'+o.slug;
 for(const a of document.querySelectorAll('a[href^="arrangor.html?slug="]'))a.href='/'+o.slug;
 const f=$('pk-profile');for(const k of ['description','website','email','phone','address'])f.elements[k].value=state.profile[k]||'';
 showLogo(state.profile.logo);
 renderArticles();renderSp(state.profile.spokespeople||[]);
 $('pk-status').textContent='';$('pk-content').hidden=false;
 const all=await window.AlmedalProgramData.loadAll();
 events=all.filter(e=>{const L=state.links||{},r=[e.id,e.day,e.start].join('|');if((L.include||[]).includes(r))return true;if((L.exclude||[]).includes(r))return false;return [o.name,...(L.aliases||[])].some(x=>String(e.organizer||'').split(/[,;]/).some(n=>normalize(n)===normalize(x)))}).sort((a,b)=>(b.day+b.start).localeCompare(a.day+a.start));
 const years=[...new Set(events.map(e=>e.day.slice(0,4)))];
 $('pk-year').innerHTML=years.map(y=>'<option>'+y+'</option>').join('');
 document.querySelector('.pk-events').innerHTML='<option value="">Välj programpunkt</option>'+events.map(e=>'<option value="'+esc(ref(e))+'">'+esc(label(e))+'</option>').join('');
 renderFeatured();
}
function showLogo(url){const img=$('pk-logo-preview');img.hidden=!url;if(url)img.src=url;$('pk-logo-remove').hidden=!url;}
function renderArticles(){
 const q=state.organizer.quota.articles,list=state.articles;
 $('pk-articles-quota').textContent=list.length+' av '+q+(q===1?' artikel':' artiklar')+' i '+state.organizer.packageLabel+'.';
 $('pk-new-article').hidden=list.length>=q;
 $('pk-article-list').innerHTML=list.length?list.map(a=>'<article class="pk-row">'+(a.image?'<img src="'+esc(a.image)+'" alt="">':'<span class="pk-noimg"></span>')+'<div><span class="pk-badge'+(a.status==='published'?' is-live':'')+'">'+(a.status==='published'?'Publicerad':'Utkast')+'</span><h3>'+esc(a.title)+'</h3><p>'+esc(a.lead)+'</p></div><div class="pk-actions"><button class="week-secondary" data-edit="'+esc(a.id)+'">Redigera</button><button class="week-secondary" data-delete="'+esc(a.id)+'">Ta bort</button></div></article>').join(''):'<div class="week-empty"><h3>Ingen artikel ännu</h3><p>Skriv en artikel och koppla den till en av era programpunkter.</p></div>';
}
function renderFeatured(){
 const set=new Set(state.featured),q=state.organizer.quota.featured,full=set.size>=q,y=$('pk-year').value;
 $('pk-featured-quota').textContent=set.size+' av '+q+' programpunkter lyfta i '+state.organizer.packageLabel+'.';
 const rows=events.filter(e=>set.has(ref(e))||e.day.startsWith(y));
 $('pk-featured-list').innerHTML=rows.length?rows.map(e=>{const on=set.has(ref(e));return '<div class="pk-event'+(on?' sponsored-program-card':'')+'"><div>'+(on?'<span class="sponsored-event">Sponsrad</span>':'')+'<small>'+esc(date(e.day)+' · '+e.start+'–'+e.end+' · '+(e.place||''))+'</small><strong>'+esc(e.title)+'</strong></div><button class="'+(on?'week-secondary':'week-primary')+'" data-feature="'+esc(ref(e))+'" data-on="'+on+'"'+(!on&&full?' disabled title="Paketets kvot är fylld"':'')+'>'+(on?'Sluta lyfta':'Lyft programpunkt')+'</button></div>'}).join(''):'<div class="week-empty"><h3>Inga programpunkter</h3><p>Det finns inga programpunkter för '+esc(state.organizer.name)+' i programunderlaget ännu.</p></div>';
}
function openArticle(a){const f=$('pk-article');f.hidden=false;f.reset();imageKey=undefined;$('pk-article-note').textContent='';$('pk-article-heading').textContent=a?'Redigera artikel':'Ny artikel';
 for(const k of ['id','title','lead','body','event_ref'])f.elements[k].value=a?.[k]||'';const img=$('pk-image-preview');img.hidden=!a?.image;if(a?.image)img.src=a.image;f.scrollIntoView({block:'start',behavior:'smooth'});}
document.addEventListener('click',async e=>{
 const t=e.target.closest('button');if(!t)return;
 try{
  if(t.id==='pk-new-article')openArticle(null);
  else if(t.id==='pk-article-cancel')$('pk-article').hidden=true;
  else if(t.id==='pk-logo-remove'){logoKey='';showLogo('');}
  else if(t.dataset.edit)openArticle(state.articles.find(a=>a.id===t.dataset.edit));
  else if(t.dataset.delete){if(!confirm('Ta bort artikeln?'))return;await api({action:'delete-article',id:t.dataset.delete});state.articles=state.articles.filter(a=>a.id!==t.dataset.delete);renderArticles();}
  else if(t.dataset.feature){t.disabled=true;const on=t.dataset.on==='true';await api({action:on?'unfeature':'feature',event_ref:t.dataset.feature});state.featured=on?state.featured.filter(r=>r!==t.dataset.feature):[...state.featured,t.dataset.feature];$('pk-featured-note').textContent=on?'Programpunkten lyfts inte längre.':'Programpunkten är lyft.';renderFeatured();}
 }catch(err){$('pk-featured-note').textContent=err.message;t.disabled=false;}
});
$('pk-year').addEventListener('change',renderFeatured);
$('pk-logo').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;$('pk-profile-note').textContent='Laddar upp…';try{const u=await upload(file);logoKey=u.key;showLogo(u.url);$('pk-profile-note').textContent='Spara för att publicera logotypen.';}catch(err){$('pk-profile-note').textContent=err.message;}});
$('pk-image').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;$('pk-article-note').textContent='Laddar upp…';try{const u=await upload(file);imageKey=u.key;const img=$('pk-image-preview');img.src=u.url;img.hidden=false;$('pk-article-note').textContent='';}catch(err){$('pk-article-note').textContent=err.message;}});
$('pk-profile').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,body={action:'profile'};for(const k of ['description','website','email','phone','address'])body[k]=f.elements[k].value;if(logoKey!==undefined)body.logoKey=logoKey;try{const d=await api(body);state.profile=d.profile;logoKey=undefined;$('pk-profile-note').textContent='Sparat och publicerat.';}catch(err){$('pk-profile-note').textContent=err.message;}});
$('pk-article').addEventListener('submit',async e=>{e.preventDefault();const f=e.target,body={action:'article',status:e.submitter?.dataset.status||'draft'};for(const k of ['id','title','lead','body','event_ref'])body[k]=f.elements[k].value;if(imageKey!==undefined)body.imageKey=imageKey;
 try{$('pk-article-note').textContent='Sparar…';await api(body);const r=await fetch('/api/organizer-content',{cache:'no-store'});state.articles=(await r.json()).articles;renderArticles();f.hidden=true;}catch(err){$('pk-article-note').textContent=err.message;}});
function spRow(p){return '<fieldset class="week-box pk-sp-row"><div class="profile-grid"><label>Namn<input name="name" maxlength="100" required value="'+esc(p.name)+'"></label><label>Titel<input name="title" maxlength="150" value="'+esc(p.title)+'"></label><label>E-post för bokning<input name="email" type="email" maxlength="200" value="'+esc(p.email)+'"></label><label>LinkedIn-profil<input name="linkedin" type="url" maxlength="200" placeholder="https://www.linkedin.com/in/" value="'+esc(p.linkedin)+'"></label></div><label>Expertis och ämnen<textarea name="expertise" rows="2" maxlength="600">'+esc(p.expertise)+'</textarea></label><label class="pk-check"><input type="checkbox" name="showProgram"'+(p.showProgram?' checked':'')+'> Visa var personen medverkar i programmet</label><button type="button" class="week-secondary" data-sp-remove>Ta bort</button></fieldset>';}
function spQuota(){const q=state.organizer.quota.spokespeople||2,n=document.querySelectorAll('.pk-sp-row').length;$('pk-sp-quota').textContent=n+' av '+q+' talespersoner i '+state.organizer.packageLabel+'.';$('pk-sp-add').disabled=n>=q;}
function renderSp(list){$('pk-sp-list').innerHTML=list.map(spRow).join('');spQuota();}
$('pk-sp-add').addEventListener('click',()=>{$('pk-sp-list').insertAdjacentHTML('beforeend',spRow({}));spQuota();});
$('pk-sp-list').addEventListener('click',e=>{const b=e.target.closest('[data-sp-remove]');if(b){b.closest('.pk-sp-row').remove();spQuota();}});
$('pk-sp').addEventListener('submit',async e=>{e.preventDefault();const list=[...document.querySelectorAll('.pk-sp-row')].map(r=>{const v=k=>r.querySelector('[name='+k+']');return{name:v('name').value,title:v('title').value,email:v('email').value,linkedin:v('linkedin').value,expertise:v('expertise').value,showProgram:v('showProgram').checked}});try{const d=await api({action:'spokespeople',spokespeople:list});state.profile=d.profile;$('pk-sp-note').textContent='Sparat och publicerat.';}catch(err){$('pk-sp-note').textContent=err.message;}});
load().catch(()=>{$('pk-status').textContent='Paketet kunde inte laddas. Ladda om sidan.';});
})();
