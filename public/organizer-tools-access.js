// Only initialize the planning workspace after a verified organizer status.
(async()=>{
  const status=document.getElementById('ot-access-status');
  const workspace=document.getElementById('ot-access-workspace');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch('/api/organizer-status',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('status');
    const data=await response.json();
    if(data.mustChangePassword){location.replace('/arrangor-nytt-losenord');return}
    if(!data.user||!data.organizer){location.replace('/arrangor-start.html');return}
    if(!workspace)return;
    workspace.hidden=false;
    if(status)status.hidden=true;
    const script=document.createElement('script');
    script.src='organizer-tools.js?v=3';
    document.body.appendChild(script);
  }catch{
    if(status)status.textContent='Inloggningen kunde inte kontrolleras. Försök igen eller gå till arrangörsinloggningen.';
  }finally{clearTimeout(timeout)}
})();