(()=>{
  const panels=[...document.querySelectorAll('.spatialPanel')];
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const active=new Map();let lastPanel=-1,candidate=-1,settledAt=0,replay=false;
  panels.forEach(panel=>{
    const surface=document.createElement('div');surface.className='holoSurface';
    while(panel.firstChild)surface.append(panel.firstChild);
    panel.append(surface);
    const frame=document.createElementNS('http://www.w3.org/2000/svg','svg');frame.setAttribute('viewBox','0 0 540 410');frame.setAttribute('preserveAspectRatio','none');frame.setAttribute('aria-hidden','true');frame.classList.add('assemblyFrame');
    frame.innerHTML='<path class="frameTrace" pathLength="1" d="M270 1 H518 L539 22 V409 H22 L1 388 V1 H270"/><path class="frameCross" pathLength="1" d="M1 205H539 M270 1V409"/><path class="frameBrackets" d="M1 42V1H42 M498 1H518L539 22V42 M539 368V409H498 M42 409H22L1 388V368"/>';
    const scan=document.createElement('div');scan.className='assemblyScan';scan.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.className='assemblyLabel';label.setAttribute('aria-hidden','true');label.textContent='PROJECTING / PERSONAL ARCHIVE';
    panel.append(frame,scan,label);
  });
  function clear(panel){clearTimeout(active.get(panel));active.delete(panel);panel.classList.remove('holoBuilding')}
  function assemble(i){
    if(reducedMotion.matches||!panels[i])return;
    panels.forEach(clear);const panel=panels[i];panel.classList.remove('holoPending');
    panel.classList.add('holoBuilding');
    active.set(panel,setTimeout(()=>clear(panel),1850));
  }
  function prepare(i){panels.forEach((p,j)=>p.classList.toggle('holoPending',!reducedMotion.matches&&j===i))}
  prepare(0);
  const oldGo=go;go=function(...args){oldGo(...args);prepare(index);replay=true;candidate=-1;settledAt=0};
  const oldNavigate=navigate;navigate=function(...args){oldNavigate(...args);let nearest=0;positions.forEach((p,i)=>{if(Math.hypot(p.x-target.x,p.y-target.y)<Math.hypot(positions[nearest].x-target.x,positions[nearest].y-target.y))nearest=i});if(nearest!==lastPanel)prepare(nearest)};
  function inspect(){
    if(document.hidden||document.getElementById('bootSequence')||document.querySelector('dialog[open]'))return;
    const now=performance.now();let nearest=0;
    positions.forEach((p,i)=>{if(Math.hypot(p.x-view.x,p.y-view.y)<Math.hypot(positions[nearest].x-view.x,positions[nearest].y-view.y))nearest=i});
    const distance=Math.hypot(positions[nearest].x-view.x,positions[nearest].y-view.y)*view.z;
    const speed=Math.hypot(rig.vx,rig.vy)*view.z;
    if(distance>450||overview){panels.forEach(p=>p.classList.remove('holoPending'));candidate=-1;settledAt=0;return}
    if(speed>150){candidate=-1;settledAt=0;return}
    if(candidate!==nearest){candidate=nearest;settledAt=now;return}
    if(now-settledAt<180)return;
    if(nearest!==lastPanel||replay){lastPanel=nearest;replay=false;assemble(nearest)}
  }
  const interval=setInterval(inspect,100);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)panels.forEach(clear)});
  window.addEventListener('pagehide',()=>{clearInterval(interval);panels.forEach(clear)});
})();
