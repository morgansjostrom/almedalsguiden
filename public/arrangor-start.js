// Organizer landing page: invoice-paid organizers sign in with the password sent with the invoice.
(()=>{'use strict';
const status=document.getElementById('organizer-start-status');
const loginTitle=document.getElementById('arrangor-start-login-title');
const loginText=document.getElementById('arrangor-start-login-text');
const loginLink=document.getElementById('arrangor-start-login');
const buyText=document.getElementById('arrangor-start-buy-text');
const buyLink=document.getElementById('arrangor-start-buy');
if(!status||!loginLink)return;
const controller=new AbortController();
const timeout=setTimeout(()=>controller.abort(),8000);
fetch('/api/organizer-status',{cache:'no-store',credentials:'same-origin',signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{
  if(!data.user)return;
  if(data.mustChangePassword){location.replace('/arrangor-nytt-losenord');return}
  status.hidden=false;
  const email=data.user.email||'din e-postadress';
  loginTitle.textContent='Inloggad';
  loginText.textContent='Du är inloggad som '+email+'. Logga ut om ni vill använda ett annat konto.';
  loginLink.href='/signout-with-chatgpt?return_to=%2Farrangor-start.html';
  loginLink.textContent='Logga ut →';
  if(data.organizer){
    status.innerHTML='';status.append('Arrangörsåtkomsten är aktiv'+(data.expiresAt?' till och med '+new Date(data.expiresAt).toLocaleDateString('sv-SE'):'')+'. ');
    const a=document.createElement('a');a.href='/arrangor-login.html';a.textContent='Öppna er Almedalsvecka →';status.append(a);
    if(buyText)buyText.textContent='Ert arrangörspaket är aktivt. Ni hittar ert program, era förslag och era verktyg i arbetsytan.';
    if(buyLink){buyLink.href='/arrangor-login.html';buyLink.textContent='Till arrangörsverktyget →'}
  }else{
    status.textContent='Du är inloggad som '+email+', men kontot har ingen aktiv arrangörsåtkomst. Se priser och paket under Annonsera, eller kontakta oss för att beställa arrangörspaketet.';
  }
}).catch(()=>{status.hidden=false;status.textContent='Inloggningskontrollen kunde inte slutföras. Ni kan fortfarande öppna inloggningen nedan eller ladda om sidan och försöka igen.'}).finally(()=>clearTimeout(timeout));
})();
