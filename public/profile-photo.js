(()=>{'use strict';
const input=document.getElementById('profile-photo-input'),preview=document.getElementById('profile-photo-preview'),remove=document.getElementById('profile-photo-remove'),status=document.getElementById('profile-photo-status');
if(!input)return;
let pending=null,deleted=false,previewURL='';
function show(url){preview.src=url;preview.hidden=false;remove.hidden=false;}
fetch('/api/profile-photo',{cache:'no-store'}).then(async r=>{if(r.ok){previewURL=URL.createObjectURL(await r.blob());show(previewURL);}});
input.onchange=async()=>{
 const file=input.files[0];if(!file)return;
 status.textContent='';
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024){status.textContent='Välj ett foto i JPEG, PNG eller WebP, högst 20 MB.';input.value='';return;}
 try{
  const bitmap=await createImageBitmap(file),scale=Math.min(1,800/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const context=canvas.getContext('2d');if(!context)throw Error('Fotot kunde inte läsas.');context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  pending=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.85));if(!pending)throw Error('Fotot kunde inte läsas.');
  deleted=false;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=URL.createObjectURL(pending);show(previewURL);status.textContent='Fotot sparas när du sparar din profil.';
 }catch{status.textContent='Fotot kunde inte läsas. Välj ett annat foto.';input.value='';}
};
remove.onclick=()=>{pending=null;deleted=true;preview.hidden=true;remove.hidden=true;input.value='';status.textContent='Fotot tas bort när du sparar din profil.';};
window.AlmedalProfilePhoto={async save(){
 if(!pending&&!deleted)return;
 const r=await fetch('/api/profile-photo',{method:deleted?'DELETE':'POST',...(pending?{headers:{'Content-Type':'image/jpeg'},body:pending}:{})});
 if(!r.ok){const d=await r.json();throw Error('Profilen är sparad, men '+(d.error||'fotot kunde inte sparas.'));}
 pending=null;deleted=false;status.textContent='';
}};
})();