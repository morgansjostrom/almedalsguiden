/* Organizer package content: published sponsored articles join the existing article
   lists; featured events are marked by program-data.js. Swedish records stay untouched. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data=window.AlmedalSponsored||(window.AlmedalSponsored=fetch('/api/sponsored').then(r=>r.ok?r.json():{articles:[],featured:[]}).catch(()=>({articles:[],featured:[]})));
async function eventFor(ref){const [,day]=ref.split('|');try{const rows=await window.AlmedalProgramData.loadYear(day.slice(0,4));return rows.find(e=>[e.id,e.day,e.start].join('|')===ref)||null}catch{return null}}
async function toArticle(a){const e=await eventFor(a.eventRef);const ev=e?{title:e.title,day:e.day,start:e.start,end:e.end,place:e.place}:{title:'',day:a.eventRef.split('|')[1],start:a.eventRef.split('|')[2],end:'',place:''};
 return {id:a.id,type:'ARRANGÖRSARTIKEL',title:a.title,desc:a.lead,topic:a.subjects[0]||'Annat',subject:a.subjects[0]||'Annat',subjects:a.subjects.length?a.subjects:['Annat'],photo:(a.image||'/visby.jpg').replace(/\.jpg$/,''),body:a.body||a.lead,sender:a.sender,slug:a.slug,eventRef:a.eventRef,event:ev,programs:[{...ev,organizer:a.sender,ref:a.eventRef}]};}
function openRequested(){const id=new URLSearchParams(location.search).get('article');if(!id||!window.AlmedalArticles?.some(a=>a.id===id))return;const b=document.createElement('button');b.dataset.article=id;b.hidden=true;document.body.append(b);b.click();b.remove();}
data.then(async d=>{
 if(!d.articles.length)return;
 const list=await Promise.all(d.articles.map(toArticle));
 const grid=document.querySelector('.allarticles');
 if(Array.isArray(window.AlmedalArticles)){
  for(const a of list){if(window.AlmedalArticles.some(x=>x.id===a.id))continue;window.AlmedalArticles.unshift(a);
   if(grid){const b=document.createElement('button');b.className='article feature';b.dataset.article=a.id;b.innerHTML='<img src="'+esc(a.photo)+'.jpg" alt="" loading="lazy"><div class="articlecopy"><span class="kicker">'+esc(a.type)+' <span class="sample">SPONSRAT INNEHÅLL</span></span><div class="sponsorline">Arrangör: '+esc(a.sender)+'</div><h3>'+esc(a.title)+'</h3><p>'+esc(a.desc)+'</p></div>';grid.prepend(b)}}
  document.dispatchEvent(new CustomEvent('almedal-language-changed'));openRequested();
 }
 const org=document.getElementById('org-articles');const slug=new URLSearchParams(location.search).get('slug');
 if(org&&slug){const mine=list.filter(a=>a.slug===slug);const html=mine.map(a=>'<article class="org-card org-sponsored"><img src="'+esc(a.photo)+'.jpg" alt="" loading="lazy"><p class="org-demo">Sponsrat innehåll</p><h3><a href="index.html?article='+encodeURIComponent(a.id)+'#artikelrubrik">'+esc(a.title)+'</a></h3><p>'+esc(a.desc)+'</p></article>').join('');const put=()=>{if(mine.length&&!org.querySelector('.org-sponsored'))org.insertAdjacentHTML('afterbegin',html)};put();new MutationObserver(put).observe(org,{childList:true});if(false)org.insertAdjacentHTML('afterbegin',mine.map(a=>'<article class="org-card"><img src="'+esc(a.photo)+'.jpg" alt="" loading="lazy"><p class="org-demo">Sponsrat innehåll</p><h3><a href="index.html?article='+encodeURIComponent(a.id)+'#artikelrubrik">'+esc(a.title)+'</a></h3><p>'+esc(a.desc)+'</p></article>').join(''))}
});
})();
