(() => {
  'use strict';
  const STACKED='stack', TILED='tile';
  const GRID_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.2"/><rect x="14" y="4" width="6" height="6" rx="1.2"/><rect x="4" y="14" width="6" height="6" rx="1.2"/><rect x="14" y="14" width="6" height="6" rx="1.2"/></svg>';
  const STACK_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="4" width="13" height="15" rx="2"/><path d="M5 8v11a2 2 0 0 0 2 2h10"/></svg>';
  function normalize(value){return value===TILED?TILED:STACKED}
  function next(value){return normalize(value)===STACKED?TILED:STACKED}
  function toggle(state,storage,key){state.ticketWalletCardLayout=next(state.ticketWalletCardLayout);storage.setItem(key,state.ticketWalletCardLayout);return state.ticketWalletCardLayout}
  function pageAttribute(value){return 'data-ticket-wallet-layout="'+normalize(value)+'"'}
  function toggleButtonMarkup(value,language){
    const current=normalize(value), switchesToTile=current===STACKED, english=language==='en';
    const label=english?(switchesToTile?'Switch to tiled layout':'Switch to stacked layout'):(switchesToTile?'切换为平铺布局':'切换为堆叠布局');
    return '<button type="button" class="ticket-wallet-layout-toggle" data-ticket-wallet-layout-toggle aria-label="'+label+'" title="'+label+'" aria-pressed="'+(current===TILED?'true':'false')+'">'+(switchesToTile?GRID_ICON:STACK_ICON)+'</button>';
  }
  function reorderOffsets(start,target,centers,deltaY,settling=false){
    if(!Array.isArray(centers)||!centers.length||!Number.isInteger(start)||!Number.isInteger(target)||start<0||target<0||start>=centers.length||target>=centers.length)return [];
    return centers.map((_,index)=>{
      if(index===start)return settling?centers[target]-centers[start]:Number(deltaY)||0;
      if(target>start&&index>start&&index<=target)return centers[index-1]-centers[index];
      if(target<start&&index>=target&&index<start)return centers[index+1]-centers[index];
      return 0;
    });
  }
  window.OneBoxTicketWalletLayout=Object.freeze({normalize,next,toggle,pageAttribute,toggleButtonMarkup,reorderOffsets});
})();
