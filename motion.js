// Time-based, critically damped camera rig shared by every input method.
const rig={vx:0,vy:0,vz:0,last:0};
// Disable native text/image/link dragging on the HUD, preserving form editing.
function editingTarget(node){return node instanceof Element&&Boolean(node.closest('input,textarea,[contenteditable="true"]'))}
document.addEventListener('dragstart',event=>{if(!editingTarget(event.target))event.preventDefault()});
document.addEventListener('selectstart',event=>{if(!editingTarget(event.target))event.preventDefault()});
document.addEventListener('selectionchange',()=>{
  const selection=window.getSelection();
  if(selection&&!selection.isCollapsed&&!editingTarget(document.activeElement))selection.removeAllRanges();
});
document.addEventListener('copy',event=>{if(!editingTarget(document.activeElement))event.preventDefault()},true);
document.addEventListener('keydown',event=>{
  if(!editingTarget(event.target)&&(event.ctrlKey||event.metaKey)&&['a','c','x'].includes(event.key.toLowerCase()))event.preventDefault();
},true);
$('#viewport').addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&!event.target.closest('button,input,textarea,a,[contenteditable="true"]'))event.preventDefault();
});
function springAxis(position,velocity,destination,dt,omega=3.8){
  const offset=position-destination,impulse=velocity+omega*offset,decay=Math.exp(-omega*dt);
  return [destination+(offset+impulse*dt)*decay,(velocity-omega*impulse*dt)*decay];
}
animateWorld=function(now=performance.now()){
  const dt=rig.last?Math.min((now-rig.last)/1000,.05):1/60;rig.last=now;
  for(const axis of ['x','y','z']){
    if(reduced){view[axis]=target[axis];rig['v'+axis]=0}
    else [view[axis],rig['v'+axis]]=springAxis(view[axis],rig['v'+axis],target[axis],dt,axis==='z'?3.3:3.8);
  }
  const renderZoom=view.z*(typeof cameraDolly==='function'?cameraDolly(now):1);
  const tiltX=reduced?0:Math.max(-1.8,Math.min(1.8,rig.vy*.003));
  const tiltY=reduced?0:Math.max(-2.2,Math.min(2.2,-rig.vx*.003));
  $('#world').style.transform=`perspective(1600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate(${-view.x*renderZoom}px,${-view.y*renderZoom}px) scale(${renderZoom})`;
  $('#space').style.transform=`translate(${(-view.x*.028)%70}px,${(-view.y*.028)%70}px) scale(1.25)`;
  $('#worldCoords').textContent=`X ${Math.round(view.x).toString().padStart(4,' ')} / Y ${Math.round(view.y).toString().padStart(4,' ')} / Z ${Math.round(renderZoom*100)}%`;
  requestAnimationFrame(animateWorld);
};
// Direction commands pan freely; they do not select or rebuild any panel.
navigate=function(direction){
  if(direction==='center'){go(0);return}
  overview=false;
  const step=1/target.z;
  const nextX=target.x+(direction==='left'?-500:direction==='right'?500:0)*step;
  const nextY=target.y+(direction==='up'?-380:direction==='down'?380:0)*step;
  if(Number.isFinite(nextX)&&Number.isFinite(nextY)){target.x=nextX;target.y=nextY}
  $('#signal').textContent='GLIDING / '+direction.toUpperCase();
  $('#chapter').textContent='SPATIAL EXPLORATION / FREE FLIGHT';
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
  status(direction.toUpperCase()+' · 관성 이동 중 / “stop”으로 부드럽게 정지');
};
function brake(){target.x=view.x+rig.vx*.12;target.y=view.y+rig.vy*.12;target.z=view.z;status('STOP · 천천히 정지합니다.');$('#signal').textContent='STABILIZING'}
function zoomBy(factor,clientX=innerWidth/2,clientY=innerHeight/2-4){
  const next=target.z*factor;
  // Keep only arithmetic validity checks; there is no product zoom limit.
  if(!(next>0)||!Number.isFinite(next)||!Number.isFinite(1/next))return;
  const offsetX=clientX-innerWidth/2,offsetY=clientY-(innerHeight/2-4);
  const x=target.x+offsetX*(1/target.z-1/next),y=target.y+offsetY*(1/target.z-1/next);
  if(!Number.isFinite(x)||!Number.isFinite(y))return;
  target.x=x;target.y=y;target.z=next;overview=false;
  $('#signal').textContent='INFINITE SPACE / ZOOM';
}
$('#viewport').addEventListener('wheel',event=>{
  event.preventDefault();
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  // Normalize individual wheel events without bounding cumulative zoom.
  zoomBy(Math.exp(-Math.max(-500,Math.min(500,delta))*.0015),event.clientX,event.clientY);
},{passive:false});
function command(transcript){
  const input=transcript.toLowerCase().replace(/[^a-z가-힣\s]/g,' ').trim();
  const matches=input.match(/\b(up|down|left|right|stop|center|home|overview|map|zoom in|zoom out)\b|업|다운|레프트|라이트|스톱|왼쪽|오른쪽|위로|아래로|중앙|전체|확대|축소/g);
  if(!matches){status('인식: '+transcript+' · “up, down, left, right”라고 말해 주세요.');return}
  for(const word of matches){const direction=({up:'up',업:'up',위로:'up',down:'down',다운:'down',아래로:'down',left:'left',레프트:'left',왼쪽:'left',right:'right',라이트:'right',오른쪽:'right'})[word];
    if(direction)navigate(direction);
    else if(/^(stop|스톱)$/.test(word))brake();
    else if(/^(center|home|중앙)$/.test(word))go(0);
    else if(/^(overview|map|전체)$/.test(word))map();
    else if(/^(zoom in|확대)$/.test(word))zoomBy(1.3);
    else if(/^(zoom out|축소)$/.test(word))zoomBy(1/1.3);
  }
}
let voiceEpoch=0,restartTimer;
$('#mic').onclick=()=>{
  if(micOn){micOn=false;voiceEpoch++;clearTimeout(restartTimer);recognition?.abort();updateMic();status('음성 연결을 해제했습니다.');return}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){status('음성 인식을 지원하는 Chrome 또는 Edge에서 연결해 주세요.');return}
  const epoch=++voiceEpoch;recognition=new SR();const rec=recognition;
  rec.lang='en-US';rec.continuous=true;rec.interimResults=true;
  let consumed=new Set();
  rec.onstart=()=>{consumed.clear();if(epoch!==voiceEpoch)return;status('VOICE ONLINE · “up / down / left / right” · “stop”으로 정지');$('#signal').textContent='VOICE LINK / ENGLISH'};
  rec.onresult=e=>{if(epoch!==voiceEpoch)return;for(let i=e.resultIndex;i<e.results.length;i++){
    if(consumed.has(i))continue;
    const text=e.results[i][0].transcript;
    // Respond before end-of-speech only to an unambiguous single command.
    if(e.results[i].isFinal||/^(up|down|left|right|stop|center|home|overview|map|zoom in|zoom out)[.!?]?$/i.test(text.trim())){consumed.add(i);command(text)}
  }};
  rec.onerror=e=>{if(epoch!==voiceEpoch)return;if(e.error==='no-speech')return;micOn=false;voiceEpoch++;updateMic();status('음성 연결 중단: '+e.error+' · 마이크 권한과 네트워크를 확인해 주세요.')};
  rec.onend=()=>{if(!micOn||epoch!==voiceEpoch)return;restartTimer=setTimeout(()=>{if(!micOn||epoch!==voiceEpoch||document.hidden)return;try{rec.start()}catch{micOn=false;updateMic();status('음성 연결이 종료되었습니다. 다시 연결해 주세요.')}},250)};
  try{micOn=true;updateMic();rec.start();status('마이크 권한을 허용한 후 영어로 “up, down, left, right”라고 말하세요.')}
  catch{micOn=false;updateMic();status('마이크 연결을 시작하지 못했습니다. 다시 연결해 주세요.')}
};
document.addEventListener('visibilitychange',()=>{if(document.hidden){micOn=false;voiceEpoch++;clearTimeout(restartTimer);recognition?.abort();updateMic();rig.last=0}});
window.addEventListener('pagehide',()=>{micOn=false;voiceEpoch++;clearTimeout(restartTimer)});
const voiceGuide=$('#guide');
voiceGuide.innerHTML=voiceGuide.innerHTML.replace('“왼쪽”, “오른쪽”, “위로”, “아래로”, “전체”, “중앙”, “확대”, “축소” 또는 섹션 이름','영어로 “up”, “down”, “left”, “right”. “stop”으로 정지, “center”로 중앙, “overview”로 전체, “zoom in / zoom out”으로 확대·축소');
voiceGuide.querySelector('.close').onclick=()=>voiceGuide.close();
const zoomGuide=document.createElement('p');zoomGuide.textContent='휠을 위로 돌리면 확대, 아래로 돌리면 축소합니다. 마우스가 가리키는 곳을 중심으로 부드럽게 줌하며 이동·줌에 고정 범위 제한이 없습니다. 콘텐츠는 기존 다섯 패널이며, 멀어졌다면 “내 위치로”로 돌아올 수 있습니다.';voiceGuide.append(zoomGuide);
const prompt=document.createElement('div');prompt.className='voiceCompass';prompt.innerHTML='<span>↑ UP</span><span>← LEFT <i>◎</i> RIGHT →</span><span>↓ DOWN</span><small>SAY IT. GLIDE THROUGH.</small>';$('#viewport').append(prompt);
$('#home').textContent='내 위치로';
$('#home').setAttribute('aria-label','내 위치로 돌아오기');
$('#home').onclick=()=>go(0);
voiceGuide.innerHTML=voiceGuide.innerHTML.replace(/<p><b>드래그 \/ 터치<\/b>.*?<\/p>/,'<p><b>키보드 방향키</b>로 상하좌우 이동합니다. 화면의 <b>내 위치로</b> 버튼을 누르면 중앙 소개 위치로 부드럽게 돌아옵니다.</p>');
voiceGuide.querySelector('.close').onclick=()=>voiceGuide.close();
$('#viewport').addEventListener('keydown',e=>{if(e.key===' '&&e.target===$('#viewport')){e.preventDefault();brake()}});
go(0);
status('휠로 자유롭게 확대·축소 · 키보드 방향키로 무제한 이동 · “내 위치로” 중앙 복귀');
