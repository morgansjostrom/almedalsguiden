(()=>{'use strict';
const articleId=new URLSearchParams(location.search).get('article');if(articleId&&window.AlmedalArticles?.some(a=>a.id===articleId)){const trigger=document.createElement('button');trigger.dataset.article=articleId;trigger.hidden=true;document.body.append(trigger);trigger.click();trigger.remove();}
let match, profiles=[];
const normalize=s=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ').replace(/ AB$/i,'').toLocaleLowerCase('sv-SE');
const profileFor=name=>profiles.find(p=>normalize(p.name)===normalize(name));
let queued=false;
const organizerFields='.organizer-name,.sponsorline,.news-footer small,#dialogsender';
const excluded='script,style,textarea,input,select,header,footer,.hero,.brand,.workspace-menu,[data-organizer-profile],.paid-organizer-link,h1,h2,h3,h4,h5,h6';
function decorate(){queued=false;observer.disconnect();
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>!n.parentElement?.closest(organizerFields)||n.parentElement.closest(excluded)?NodeFilter.FILTER_REJECT:(match.lastIndex=0,match.test(n.textContent))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){const old=node.parentElement.closest('a');if(old&&!old.matches('.organizer-link')&&!profileFor(old.textContent))continue;if(old){if(old.classList.contains('paid-organizer-link'))continue;const span=document.createElement('span');span.append(...old.childNodes);old.replaceWith(span)}
 const button=node.parentElement.closest('button[data-article]');if(button){const card=document.createElement('article');for(const attr of button.attributes)card.setAttribute(attr.name,attr.value);card.append(...button.childNodes);button.replaceWith(card);const h=card.querySelector('h3');if(h){const open=document.createElement('button');open.type='button';open.className='article-title-open';open.append(...h.childNodes);h.append(open)}}
 match.lastIndex=0;const text=node.textContent,frag=document.createDocumentFragment();let at=0;for(const m of text.matchAll(match)){frag.append(text.slice(at,m.index));const link=document.createElement('a');link.className='paid-organizer-link';const profile=profileFor(m[0]);if(!profile)continue;link.href='/'+encodeURIComponent(profile.slug);link.target='_top';link.textContent=m[0];link.title='Visa arrangörens profil';frag.append(link);at=m.index+m[0].length}frag.append(text.slice(at));node.replaceWith(frag);
 }
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}
const observer=new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(decorate)}});
document.addEventListener('click',event=>{const a=event.target.closest('.paid-organizer-link');if(a)event.stopPropagation()},true);
fetch('/api/organizers',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{profiles=(data.profiles||[]).filter(p=>p.active&&p.slug&&p.name);if(!profiles.length)return;const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');match=new RegExp('(?<![\\p{L}\\p{N}])(?:'+profiles.map(p=>escapeRE(p.name.replace(/ AB$/i,''))).sort((a,b)=>b.length-a.length).join('|')+')(?: AB)?(?![\\p{L}\\p{N}])','giu');decorate()}).catch(()=>{});
})();
