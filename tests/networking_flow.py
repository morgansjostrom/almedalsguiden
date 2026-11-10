import asyncio,os,secrets,requests,json
from playwright.async_api import async_playwright
URL=os.environ['SUPABASE_URL']; KEY=os.environ['SUPABASE_SERVICE_ROLE_KEY']; PUB=os.environ['SUPABASE_PUBLISHABLE_KEY']
headers={'apikey':KEY,'Content-Type':'application/json'}
if not KEY.startswith('sb_'):headers['Authorization']='Bearer '+KEY
users=[]
def admin(method,path,data=None):
 r=requests.request(method,URL+path,headers=headers,json=data);r.raise_for_status();return r.json() if r.content else None
async def main():
 try:
  for i in range(3):
   email='network-test-'+secrets.token_hex(6)+'@example.com';pwd=secrets.token_urlsafe(24)
   u=admin('POST','/auth/v1/admin/users',{'email':email,'password':pwd,'email_confirm':True});users.append(u['id'])
   if i<2:admin('POST','/rest/v1/network_testers',{'user_id':u['id']})
   session=requests.post(URL+'/auth/v1/token?grant_type=password',headers={'apikey':PUB,'Content-Type':'application/json'},json={'email':email,'password':pwd});session.raise_for_status();u['session']=session.json();users[i]={'id':u['id'],'session':u['session']}
  async with async_playwright() as p:
   b=await p.chromium.launch(headless=True);pages=[];errors=[]
   for u in users:
    ctx=await b.new_context(viewport={'width':1280,'height':1800});page=await ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto('http://localhost:8080');r=await page.request.post('http://localhost:8080/api/session',data={'access_token':u['session']['access_token'],'refresh_token':u['session']['refresh_token']},headers={'Origin':'http://localhost:8080'});assert r.ok
    await page.goto('http://localhost:8080/schema.html');await page.wait_for_timeout(1500);pages.append(page)
   assert (await pages[2].request.get('http://localhost:8080/api/networking')).status==403
   print('unallowlisted user denied')
   for page,name in zip(pages[:2],['Test Anna','Test Bo']):
    await page.locator('.week-tabs').get_by_role('tab',name='Min profil').click();form=page.locator('#week-profile-form');await form.locator('[name=firstName]').fill(name);await form.locator('[name=workplace]').fill('Testkommun');await form.locator('[name=interest]').first.check();await form.locator('[name=networkDays]').fill('2026-06-23');await form.locator('[name=networkVisibility][value=network]').check();await form.get_by_role('button',name='Spara min profil').click();await page.locator('#network-dialog [name=consent]').check();await page.locator('#network-dialog').get_by_role('button',name='Dela min nätverksprofil').click();await page.wait_for_timeout(500)
    d=await (await page.request.get('http://localhost:8080/api/networking')).json();assert d.get('profile',{}).get('visible'),d
   print('both profiles shared with explicit consent')
   a,bo=pages[:2]
   await a.locator('.week-tabs').get_by_role('tab',name='Nätverka med andra besökare',exact=True).click();await a.locator('#network-search').fill('Test Bo');await a.locator('#network-search-form').get_by_role('button',name='Sök',exact=True).click();await a.locator('#network-content').get_by_role('button',name='Visa profil').click();await a.locator('#network-request-form textarea').fill('Ska vi prata energi?');await a.locator('#network-request-form').get_by_role('button',name='Skicka förfrågan').click();await a.wait_for_timeout(300)
   await bo.reload();await bo.wait_for_timeout(500);await bo.locator('.week-tabs').get_by_role('tab',name='Nätverka med andra besökare').click();await bo.locator('#network-content').get_by_role('button',name='Kontaktförfrågningar').click();await bo.locator('#network-content').get_by_role('button',name='Acceptera',exact=True).click();await bo.locator('#network-content').get_by_role('button',name='Öppna samtal').click();await bo.locator('#network-message-form textarea').fill('Ja, vi möts vid torget.');await bo.locator('#network-message-form').get_by_role('button',name='Skicka',exact=True).click();await bo.wait_for_timeout(300)
   await a.reload();await a.wait_for_timeout(600);await a.locator('.week-tabs').get_by_role('tab',name='Nätverka med andra besökare').click();await a.locator('#network-content').get_by_role('button',name='Kontaktförfrågningar').click();await a.locator('#network-content').get_by_role('button',name='Öppna samtal').click();await a.locator('#network-messages').get_by_text('Ja, vi möts vid torget.').wait_for();await a.locator('#network-dialog').screenshot(path='/tmp/browser/network/conversation.png');print('request accepted and real reply read back in UI')
   await a.locator('#network-dialog').get_by_role('button',name='Rapportera meddelande').click();await a.locator('#network-report-form textarea').fill('Test av rapportering');await a.locator('#network-report-form').get_by_role('button',name='Skicka rapport').click();await a.wait_for_timeout(300)
   reports=admin('GET','/rest/v1/network_reports?reporter_id=eq.'+users[0]['id']);assert len(reports)==1 and reports[0]['snapshot']=='Ja, vi möts vid torget.';print('report contains only reported message')
   # actual admin page and role checked report decision
   with open(os.path.expanduser('~/.cache/lovable-auth/session.json')) as f: minted=json.load(f)
   ac=await b.new_context(viewport={'width':1280,'height':1800});ap=await ac.new_page();await ap.goto('http://localhost:8080');ss=minted['session']
   ar=await ap.request.post('http://localhost:8080/api/session',data={'access_token':ss['access_token'],'refresh_token':ss['refresh_token']},headers={'Origin':'http://localhost:8080'});assert ar.ok
   await ap.goto('http://localhost:8080/admin/natverk');await ap.get_by_text('Test av rapportering',exact=True).wait_for();await ap.get_by_role('button',name='Markera hanterad').click();await ap.wait_for_timeout(700);print('admin result',await ap.locator('[role=status]').inner_text());await ap.get_by_text('Hanterad rapport',exact=True).wait_for();await ap.screenshot(path='/tmp/browser/network/admin.png');print('admin reviewed reported content and resolved report')
   denied=await a.request.get('http://localhost:8080/api/networking?mode=admin');assert denied.status==403
   # missing consent version direct RPC must fail, not just HTTP validation
   h1={'apikey':PUB,'Authorization':'Bearer '+users[0]['session']['access_token'],'Content-Type':'application/json'}
   invalid=requests.post(URL+'/rest/v1/rpc/network_command',headers=h1,json={'action':'profile','payload':{'name':'Test Anna','organization':'','role':'','interests':[],'seeking':'','offering':'','days':[],'visible':True,'consent':True}});assert invalid.status_code>=400
   for bad in [{'action':'accept','id':'00000000-0000-4000-8000-000000000001'},{'action':'request','target':users[0]['id'],'text':'self'}]:
    rbad=await a.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data=bad);assert not rbad.ok
   hidden=await a.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data={'action':'hide'});assert hidden.ok
   dh=await (await bo.request.get('http://localhost:8080/api/networking?mode=directory')).json();assert not any(x['user_id']==users[0]['id'] for x in dh['profiles'])
   read=await bo.request.get('http://localhost:8080/api/networking?mode=messages&id='+reports[0].get('request_id','00000000-0000-4000-8000-000000000001'))
   print('consent omission, self contact and admin impersonation denied; hidden profile not searchable')
   hhome=await (await a.request.get('http://localhost:8080/api/networking')).json();cid=hhome['contacts'][0]['id']
   assert (await bo.request.get('http://localhost:8080/api/networking?mode=messages&id='+cid)).ok
   # simultaneous duplicate requests rejected by lock and durable quota
   admin('POST','/rest/v1/network_testers',{'user_id':users[2]['id']})
   p3={'action':'profile','name':'Test C','organization':'Test','role':'','interests':[],'seeking':'','offering':'','days':[],'visible':True,'consent':True,'consent_version':'network-v2'}
   c=pages[2];assert (await c.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data=p3)).ok
   req={'action':'request','target':users[1]['id'],'text':'Concurrent test'}
   rs=await asyncio.gather(*[c.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data=req) for _ in range(2)]);assert sum(r.ok for r in rs)==1
   ch=await (await c.request.get('http://localhost:8080/api/networking')).json();pending=ch['contacts'][0]['id']
   assert (await bo.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data={'action':'decline','id':pending})).ok
   # daily quota uses durable history, including deleted content
   admin('POST','/rest/v1/network_action_log',[{'user_id':users[2]['id'],'kind':'request','target_id':users[1]['id']} for _ in range(9)])
   again=await c.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data={'action':'request','target':users[1]['id'],'text':'limit'});assert not again.ok;assert len(admin('GET','/rest/v1/network_action_log?user_id=eq.'+users[2]['id']+'&kind=eq.request'))==10
   # suspension survives profile deletion; admin sees only report snapshot
   admin('PATCH','/rest/v1/network_reports?id=eq.'+reports[0]['id'],{'status':'open'})
   suspend=await ap.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data={'action':'moderate','id':reports[0]['id'],'decision':'suspend'});assert suspend.ok
   assert (await bo.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data={'action':'delete'})).ok
   recreate=await bo.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data={**p3,'name':'Test Bo'});assert not recreate.ok
   # restore isolated test suspension for remaining block test only
   admin('DELETE','/rest/v1/network_suspensions?user_id=eq.'+users[1]['id'])
   assert (await bo.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data={**p3,'name':'Test Bo'})).ok
   # deletion does not affect private profile/favorites; use a new request fixture for remaining check
   admin('DELETE','/rest/v1/network_action_log?user_id=eq.'+users[0]['id']);admin('POST','/rest/v1/network_requests',{'sender_id':users[0]['id'],'recipient_id':users[1]['id'],'introduction':'Block test','status':'accepted'})
   print('accepted chat survives hiding; concurrent duplicates, quota, decline and durable suspension verified')
   # direct database attempts: private writes denied; unrelated reads empty
   token=users[2]['session']['access_token'];h={'apikey':PUB,'Authorization':'Bearer '+token,'Content-Type':'application/json'}
   rr=requests.get(URL+'/rest/v1/network_messages?select=*',headers=h);assert rr.json()==[]
   rr=requests.post(URL+'/rest/v1/network_profiles',headers=h,json={'user_id':users[2]['id'],'name':'Bypass'});assert rr.status_code>=400
   # blocked conversation cannot read/send
   home=await (await a.request.get('http://localhost:8080/api/networking')).json();rid=home['contacts'][0]['id']
   blocked=await a.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data={'action':'block','target':users[1]['id']});assert blocked.ok
   assert (await bo.request.get('http://localhost:8080/api/networking?mode=messages&id='+rid)).status==404
   send=await bo.request.post('http://localhost:8080/api/networking',headers={'Origin':'http://localhost:8080'},data={'action':'message','id':rid,'text':'Blocked'});assert not send.ok
   print('block prevents reading and sending; cross-user RLS denied')
   await a.set_viewport_size({'width':393,'height':852});await a.reload();await a.wait_for_timeout(600);await a.locator('.workspace-menu-button').click();assert await a.locator('.workspace-menu [data-target=tab-network]').is_visible();await a.wait_for_timeout(400);await a.screenshot(path='/tmp/browser/network/mobile-menu.png');print('mobile menu includes networking')
   assert not errors,errors
   await b.close()
 finally:
  ids=[u['id'] if isinstance(u,dict) else u for u in users]
  for uid in ids:
   for table,column in [('network_requests','sender_id'),('network_requests','recipient_id'),('network_reports','reporter_id'),('network_consents','user_id'),('network_blocks','owner_id'),('network_profiles','user_id'),('network_suspensions','user_id'),('network_action_log','user_id'),('network_testers','user_id')]:admin('DELETE',f'/rest/v1/{table}?{column}=eq.{uid}')
   admin('DELETE','/auth/v1/admin/users/'+uid)
  print('test users and data removed')
asyncio.run(main())
