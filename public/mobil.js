(()=>{'use strict';
const $=id=>document.getElementById(id),frame=$('mobile-site');
const pages={home:'./',program:'./#programrubrik',week:'schema.html',people:'schema.html#people',speaker:'talare.html?namn=ellinor%20persson'};
const params=new URLSearchParams(location.search),wired=new WeakSet();
if(Object.hasOwn(pages,params.get('page')))$('preview-page').value=params.get('page');
if(['360','390','430'].includes(params.get('width')))$('preview-width').value=params.get('width');
function size(){const width=Number($('preview-width').value),height=780,totalWidth=width+20,totalHeight=height+20,scale=Math.min(1,Math.max(220,window.innerWidth-28)/totalWidth);frame.style.width=width+'px';frame.style.height=height+'px';$('phone').style.width=totalWidth+'px';$('phone').style.height=totalHeight+'px';$('phone').style.transform='scale('+scale+')';$('viewport-stage').style.width=totalWidth*scale+'px';$('viewport-stage').style.height=totalHeight*scale+'px'}
function saveURL(){const url=new URL(location.href);url.searchParams.set('page',$('preview-page').value);url.searchParams.set('width',$('preview-width').value);history.replaceState(null,'',url)}
function navigate(){const url=new URL(pages[$('preview-page').value],location.href);$('preview-status').textContent='Laddar mobilvyn…';frame.src=url.href;$('open-page').href=url.href;saveURL()}
function wire(doc){if(!doc||wired.has(doc))return;wired.add(doc);
 doc.addEventListener('click',event=>{const link=event.target.closest?.('a[href]');if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const url=new URL(link.href,doc.location.href);if(url.origin!==location.origin||/^\/(?:signin|signout-with-chatgpt|callback)(?:\/|$)/.test(url.pathname))return;if(['_top','_parent'].includes(link.target)){event.preventDefault();event.stopImmediatePropagation();$('preview-status').textContent='Laddar mobilvyn…';frame.src=url.href}},true);
 for(const child of doc.querySelectorAll('iframe')){try{wire(child.contentDocument)}catch{}child.addEventListener('load',()=>{try{wire(child.contentDocument)}catch{}})}
}
frame.addEventListener('load',()=>{try{const doc=frame.contentDocument;wire(doc);$('open-page').href=frame.contentWindow.location.href;$('preview-status').textContent=$('preview-width').value+' px · '+(doc?.title||'Mobilvy')}catch{$('preview-status').textContent='Öppna sidan i egen flik om inloggning behövs.'}});
$('preview-page').addEventListener('change',navigate);$('preview-width').addEventListener('change',()=>{size();saveURL();try{$('preview-status').textContent=$('preview-width').value+' px · '+(frame.contentDocument?.title||'Mobilvy')}catch{}});$('preview-reload').onclick=()=>{try{frame.contentWindow.location.reload()}catch{navigate()}};
window.addEventListener('resize',size);size();navigate();
})();
