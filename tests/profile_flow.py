import asyncio,os,secrets,requests
from PIL import Image
from playwright.async_api import async_playwright
URL=os.environ['SUPABASE_URL'];KEY=os.environ['SUPABASE_SERVICE_ROLE_KEY'];PUB=os.environ['SUPABASE_PUBLISHABLE_KEY'];H={'apikey':KEY,'Content-Type':'application/json'}
if not KEY.startswith('sb_'):H['Authorization']='Bearer '+KEY
Image.new('RGB',(300,300),(70,120,130)).save('/tmp/browser/profile/photo.jpg')
async def main():
 uid=None
 try:
  pwd=secrets.token_urlsafe(24);email='profile-test-'+secrets.token_hex(6)+'@example.com'
  r=requests.post(URL+'/auth/v1/admin/users',headers=H,json={'email':email,'password':pwd,'email_confirm':True});r.raise_for_status();uid=r.json()['id']
  requests.post(URL+'/rest/v1/network_testers',headers=H,json={'user_id':uid}).raise_for_status()
  ss=requests.post(URL+'/auth/v1/token?grant_type=password',headers={'apikey':PUB,'Content-Type':'application/json'},json={'email':email,'password':pwd}).json()
  async with async_playwright() as p:
   b=await p.chromium.launch(headless=True);ctx=await b.new_context(viewport={'width':1280,'height':1800});page=await ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   await page.goto('http://localhost:8080');r=await page.request.post('http://localhost:8080/api/session',headers={'Origin':'http://localhost:8080'},data={'access_token':ss['access_token'],'refresh_token':ss['refresh_token']});assert r.ok
   await page.goto('http://localhost:8080/schema.html#profile');f=page.locator('#week-profile-form');await f.locator('[name=networkVisibility]').first.wait_for();await f.locator('[name=firstName]').fill('Testprofil');await f.locator('[name=goals]').fill('Privata testmål');await f.locator('[name=interest]').first.check();await page.set_input_files('#profile-photo-input','/tmp/browser/profile/photo.jpg');await page.get_by_text('Fotot sparas när du sparar din profil.',exact=True).wait_for();await f.get_by_role('button',name='Spara min profil').click();await page.get_by_text('Sparat på ditt konto.',exact=True).wait_for();r=await page.request.get('http://localhost:8080/api/profile-photo');assert r.ok
   await page.reload();await f.locator('[name=firstName]').wait_for();await page.wait_for_timeout(1000);assert await f.locator('[name=firstName]').input_value()=='Testprofil';assert await page.locator('#profile-photo-preview').is_visible();assert await page.locator('#network-profile-form').count()==0
   await f.locator('[name=networkVisibility][value=network]').check();await f.get_by_role('button',name='Spara min profil').click();await page.locator('#network-dialog').wait_for();assert 'Privata testmål' not in await page.locator('#network-dialog').inner_text();await page.locator('#network-dialog [name=consent]').check();await page.locator('#network-dialog').get_by_role('button',name='Dela min nätverksprofil').click();await page.wait_for_timeout(500)
   await page.screenshot(path='/tmp/browser/profile/desktop.png');await page.set_viewport_size({'width':393,'height':852});await page.screenshot(path='/tmp/browser/profile/mobile.png');assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   await f.locator('[name=networkVisibility][value=private]').check();await f.get_by_role('button',name='Spara min profil').click();await page.wait_for_timeout(500);d=await (await page.request.get('http://localhost:8080/api/networking')).json();assert not d['profile']['visible']
   await page.locator('#profile-photo-remove').click();await f.get_by_role('button',name='Spara min profil').click();await page.wait_for_timeout(2000);r=await page.request.get('http://localhost:8080/api/profile-photo');print('delete status',r.status,'save note',await page.locator('#profile-save-note').inner_text(),'photo status',await page.locator('#profile-photo-status').inner_text());assert r.status==404
   assert not errors,errors;print('Verified profile+photo save/reload, consent preview excludes goals, Privat hides networking, photo deletion, mobile width; no JS errors');await b.close()
 finally:
  if uid:
   for t in ['network_profiles','network_consents','network_testers']:requests.delete(URL+'/rest/v1/'+t+'?user_id=eq.'+uid,headers=H).raise_for_status()
   requests.delete(URL+'/auth/v1/admin/users/'+uid,headers=H).raise_for_status()
asyncio.run(main())
