(() => {
  'use strict';
  let manifestPromise, selectedYear, selectionRequest=0;
  const pending=new Map(),loaded=new Map();
  function sharedLoader(){try{if(parent!==window&&parent.location.origin===location.origin&&parent.AlmedalProgramData?.loadYear)return parent.AlmedalProgramData;}catch{}return null;}
  function metadata(){
    if(!manifestPromise){const shared=sharedLoader();manifestPromise=(shared?shared.metadata():fetch('/program-runtime/manifest.json').then(async r=>{if(!r.ok)throw Error('Programförteckningen kunde inte laddas');const m=await r.json();if(m.version!==2||!m.byYear)throw Error('Programförteckningen behöver uppdateras. Ladda om sidan.');return m;})).catch(error=>{manifestPromise=undefined;throw error;});}
    return manifestPromise;
  }
  function defaultYear(meta,now=new Date()){
    const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    return (meta.days.find(day=>day>=today)||meta.days.at(-1)||today).slice(0,4);
  }
  function requestedYear(meta){
    const params=new URLSearchParams(location.search),event=params.get('event')||params.get('programEvent')||'';
    const wanted=(event.includes('|')?event.split('|')[1]?.slice(0,4):meta.keyYears[event])||params.get('year')||(params.get('day')||params.get('programDay')||'').slice(0,4);
    return meta.years.includes(wanted)?wanted:defaultYear(meta);
  }
  function scopedPage(){return /\/(?:index|program)\.html$/.test(location.pathname)||location.pathname.endsWith('/');}
  function remember(year,events){
    loaded.set(year,events);window.AlmedalEventI18n?.register(events);
    window.dispatchEvent(new CustomEvent('almedal-program-data',{detail:{year,events,loaded:[...loaded.values()].flat()}}));
    return events;
  }
  function featured(){window.AlmedalSponsored=window.AlmedalSponsored||fetch('/api/sponsored').then(r=>r.ok?r.json():{articles:[],featured:[]}).catch(()=>({articles:[],featured:[]}));return window.AlmedalSponsored.then(d=>new Set(d.featured||[]));}
  async function loadYear(year){
    const meta=await metadata();year=String(year);
    if(!meta.byYear[year])throw Error('Programår saknas: '+year);
    if(!pending.has(year)){
      const shared=sharedLoader();
      const task=(shared?shared.loadYear(year):fetch(meta.byYear[year].file,{cache:'force-cache'}).then(async r=>{if(!r.ok)throw Error('Programmet för '+year+' kunde inte laddas. Försök igen.');const rows=await r.json();if(!Array.isArray(rows)||rows.some(e=>!e.day?.startsWith(year+'-')))throw Error('Felaktigt programunderlag');return rows;})).then(rows=>featured().then(set=>{for(const e of rows)if(set.has(e.id+'|'+e.day+'|'+e.start))e.sponsoredDemo=true;return rows;})).then(rows=>remember(year,rows)).catch(error=>{pending.delete(year);throw error;});
      pending.set(year,task);
    }
    return pending.get(year);
  }
  async function loadAll(){const meta=await metadata();return (await Promise.all(meta.years.map(loadYear))).flat();}
  async function load(){const meta=await metadata();return scopedPage()?loadYear(selectedYear||(/\/program\.html$/.test(location.pathname)?requestedYear(meta):defaultYear(meta))):loadAll();}
  async function selectYear(year){const request=++selectionRequest;const rows=await loadYear(year);if(request===selectionRequest)selectedYear=String(year);return rows;}
  window.AlmedalProgramData={metadata,defaultYear,requestedYear,loadYear,loadAll,selectYear,load,loaded:()=>[...loaded.values()].flat(),async fetch(){const events=await load();return {ok:true,json:async()=>events.slice()};}};
})();
