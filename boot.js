(()=>{
  const overlay=document.getElementById('bootSequence');
  if(!overlay)return;
  let finished=false;
  const timers=[];
  const hiddenSurfaces=[...document.querySelectorAll('header,main,aside,footer')];
  const originalInert=hiddenSurfaces.map(n=>n.inert);
  hiddenSurfaces.forEach(n=>n.inert=true);
  const skip=document.getElementById('bootSkip');
  function finish(){
    if(finished)return;finished=true;timers.forEach(clearTimeout);
    const restoreFocus=overlay.contains(document.activeElement);
    document.body.classList.remove('booting');overlay.classList.add('bootExit');overlay.setAttribute('aria-hidden','true');overlay.inert=true;
    hiddenSurfaces.forEach((n,i)=>n.inert=originalInert[i]);
    if(restoreFocus)document.getElementById('viewport')?.focus({preventScroll:true});
    document.removeEventListener('keydown',escape);
    timers.push(setTimeout(()=>overlay.remove(),800));
  }
  function escape(event){if(event.key==='Escape'){event.preventDefault();finish()}}
  skip.addEventListener('click',finish);document.addEventListener('keydown',escape);
  const steps=[
    [0,'인터페이스를 깨우는 중',8,'POWER ON'],
    [650,'홀로그램 코어 활성화',29,'CORE ONLINE'],
    [1500,'개인 아카이브 연결',56,'ARCHIVE LINK'],
    [2350,'공간 인터페이스 동기화',82,'SPATIAL SYNC'],
    [3200,'준비되었습니다. 당신의 이야기를 시작합니다.',100,'SYSTEM READY']
  ];
  const minimal=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(minimal){finish();return}
  steps.forEach(([delay,message,percent,label])=>timers.push(setTimeout(()=>{
    document.getElementById('bootStatus').textContent=message;
    document.getElementById('bootBar').style.width=percent+'%';
    document.getElementById('bootPercent').textContent=String(percent).padStart(3,'0')+'%';
    document.getElementById('bootPhase').textContent=label;
    if(percent===100)overlay.classList.add('bootReady');
  },delay)));
  timers.push(setTimeout(finish,4100));
})();
