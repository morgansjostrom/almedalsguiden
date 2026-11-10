(()=>{'use strict';
const main=document.querySelector('main');if(main){if(!main.id)main.id='main-content';main.tabIndex=-1;const skip=document.createElement('a');skip.className='skip-link';skip.href='#'+main.id;skip.textContent='Hoppa till innehållet';skip.onclick=()=>main.focus();document.body.prepend(skip)}
const menu=document.getElementById('menubutton'),nav=document.getElementById('nav');document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.focus()}});
function labels(){document.querySelectorAll('[data-save-ref]').forEach(b=>{const saved=b.getAttribute('aria-pressed')==='true';const card=b.closest('.save-card,.schedule-event,.spotlight-card,.popupitem,.programexpander,.speaker-program');const title=card?.querySelector('h3,.card strong,.popupitem>strong,summary strong')?.textContent;const original=(saved?'Ta bort från favoriter':'Spara programpunkten')+(title?': '+title:'');const label=window.AlmedalLanguage?.t(original)||original;if(b.getAttribute('aria-label')!==label)b.setAttribute('aria-label',label)});document.querySelectorAll('iframe').forEach(f=>{if(!f.title)f.title='Program och karta'})}
let scheduled=false;new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;labels()})}}).observe(document.body,{childList:true,subtree:true});labels();
})();

// Reveal the mobile bottom menu while scrolling down; hide it on upward scroll.
(()=>{'use strict';
const bar=document.querySelector('body > .mobilebar');if(!bar)return;
const mobile=window.matchMedia('(max-width:750px)');let anchor=0;
function reset(){anchor=Math.max(0,window.scrollY);bar.classList.toggle('scroll-menu',mobile.matches);bar.classList.remove('scroll-menu-visible')}
function update(){if(!mobile.matches)return;const y=Math.max(0,window.scrollY),delta=y-anchor;if(y<=16){bar.classList.remove('scroll-menu-visible');anchor=y;return}if(Math.abs(delta)<8)return;bar.classList.toggle('scroll-menu-visible',delta>0);anchor=y}
window.addEventListener('scroll',update,{passive:true});window.addEventListener('pageshow',reset);mobile.addEventListener('change',reset);reset();
})();
