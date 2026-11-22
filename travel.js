// A temporary camera dolly preserves the user's chosen wheel zoom.
const dolly={scale:1,velocity:0,until:0,last:performance.now()};
function cameraDolly(now=performance.now()){
  if(reduced)return 1;
  const dt=Math.min(Math.max(0,(now-dolly.last)/1000),.05);dolly.last=now;
  [dolly.scale,dolly.velocity]=springAxis(dolly.scale,dolly.velocity,now<dolly.until?.61:1,dt,6.2);
  return dolly.scale;
}
function beginTravel(){if(!reduced&&!document.body.classList.contains('booting'))dolly.until=performance.now()+700}
const travelNavigate=navigate;
navigate=function(direction){travelNavigate(direction);beginTravel()};
const travelGo=go;
go=function(...args){travelGo(...args);beginTravel()};
const travelMap=map;
map=function(...args){dolly.until=0;travelMap(...args)};
const travelZoom=zoomBy;
zoomBy=function(...args){dolly.until=0;travelZoom(...args)};
const travelBrake=brake;
brake=function(){dolly.until=0;travelBrake()};
document.addEventListener('visibilitychange',()=>{if(document.hidden){dolly.until=0;dolly.scale=1;dolly.velocity=0;dolly.last=performance.now()}});
