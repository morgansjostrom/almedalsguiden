/* Shared deterministic directory rules. Only consented networking fields participate. */
(()=>{'use strict';
const normalize=v=>String(v||'').trim().toLocaleLowerCase('sv-SE');
const TAGS=['Samarbetspartner','Finansiering','Kunskap och expertis','Rekrytering','Kunder och uppdrag','Media och synlighet','Politiska kontakter','Mentorskap'];
/* Shared days are a requirement, not points. Complementary needs weigh most, then shared saved events, then shared topics. */
function match(person,own){
 const none={interests:[],days:[],theyOffer:[],youOffer:[],events:0,score:0,reasons:[]};
 if(!own?.visible||own.suspended)return none;
 const days=[...new Set(person.days||[])].filter(x=>(own.days||[]).includes(x));
 if(!days.length)return none;
 const interests=[...new Set(person.interests||[])].filter(x=>(own.interests||[]).some(y=>normalize(x)===normalize(y)));
 const theyOffer=(own.seeking_tags||[]).filter(t=>(person.offering_tags||[]).includes(t));
 const youOffer=(own.offering_tags||[]).filter(t=>(person.seeking_tags||[]).includes(t));
 const events=Number(person.shared_events)||0;
 const score=theyOffer.length*5+youOffer.length*4+Math.min(events,5)*3+interests.length;
 const reasons=[];
 if(theyOffer.length)reasons.push('Kan bidra med det du söker: '+theyOffer.join(', ').toLowerCase());
 if(youOffer.length)reasons.push('Söker det du erbjuder: '+youOffer.join(', ').toLowerCase());
 if(events)reasons.push('Ni har '+events+' '+(events===1?'gemensam programpunkt':'gemensamma programpunkter')+' i schemat');
 if(interests.length)reasons.push('Gemensamma ämnen: '+interests.join(', '));
 if(score)reasons.push('På plats samma '+(days.length===1?'dag':days.length+' dagar'));
 return {interests,days,theyOffer,youOffer,events,score,reasons};
}
function select(profiles,filters,own){
 const contains=(value,term)=>normalize(value).includes(normalize(term));
 return profiles.filter(p=>(filters.sort!=='match'||match(p,own).score>0)&&p.visible!==false&&!p.suspended&&(!filters.q||contains([p.name,p.organization,p.role,...p.interests].join(' '),filters.q))&&(!filters.day||p.days.includes(filters.day))&&(!filters.topic||p.interests.includes(filters.topic))&&(!filters.organization||contains(p.organization,filters.organization))&&(!filters.role||contains(p.role,filters.role))).sort((a,b)=>{
  const score=filters.sort==='match'?match(b,own).score-match(a,own).score:0;
  return score||String(a.name).localeCompare(String(b.name),'sv')||String(a.user_id).localeCompare(String(b.user_id));
 });
}
const names=['Anna Lind','Erik Holm','Sara Rahimi','Johan Berg','Daniel Chen','Emma Ek','Samuel Mensah','Amina Ali','Oscar Lund','Maria Costa','Anders Nyberg','Sofia Dahl','Nora Lundin','Martin Vik','Linnea Wang','David Strand','Amir Saleh','Elin Andersson','Lars Nilsson','Leila Ahmed'];
const organizations=['Exempelkommunen','Framtidsforum','Hållbarhetsnätverket','Kunskapsinstitutet','Demokratiforum','Innovationskontoret'];
const roles=['Kommunikationschef','Projektledare','Hållbarhetsstrateg','Forskare','Verksamhetschef','Rådgivare'];
const topics=['Demokrati','Hållbarhet','Digitalisering','Utbildning','Klimat/miljö','Innovation'];
const attendance=weekDays().days;
const demo=names.map((name,i)=>({user_id:'example-'+i,name,organization:organizations[i%6],role:roles[(i+Math.floor(i/6))%6],interests:[topics[i%6],topics[(i+1)%6]],days:attendance.filter((day,index)=>index===i%5||index===(i+1)%5||(i%4===0&&index===(i+2)%5)),seeking:'Kunskapsutbyte och nya samarbeten kring '+topics[i%6].toLowerCase()+'.',offering:'Erfarenheter från projekt och arbete inom '+topics[(i+1)%6].toLowerCase()+'.',visible:true,example:true,photo:'/network-preview/person-'+i+'.jpg',seeking_tags:[TAGS[i%8]],offering_tags:[TAGS[(i+3)%8],TAGS[(i+5)%8]],shared_events:i%3}));
/* Almedalsveckan is always ISO week 26. Monday of ISO week 1 contains 4 January; week 26 starts 25 weeks later. Offer Monday–Friday of the upcoming week 26. */
function weekDays(now){
 now=now||new Date();
 const monday=y=>{const jan4=new Date(Date.UTC(y,0,4));const m=new Date(jan4);m.setUTCDate(4-((jan4.getUTCDay()+6)%7));m.setUTCDate(m.getUTCDate()+25*7);return m;};
 let year=now.getFullYear();
 if(now.getTime()>=monday(year).getTime()+5*864e5)year++;
 const mon=monday(year),days=[];
 for(let i=0;i<5;i++){const d=new Date(mon);d.setUTCDate(mon.getUTCDate()+i);days.push(d.toISOString().slice(0,10));}
  return {year,days};
}
globalThis.AlmedalNetworkDirectory={match,select,demo,weekDays,TAGS};
})();