(()=>{
 'use strict';
 const roots=[...document.querySelectorAll('[data-newsletter]')];
 if(!roots.length)return;
 function render(root,data){
  root.replaceChildren();
  const heading=document.createElement('h2');heading.textContent='Håll koll på Almedalsveckans program';
  const intro=document.createElement('p');intro.textContent='Prenumerera på mejl om nya programpunkter och ändringar i programmet.';
  const note=document.createElement('p');note.className='newsletter-note';note.textContent='Du kan anmäla ditt intresse nu. Nyhetsbrevet börjar skickas när utskickstjänsten är ansluten.';
  root.append(heading,intro,note);
  if(!data.user){
   const link=document.createElement('a');link.className='newsletter-button';link.href='/signin?return_to='+encodeURIComponent('/schema.html#profile');link.textContent='Logga in för att prenumerera';root.append(link);return;
  }
  const form=document.createElement('form');
  const label=document.createElement('label');label.className='newsletter-choice';
  const box=document.createElement('input');box.type='checkbox';box.name='newsletter';box.checked=data.subscribed;
  const copy=document.createElement('span');copy.textContent='Ja, jag vill få Almedalskompassen programuppdateringar via mejl.';label.append(box,copy);
  const address=document.createElement('p');address.className='newsletter-note';address.textContent='Skickas till '+data.user.email+'. Du kan ändra ditt val under Min profil.';
  const privacy=document.createElement('a');privacy.href='gdpr.html';privacy.textContent='Så hanterar vi dina uppgifter';privacy.className='newsletter-privacy';
  const button=document.createElement('button');button.type='submit';button.className='newsletter-button';button.textContent='Spara mitt val';
  const status=document.createElement('p');status.className='newsletter-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  form.append(label,address,privacy,button,status);root.append(form);
  form.onsubmit=async event=>{
   event.preventDefault();button.disabled=true;status.textContent='Sparar…';
   try{
    const response=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscribed:box.checked})});
    const result=await response.json();if(!response.ok)throw Error(result.error||'Valet kunde inte sparas. Försök igen.');
    box.checked=result.subscribed;status.textContent=result.subscribed?'Ditt val är sparat. Du är anmäld till programuppdateringarna när nyhetsbrevet startar.':'Ditt val är sparat. Du får inga nyhetsbrevsutskick.';
   }catch(error){status.textContent=error.message||'Valet kunde inte sparas. Försök igen.'}finally{button.disabled=false}
  };
 }
 fetch('/api/newsletter',{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error();return response.json()}).then(data=>roots.forEach(root=>render(root,data))).catch(()=>roots.forEach(root=>{root.textContent='Prenumerationsinställningarna kunde inte laddas. Ladda om sidan och försök igen.'}));
})();
