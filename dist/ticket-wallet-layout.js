(() => {
  'use strict';
  const STACKED='stack';
  // Keep tiled mode paused until its responsive card layout is ready.
  function normalize(){return STACKED}
  function next(){return STACKED}
  function toggle(state,storage,key){state.ticketWalletCardLayout=STACKED;storage.setItem(key,STACKED);return STACKED}
  function pageAttribute(){return 'data-ticket-wallet-layout="'+STACKED+'"'}
  function toggleButtonMarkup(){return ''}
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
