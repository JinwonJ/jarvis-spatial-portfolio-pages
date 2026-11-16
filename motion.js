// Time-based, critically damped camera rig shared by every input method.
const rig={vx:0,vy:0,vz:0,last:0};
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
  const tiltX=reduced?0:Math.max(-1.8,Math.min(1.8,rig.vy*.003));
  const tiltY=reduced?0:Math.max(-2.2,Math.min(2.2,-rig.vx*.003));
  $('#world').style.transform=`perspective(1600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate(${-view.x*view.z}px,${-view.y*view.z}px) scale(${view.z})`;
  $('#space').style.transform=`translate(${-view.x*.028}px,${-view.y*.028}px) scale(1.12)`;
  $('#worldCoords').textContent=`X ${Math.round(view.x).toString().padStart(4,' ')} / Y ${Math.round(view.y).toString().padStart(4,' ')} / Z ${Math.round(view.z*100)}%`;
  requestAnimationFrame(animateWorld);
};
// Direction commands pan freely; they do not select or rebuild any panel.
navigate=function(direction){
  if(direction==='center'){go(0);return}
  overview=false;
  target.x=Math.max(-1100,Math.min(1100,target.x+(direction==='left'?-600:direction==='right'?600:0)));
  target.y=Math.max(-850,Math.min(850,target.y+(direction==='up'?-470:direction==='down'?470:0)));
  $('#signal').textContent='GLIDING / '+direction.toUpperCase();
  $('#chapter').textContent='SPATIAL EXPLORATION / FREE FLIGHT';
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
  status(direction.toUpperCase()+' · 관성 이동 중 / “stop”으로 부드럽게 정지');
};
function brake(){target.x=view.x+rig.vx*.12;target.y=view.y+rig.vy*.12;target.z=view.z;status('STOP · 천천히 정지합니다.');$('#signal').textContent='STABILIZING'}
function command(transcript){
  const input=transcript.toLowerCase().replace(/[^a-z가-힣\s]/g,' ').trim();
  const matches=input.match(/\b(up|down|left|right|stop|center|home|overview|map|zoom in|zoom out)\b|업|다운|레프트|라이트|스톱|왼쪽|오른쪽|위로|아래로|중앙|전체|확대|축소/g);
  if(!matches){status('인식: '+transcript+' · “up, down, left, right”라고 말해 주세요.');return}
  for(const word of matches){const direction=({up:'up',업:'up',위로:'up',down:'down',다운:'down',아래로:'down',left:'left',레프트:'left',왼쪽:'left',right:'right',라이트:'right',오른쪽:'right'})[word];
    if(direction)navigate(direction);
    else if(/^(stop|스톱)$/.test(word))brake();
    else if(/^(center|home|중앙)$/.test(word))go(0);
    else if(/^(overview|map|전체)$/.test(word))map();
    else if(/^(zoom in|확대)$/.test(word))target.z=Math.min(1.6,target.z*1.3);
    else if(/^(zoom out|축소)$/.test(word))target.z=Math.max(.14,target.z/1.3);
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
const prompt=document.createElement('div');prompt.className='voiceCompass';prompt.innerHTML='<span>↑ UP</span><span>← LEFT <i>◎</i> RIGHT →</span><span>↓ DOWN</span><small>SAY IT. GLIDE THROUGH.</small>';$('#viewport').append(prompt);
const stopButton=document.createElement('button');stopButton.textContent='STOP ◼';stopButton.onclick=brake;stopButton.title='관성 이동 정지';$('#spaceTools').append(stopButton);
go(0);
status('“up · down · left · right”로 공간을 부드럽게 탐색하세요. 음성 연결 후 사용할 수 있습니다.');
