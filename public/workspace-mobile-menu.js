// Shared mobile navigation. Original static content and desktop chrome stay intact.
(function(){
  const header=document.querySelector('body>header');
  if(!header||document.querySelector('.workspace-menu-button')||window!==window.top)return;
  const tabs=document.querySelector('.week-tabs');
  document.body.classList.add('has-mobile-menu');
  if(tabs)document.body.classList.add('has-workspace-menu');
  const btn=document.createElement('button');btn.type='button';btn.className='workspace-menu-button';
  btn.setAttribute('aria-label','Öppna meny');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','workspace-menu');
  btn.innerHTML='<span class="mobile-menu-lines" aria-hidden="true"></span>';header.appendChild(btn);
  const panel=document.createElement('div');panel.id='workspace-menu';panel.className='workspace-menu';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Mobilmeny');
  panel.innerHTML='<div class="mobile-menu-inner"><div class="mobile-menu-top"><span class="mobile-menu-eyebrow" data-menu-caption="Meny"></span><button type="button" class="mobile-menu-close" aria-label="Stäng"><span aria-hidden="true">×</span></button></div><div class="mobile-menu-content"><h2 class="workspace-menu-title"></h2><div class="workspace-menu-tabs" role="navigation"></div><nav class="mobile-menu-primary" aria-label="Huvudmeny"></nav><section class="mobile-menu-explore"><h3 data-menu-caption="Utforska"></h3><nav aria-label="Utforska"></nav></section></div><div class="mobile-menu-bottom"><div class="workspace-menu-lang" role="group" aria-label="Språk / Language" data-no-translate><button type="button" data-lang="sv" lang="sv">Svenska</button><span aria-hidden="true">/</span><button type="button" data-lang="en" lang="en">English</button></div><div class="workspace-menu-account"></div><a class="mobile-menu-brand" href="/index.html" data-no-translate><img src="/compass.svg" alt="" width="32" height="32"><span>Almedalskompassen</span></a></div></div>';
  document.body.appendChild(panel);
  const list=panel.querySelector('.workspace-menu-tabs');
  if(tabs)tabs.querySelectorAll('[data-week-tab]').forEach(t=>{const b=document.createElement('button');b.type='button';b.dataset.target=t.id;list.appendChild(b)});
  if(tabs)tabs.querySelectorAll('a').forEach(t=>{const a=t.cloneNode(true);a.dataset.menuText=t.textContent.trim();list.appendChild(a)});
  const nav=document.getElementById('nav');
  const links=[...(nav?.querySelectorAll('a')||[])].map(a=>({href:a.getAttribute('href'),text:a.textContent.trim()}));
  for(const extra of [{href:'/annonsera.html',text:'Annonsera'},{href:'/arrangorsverktyg.html',text:'Arrangörsverktyg'},{href:'/arrangor-start.html',text:'Logga in som arrangör'},{href:'/kontakt.html',text:'Kontakt'}]){
    if(!links.some(l=>new URL(l.href,location.href).pathname===new URL(extra.href,location.href).pathname))links.push(extra);
  }
  const translate=value=>window.AlmedalLanguage?.t(value)||value;
  const primary=panel.querySelector('.mobile-menu-primary'),explore=panel.querySelector('.mobile-menu-explore nav');
  links.forEach((l,i)=>{const a=document.createElement('a');a.href=l.href;a.dataset.menuText=l.text;a.textContent=l.text;
    const url=new URL(l.href,location.href);
    const current=url.pathname===location.pathname||['/','/index.html'].includes(url.pathname)&&['/','/index.html'].includes(location.pathname);
    if(!url.hash&&current)a.setAttribute('aria-current','page');
    (i<4?primary:explore).appendChild(a);
    if(tabs&&current&&!url.hash){a.classList.add('has-submenu');a.after(list)}
  });
  const closeButton=panel.querySelector('.mobile-menu-close');
  document.querySelectorAll('.organizer-planning-nav a').forEach(link=>{const a=link.cloneNode(true);explore.prepend(a)});
  let previousFocus=null;
  const close=()=>{if(panel.hidden)return;panel.hidden=true;document.body.classList.remove('mobile-menu-open');btn.setAttribute('aria-expanded','false');document.querySelectorAll('[data-menu-inert]').forEach(el=>{el.inert=false;el.removeAttribute('data-menu-inert')});previousFocus?.focus()};
  function sync(){
    const en=window.AlmedalLanguage?.current==='en';
    panel.querySelector('[data-menu-caption="Meny"]').textContent=en?'Menu':'Meny';
    panel.querySelector('[data-menu-caption="Utforska"]').textContent=en?'Explore':'Utforska';
    panel.querySelector('.workspace-menu-title').textContent='';
    list.querySelectorAll('[data-target]').forEach(b=>{const t=document.getElementById(b.dataset.target);b.textContent=t?.textContent||'';b.setAttribute('aria-current',t?.getAttribute('aria-selected')==='true'?'page':'false')});
    panel.querySelectorAll('[data-menu-text]').forEach(a=>a.textContent=translate(a.dataset.menuText));
    panel.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===(en?'en':'sv'))));
    closeButton.setAttribute('aria-label',en?'Close menu':'Stäng meny');
  }
  let signedIn=false;
  const returnTo=encodeURIComponent(location.pathname+location.search);
  function account(){const acc=panel.querySelector('.workspace-menu-account');acc.replaceChildren();const a=document.createElement('a');a.href=(signedIn?'/signout-with-chatgpt':'/signin')+'?return_to='+returnTo;a.textContent=translate(signedIn?'Logga ut':'Logga in');acc.appendChild(a)}
  async function refreshAccount(){try{const r=await fetch('/api/favorites',{credentials:'same-origin',cache:'no-store'});if(r.ok){signedIn=Boolean((await r.json()).user);account()}}catch{}}
  btn.onclick=()=>{previousFocus=document.activeElement;sync();account();panel.hidden=false;document.body.classList.add('mobile-menu-open');btn.setAttribute('aria-expanded','true');for(const el of document.body.children){if(el!==panel&&!el.inert&&!['SCRIPT','STYLE','LINK'].includes(el.tagName)){el.inert=true;el.setAttribute('data-menu-inert','')}}closeButton.focus();refreshAccount()};
  closeButton.onclick=close;
  list.onclick=e=>{const b=e.target.closest('[data-target]');if(!b)return;document.getElementById(b.dataset.target)?.click();close();window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})};
  panel.querySelector('.workspace-menu-lang').onclick=e=>{const b=e.target.closest('[data-lang]');if(b){document.querySelector('.language-switch [data-ui-language="'+b.dataset.lang+'"]')?.click();sync();account()}};
  panel.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const u=new URL(a.href,location.href);
    const here=u.pathname===location.pathname||['/','/index.html'].includes(u.pathname)&&['/','/index.html'].includes(location.pathname);
    close();
    if(here&&u.hash){const t=document.getElementById(decodeURIComponent(u.hash.slice(1)));if(t){e.preventDefault();history.pushState(null,'',u.hash);jump(t)}}});
  function jump(t){const h=document.querySelector('body>header')?.offsetHeight||0;window.scrollTo({top:t.getBoundingClientRect().top+scrollY-h-12,behavior:'instant'})}
  // Arriving from another page: re-align after late content (program, articles) has rendered.
  if(location.hash){const id=decodeURIComponent(location.hash.slice(1));let n=0;const tick=()=>{const t=document.getElementById(id);if(t)jump(t);if(++n<6)setTimeout(tick,400)};addEventListener('load',()=>setTimeout(tick,100))}
  document.addEventListener('keydown',e=>{if(panel.hidden)return;if(e.key==='Escape')close();if(e.key==='Tab'){const items=[...panel.querySelectorAll('button,a')].filter(el=>el.getClientRects().length);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});
  matchMedia('(max-width:800px)').addEventListener('change',e=>{if(!e.matches)close()});
  document.addEventListener('almedal-language-changed',()=>{sync();account()});
  sync();account();
  const main=document.querySelector('main');
  if(tabs&&nav&&main){const f=document.createElement('nav');f.className='workspace-footer-nav';f.setAttribute('aria-label','Huvudmeny');f.innerHTML=nav.innerHTML;main.after(f)}
})();
