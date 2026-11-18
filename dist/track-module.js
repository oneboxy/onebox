(function(){
'use strict';
const DB='onebox-track-v1',API=String(window.ONEBOX_TRACK_API||'').replace(/\/$/,'');
const s={watch:null,active:false,start:0,points:[],distance:0,current:null};
let map=null,line=null,pin=null,timer=null,leaflet=null,holdTimer=null,holdButton=null,feedRequest=0,mapResizeObserver=null;
const en=()=>document.documentElement.lang.toLowerCase().startsWith('en');
const text=(zh,english)=>en()?english:zh;
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function openDb(){return new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('tracks'))r.result.createObjectStore('tracks',{keyPath:'id'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function allTracks(){const d=await openDb();return new Promise((ok,no)=>{const r=d.transaction('tracks').objectStore('tracks').getAll();r.onsuccess=()=>ok((r.result||[]).sort((a,b)=>b.saved-a.saved));r.onerror=()=>no(r.error)})}
async function saveTrack(x){const d=await openDb();return new Promise((ok,no)=>{const t=d.transaction('tracks','readwrite');t.objectStore('tracks').put(x);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
async function deleteTrack(id){const d=await openDb();return new Promise((ok,no)=>{const t=d.transaction('tracks','readwrite');t.objectStore('tracks').delete(id);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
function meters(n){return n>=1000?(n/1000).toFixed(2)+' km':Math.round(n)+' m'}
function duration(ms){const n=Math.max(0,Math.floor(ms/1000));return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(v=>String(v).padStart(2,'0')).join(':')}
function distance(a,b){const rad=v=>v*Math.PI/180,dl=rad(b.lat-a.lat),dn=rad(b.lng-a.lng),q=Math.sin(dl/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dn/2)**2;return 6371000*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}
function root(){return document.querySelector('[data-track-root]')}
function moduleText(){
  return `<section class="track-module" data-track-root>
    <header class="track-page-head">
      <nav class="track-page-nav" aria-label="${text('页面导航','Page navigation')}">
        <button type="button" class="ticket-wallet-back track-back" data-track-back aria-label="${text('返回上一页','Go back')}" title="${text('返回上一页','Go back')}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>
        </button>
        <span class="track-page-title" aria-current="page">${text('路游','Track')}</span>
      </nav>
    </header>
    <section class="track-map-panel" aria-label="${text('路线地图','Route map')}">
      <div class="track-map" data-track-map>
        <div class="track-map-placeholder">${text('地图加载中…','Loading map…')}</div>
        <div class="track-map-actions" aria-label="${text('地图操作','Map controls')}">
          <button type="button" data-track-locate aria-label="${text('定位当前位置','Locate me')}" title="${text('定位当前位置','Locate me')}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          </button>
          <button type="button" data-track-zoom="1" aria-label="${text('放大地图','Zoom in')}" title="${text('放大地图','Zoom in')}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button type="button" data-track-zoom="-1" aria-label="${text('缩小地图','Zoom out')}" title="${text('缩小地图','Zoom out')}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>
          </button>
        </div>
      </div>
      <div class="track-stats">
        <div><span>${text('用时','Time')}</span><strong data-track-time>00:00:00</strong></div>
        <div><span>${text('距离','Distance')}</span><strong data-track-distance>0 m</strong></div>
        <div><span>${text('状态','Status')}</span><strong data-track-status>${text('尚未开始','Not started')}</strong></div>
      </div>
      <div class="track-record-controls">${s.active
        ? `<button type="button" class="track-button track-hold" data-track-finish-hold><span>${text('按住结束录制','Hold to finish')}</span></button>`
        : `<button type="button" class="track-button track-start" data-track-start>${text('开始录制','Start recording')}</button>`}
      </div>
      <div class="track-toast" data-track-toast role="status" hidden></div>
    </section>
  </section>`;
}
function render(){setTimeout(initPage,0);return moduleText()}
function loadLeaflet(){if(window.L)return Promise.resolve();if(leaflet)return leaflet;leaflet=new Promise((ok,no)=>{if(!document.querySelector('[data-track-leaflet-css]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.dataset.trackLeafletCss='';document.head.appendChild(l)}const x=document.createElement('script');x.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';x.async=true;x.onload=ok;x.onerror=()=>no(Error(text('地图加载失败，请检查网络。','Could not load the map. Check your connection.')));document.head.appendChild(x)});return leaflet}
function initMap(){const el=document.querySelector('[data-track-map]');if(!el)return;if(map&&map.getContainer()!==el){mapResizeObserver?.disconnect();mapResizeObserver=null;map.remove();map=null;line=null;pin=null}loadLeaflet().then(()=>{if(!document.contains(el))return;if(!map){map=L.map(el,{zoomControl:false}).setView([31.23,121.47],12);L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Esri, HERE, Garmin, © OpenStreetMap'}).addTo(map);line=L.polyline([],{color:'var(--track-route,#4568dd)',weight:5}).addTo(map)}el.querySelector('.track-map-placeholder')?.remove();if(!mapResizeObserver){mapResizeObserver=new ResizeObserver(()=>map&&map.invalidateSize({pan:false,debounceMoveend:true}));mapResizeObserver.observe(el)}requestAnimationFrame(()=>requestAnimationFrame(()=>map&&map.invalidateSize({pan:false,debounceMoveend:true})));if(s.points.length)line.setLatLngs(s.points.map(p=>[p.lat,p.lng]));if(s.current)showPin(s.current)}).catch(err=>{if(el)el.innerHTML='<div class="track-map-placeholder">'+esc(err.message)+'</div>'})}
function showPin(p){if(!map)return;const ll=[p.lat,p.lng];if(!pin)pin=L.circleMarker(ll,{radius:8,color:'#fff',weight:3,fillColor:'#4365df',fillOpacity:1}).addTo(map);pin.setLatLng(ll)}
function updateStats(){const r=root();if(!r)return;const t=r.querySelector('[data-track-time]'),d=r.querySelector('[data-track-distance]'),q=r.querySelector('[data-track-status]');if(t)t.textContent=duration((s.active?Date.now():s.start)-s.start);if(d)d.textContent=meters(s.distance);if(q)q.textContent=s.active?text('正在录制','Recording'):s.current?text('已定位','Located'):text('尚未开始','Not started')}
function initPage(){if(!root())return;initMap();updateStats()}
function stopWatch(){if(s.watch!==null&&navigator.geolocation){navigator.geolocation.clearWatch(s.watch);s.watch=null}if(timer){clearInterval(timer);timer=null}}
function startWatch(){if(!navigator.geolocation){alert(text('此浏览器不支持定位。','Geolocation is not supported by this browser.'));return}stopWatch();s.watch=navigator.geolocation.watchPosition(p=>{if(!s.active||p.coords.accuracy>120)return;const x={lat:p.coords.latitude,lng:p.coords.longitude,at:p.timestamp||Date.now()};if(s.points.length){const d=distance(s.points[s.points.length-1],x);if(d<3)return;if(d>150){s.current=x;showPin(x);updateStats();return}s.distance+=d}s.points.push(x);s.current=x;if(line)line.setLatLngs(s.points.map(q=>[q.lat,q.lng]));showPin(x);updateStats()},err=>{const q=root()?.querySelector('[data-track-status]');if(q)q.textContent=err.code===1?text('请允许 OneBox 使用定位','Allow OneBox to access your location'):text('定位信号较弱','Weak location signal')},{enableHighAccuracy:true,maximumAge:1000,timeout:15000});if(!timer)timer=setInterval(updateStats,1000)}
function locate(){if(!navigator.geolocation){alert(text('此浏览器不支持定位。','Geolocation is not supported.'));return}const q=root()?.querySelector('[data-track-status]');if(q)q.textContent=text('正在定位…','Locating…');navigator.geolocation.getCurrentPosition(p=>{s.current={lat:p.coords.latitude,lng:p.coords.longitude,at:p.timestamp||Date.now()};initMap();if(map){showPin(s.current);map.setView([s.current.lat,s.current.lng],16)}updateStats()},err=>{if(q)q.textContent=err.code===1?text('定位权限未开启','Location permission is off'):text('无法获取当前位置','Could not get your location')},{enableHighAccuracy:true,timeout:15000,maximumAge:1000})}
async function startRecording(){if(!navigator.geolocation){alert(text('此浏览器不支持定位。','Geolocation is not supported.'));return}s.start=Date.now();s.points=[];s.distance=0;s.active=true;const controls=root()?.querySelector('.track-record-controls');if(controls)controls.innerHTML='<button type="button" class="track-button track-hold" data-track-finish-hold><span>'+text('按住结束录制','Hold to finish')+'</span></button>';updateStats();startWatch()}
async function finishRecording(){clearHold();stopWatch();if(!s.active)return;s.active=false;let saved=false;if(s.points.length){try{await saveTrack({id:crypto.randomUUID(),name:text('路游路线 ','Track ') +new Date(s.start).toLocaleString(),start:s.start,duration:Date.now()-s.start,distance:s.distance,points:s.points,saved:Date.now()});saved=true}catch(err){alert(text('保存失败：','Could not save: ')+err.message)}}else alert(text('没有收到有效定位点，本次未保存。','No valid location points were recorded.'));s.points=[];s.start=0;s.distance=0;const controls=root()?.querySelector('.track-record-controls');if(controls)controls.innerHTML='<button type="button" class="track-button track-start" data-track-start>'+text('开始录制','Start recording')+'</button>';updateStats();loadRecords();if(saved)announce(text('路线已保存在本机。','Route saved on this device.'))}
function announce(message){const node=root()?.querySelector('[data-track-toast]');if(node){node.textContent=message;node.hidden=false;setTimeout(()=>node.hidden=true,2500)}}
function clearHold(){if(holdTimer){clearTimeout(holdTimer);holdTimer=null}if(holdButton){holdButton.classList.remove('is-holding');holdButton=null}}
function beginHold(button){if(holdTimer)return;holdButton=button;button.classList.add('is-holding');holdTimer=setTimeout(()=>{holdTimer=null;if(holdButton)holdButton.classList.remove('is-holding');holdButton=null;finishRecording()},1000)}
async function loadRecords(){const el=root()?.querySelector('[data-track-records]');if(!el)return;try{const xs=await allTracks();el.innerHTML=xs.length?xs.slice(0,5).map(x=>'<article class="track-route"><div><strong>'+esc(x.name)+'</strong><small>'+new Date(x.start).toLocaleString()+' · '+duration(x.duration)+' · '+meters(x.distance)+'</small></div><div class="track-route-actions"><button type="button" class="track-small-button" data-track-export="'+esc(x.id)+'">'+text('导出','Export')+'</button><button type="button" class="track-small-button track-delete" data-track-delete="'+esc(x.id)+'">'+text('删除','Delete')+'</button></div></article>').join(''):'<p class="track-empty">'+text('开始一次录制后，路线会显示在这里。','Your saved routes will appear here.')+'</p>'}catch(err){el.textContent=err.message}}
function exportGpx(x){if(!x)return;const xml='<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="OneBox Track" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>'+esc(x.name)+'</name><trkseg>'+x.points.map(p=>'<trkpt lat="'+p.lat+'" lon="'+p.lng+'"><time>'+new Date(p.at).toISOString()+'</time></trkpt>').join('')+'</trkseg></trk></gpx>',a=document.createElement('a');a.href=URL.createObjectURL(new Blob([xml],{type:'application/gpx+xml'}));a.download='onebox-route-'+new Date(x.start).toISOString().slice(0,10)+'.gpx';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
async function loadFeed(){const el=root()?.querySelector('[data-track-feed]');if(!el)return;const request=++feedRequest;if(!API){el.innerHTML='<div class="track-feed-empty"><span class="track-feed-symbol">✳</span><strong>'+text('欢迎来到路游','Welcome to Track')+'</strong><p>'+text('这里会展示你和路友分享的动态。动态服务接入后，将使用 OneBox 账号登录。','Shared updates will appear here when the activity service is connected. Sign-in will use your OneBox account.')+'</p></div>';return}try{let token='';try{token=await window.OneBoxCloudSync?.getSession?.()||''}catch(_){}const response=await fetch(API+'/api/feed',{headers:token?{Authorization:'Bearer '+token,Accept:'application/json'}:{Accept:'application/json'},cache:'no-store'});if(!response.ok)throw Error('feed unavailable');const data=await response.json();if(request!==feedRequest||!el.isConnected)return;const posts=data.posts||[];el.innerHTML=posts.length?posts.map(p=>'<article class="track-post"><strong>'+esc(p.displayName||p.login||text('路友','Traveler'))+'</strong><p>'+esc(p.body)+'</p><small>'+esc(p.placeLabel||'')+' · '+new Date(p.createdAt).toLocaleString()+'</small></article>').join(''):'<div class="track-feed-empty"><span class="track-feed-symbol">✳</span><strong>'+text('还没有动态','No updates yet')+'</strong><p>'+text('分享一段旅程，开启你的路游记录。','Share a journey to start your story.')+'</p></div>'}catch(_){if(request===feedRequest&&el.isConnected)el.innerHTML='<div class="track-feed-empty"><strong>'+text('动态暂时无法加载','Updates are unavailable')+'</strong><p>'+text('请稍后再试。','Please try again later.')+'</p></div>'}}
function cleanToolEntry(){document.querySelectorAll('#toolNav [data-track-entry],#toolNav .track-nav-entry').forEach(x=>x.remove())}
document.addEventListener('click',async ev=>{const zoom=ev.target.closest('[data-track-zoom]');if(zoom){ev.preventDefault();ev.stopPropagation();if(map)map.setZoom(map.getZoom()+Number(zoom.dataset.trackZoom));return}const back=ev.target.closest('[data-track-back]');if(back){ev.preventDefault();const target=sessionStorage.getItem('onebox.track-return')||'mine';sessionStorage.removeItem('onebox.track-return');location.hash=target;return}const entry=ev.target.closest('[data-track-entry]');if(entry){ev.preventDefault();sessionStorage.setItem('onebox.track-return',location.hash.slice(1)||'mine');location.hash='track';return}if(location.hash!=='#track')return;const start=ev.target.closest('[data-track-start]');if(start){startRecording();return}const loc=ev.target.closest('[data-track-locate]');if(loc){locate();return}const ex=ev.target.closest('[data-track-export]');if(ex){exportGpx((await allTracks()).find(x=>x.id===ex.dataset.trackExport));return}const del=ev.target.closest('[data-track-delete]');if(del&&confirm(text('删除这条本机路线？','Delete this route from this device?'))){await deleteTrack(del.dataset.trackDelete);loadRecords()}},{capture:true});
document.addEventListener('pointerdown',ev=>{const button=ev.target.closest('[data-track-finish-hold]');if(!button||location.hash!=='#track')return;ev.preventDefault();try{button.setPointerCapture(ev.pointerId)}catch(_){}beginHold(button)},{capture:true});
for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,ev=>{if(holdButton&&(ev.target===holdButton||ev.target.closest?.('[data-track-finish-hold]')))clearHold()},{capture:true});
document.addEventListener('keydown',ev=>{const button=ev.target.closest?.('[data-track-finish-hold]');if(button&&(ev.code==='Space'||ev.code==='Enter')){ev.preventDefault();beginHold(button)}},{capture:true});
document.addEventListener('keyup',ev=>{if(holdButton&&(ev.code==='Space'||ev.code==='Enter'))clearHold()},{capture:true});
document.addEventListener('contextmenu',ev=>{if(ev.target.closest('[data-track-finish-hold]'))ev.preventDefault()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.active){stopWatch();const q=root()?.querySelector('[data-track-status]');if(q)q.textContent=text('切到后台，定位可能暂停','Backgrounded; location may pause')}else if(!document.hidden&&s.active)startWatch()});
new MutationObserver(cleanToolEntry).observe(document.documentElement,{childList:true,subtree:true});
window.OneBoxTrack={render};
})();
