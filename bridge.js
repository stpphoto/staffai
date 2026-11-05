/* Native static frontend transport. No Google browser session or embedded Google page. */
(() => {
  'use strict';
  const root=new URL('./',location.href);
  const page=new URLSearchParams(location.search).get('page');
  if(/\/(?:index\.html)?$/.test(location.pathname) && ['apply','admin'].includes(page)) {
    const dest=new URL(page+'.html',root);dest.search=location.search;location.replace(dest.href);
  }
  const endpoint='https://staffai-api.parkpoomict.chatgpt.site/api/rpc';
  let photos;
  async function call(method,args){
    if(method==='campusPhotos') {
      photos ||= fetch(new URL('photos.json',root)).then(r=>{if(!r.ok)throw Error('ภาพไม่พร้อม');return r.json()});
      const list=await photos;return (Array.isArray(args[0])?args[0]:[0,1,2]).map(i=>list[i]?new URL(list[i],root).href:'');
    }
    const control=new AbortController(),timer=setTimeout(()=>control.abort(),120000);
    try {
      const response=await fetch(endpoint,{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({v:1,method,args}),signal:control.signal});
      if(!response.ok)throw Error(response.status===429?'ระบบกำลังรับคำขอจำนวนมาก กรุณารอสักครู่':'ติดต่อระบบไม่ได้ กรุณาลองอีกครั้ง');
      const envelope=await response.json();
      if(envelope.v!==1||envelope.error)throw Error(envelope.error||'คำตอบจากระบบไม่ถูกต้อง');
      return envelope.result;
    } catch(error) {
      if(error.name==='AbortError')throw Error('ระบบตอบกลับช้า กรุณารีเฟรชตรวจสอบผลก่อนทำรายการซ้ำ');
      throw error;
    } finally{clearTimeout(timer)}
  }
  function runner(success=()=>{},failure=()=>{},userObject){
    return new Proxy(Object.create(null),{get(_,key){
      if(key==='withSuccessHandler')return fn=>runner(fn,failure,userObject);
      if(key==='withFailureHandler')return fn=>runner(success,fn,userObject);
      if(key==='withUserObject')return obj=>runner(success,failure,obj);
      if(typeof key!=='string'||!/^\w+$/.test(key)||key==='then')return undefined;
      return (...args)=>{call(key,args).then(r=>success?.(r,userObject),e=>failure?.(e,userObject))};
    }});
  }
  window.google={script:{run:runner()}};
})();
