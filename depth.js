(()=>{
  const backgroundSpeed=1.4;
  const minimal=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay=document.getElementById('bootSequence');
  const bootCanvas=document.createElement('canvas');bootCanvas.className='bootVolume';bootCanvas.setAttribute('aria-hidden','true');overlay?.prepend(bootCanvas);
  const scene=document.createElement('canvas');scene.id='depthField';scene.setAttribute('aria-hidden','true');document.body.append(scene);
  const hud=document.createElement('div');hud.id='vectorHUD';hud.setAttribute('aria-hidden','true');hud.innerHTML='<span class="vectorMode">SPATIAL CORE / STANDBY</span><div class="vectorTrack"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="vectorDetail">AWAITING VECTOR</span>';document.getElementById('viewport').append(hud);
  let pulse=0,vector='STANDBY',last=performance.now(),elapsed=0;
  const baseNavigate=navigate;navigate=function(direction){if(document.body.classList.contains('booting'))return;baseNavigate(direction);pulse=1;vector=direction.toUpperCase()};
  const baseZoom=zoomBy;zoomBy=function(...args){if(document.body.classList.contains('booting'))return;baseZoom(...args);pulse=1;vector=args[0]>1?'APPROACH':'WITHDRAW'};
  const baseGo=go;go=function(...args){baseGo(...args);pulse=1;vector='RETURN / LOCK'};
  const panels=[...document.querySelectorAll('.spatialPanel')];
  const stars=Array.from({length:180},()=>({x:Math.random()*3200-1600,y:Math.random()*2200-1100,z:Math.random()*1700+100}));
  function fit(canvas){const ratio=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(innerWidth*ratio)||canvas.height!==Math.round(innerHeight*ratio)){canvas.width=Math.round(innerWidth*ratio);canvas.height=Math.round(innerHeight*ratio)}const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);return ctx}
  function rotate(point,rx,ry,rz){let [x,y,z]=point;let a=y*Math.cos(rx)-z*Math.sin(rx),b=y*Math.sin(rx)+z*Math.cos(rx);y=a;z=b;a=x*Math.cos(ry)+z*Math.sin(ry);b=-x*Math.sin(ry)+z*Math.cos(ry);x=a;z=b;return [x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz),z]}
  function drawCore(time){if(!overlay?.isConnected||overlay.classList.contains('bootExit'))return;
    const ctx=fit(bootCanvas),bounds=document.querySelector('.bootCore').getBoundingClientRect();
    const cx=bounds.x+bounds.width/2,cy=bounds.y+bounds.height/2;
    const r=Math.min(bounds.width*.49,170),camera=650;
    const project=p=>{const k=camera/(camera-p[2]);return [cx+p[0]*k,cy+p[1]*k,k]};
    const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.8);glow.addColorStop(0,'#b2fff344');glow.addColorStop(.35,'#26e4c91a');glow.addColorStop(1,'#00ffc000');ctx.fillStyle=glow;ctx.fillRect(0,0,innerWidth,innerHeight);
    const angle=minimal?.4:time*.28;
    function line(points,color,width=1){ctx.beginPath();points.forEach((p,i)=>{const q=project(p);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
    for(let lat=-4;lat<=4;lat++){const phi=lat*Math.PI/10;const points=[];for(let j=0;j<=80;j++){const t=j/80*Math.PI*2;points.push(rotate([r*.68*Math.cos(phi)*Math.cos(t),r*.68*Math.sin(phi),r*.68*Math.cos(phi)*Math.sin(t)],.35,angle,.12))}line(points,'#65e8db5c',.7)}
    for(let m=0;m<12;m++){const points=[];for(let j=0;j<=64;j++){const t=j/64*Math.PI*2;points.push(rotate([r*.68*Math.cos(t)*Math.cos(m*Math.PI/12),r*.68*Math.sin(t),r*.68*Math.cos(t)*Math.sin(m*Math.PI/12)],.35,angle,.12))}line(points,'#a1fff33b',.7)}
    for(let orbit=0;orbit<4;orbit++){const points=[],radius=r*(1.02+orbit*.14);for(let j=0;j<=120;j++){const t=j/120*Math.PI*2;points.push(rotate([Math.cos(t)*radius,Math.sin(t)*radius,0],.9+orbit*.37,angle*(orbit%2?-.6:.7)+orbit,.2+orbit*.5))}line(points,orbit%2?'#75fff3b0':'#47b6bf80',orbit===0?1.8:1);for(let j=0;j<3;j++){const t=time*(.4+orbit*.15)+j*2.1;const p=project(rotate([Math.cos(t)*radius,Math.sin(t)*radius,0],.9+orbit*.37,angle*(orbit%2?-.6:.7)+orbit,.2+orbit*.5));ctx.beginPath();ctx.arc(p[0],p[1],2.2*p[2],0,Math.PI*2);ctx.fillStyle='#c4fff8';ctx.shadowColor='#65ffe4';ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0}}
    for(let i=0;i<85;i++){const phi=Math.acos(1-2*(i+.5)/85),theta=i*2.39996;const p=project(rotate([r*.9*Math.sin(phi)*Math.cos(theta),r*.9*Math.cos(phi),r*.9*Math.sin(phi)*Math.sin(theta)],angle*.4,-angle*.7,.1));ctx.fillStyle='#b3fffaa0';ctx.fillRect(p[0],p[1],1.2*p[2],1.2*p[2])}
    const hot=ctx.createRadialGradient(cx,cy,0,cx,cy,r*.22);hot.addColorStop(0,'#e4fffc');hot.addColorStop(.12,'#b9fff5d0');hot.addColorStop(.45,'#37e9d350');hot.addColorStop(1,'#39e5de00');ctx.fillStyle=hot;ctx.beginPath();ctx.arc(cx,cy,r*.22,0,Math.PI*2);ctx.fill();
    // A perspective floor makes the core read as a volume suspended in space.
    const horizon=cy+r*1.9;ctx.strokeStyle='#2c7b7d45';ctx.lineWidth=.6;
    for(let i=-8;i<=8;i++){ctx.beginPath();ctx.moveTo(cx+i*22,horizon-35);ctx.lineTo(cx+i*180,innerHeight);ctx.stroke()}
    for(let i=0;i<7;i++){const y=horizon+Math.pow(i/6,2)*(innerHeight-horizon);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(innerWidth,y);ctx.stroke()}
  }
  function drawScene(dt,time){const sceneZoom=view.z*(typeof cameraDolly==='function'?cameraDolly():1);const ctx=fit(scene),cx=innerWidth/2,cy=innerHeight/2;const speed=Math.min(1,Math.hypot(rig.vx,rig.vy)*view.z/1000);pulse=Math.max(0,pulse-dt*.75);const energy=Math.max(speed,pulse*.65);
    if(typeof cityScene!=='undefined')cityScene.draw(ctx,dt*backgroundSpeed,energy,time*backgroundSpeed);
    const parallaxX=((view.x*.22)%3200+3200)%3200,parallaxY=((view.y*.22)%2200+2200)%2200;
    for(const s of stars){if(!minimal)s.z-=dt*backgroundSpeed*(14+energy*150);if(s.z<40)s.z+=1700;const k=650/(s.z+350),x=((((s.x-parallaxX)+1600)%3200+3200)%3200-1600)*k+cx,y=((((s.y-parallaxY)+1100)%2200+2200)%2200-1100)*k+cy;const trail=minimal?0:energy*12*k;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rig.vx*view.z*.0008*k+trail*(x-cx)/innerWidth,y+rig.vy*view.z*.0008*k+trail*(y-cy)/innerHeight);ctx.strokeStyle=`rgba(113,239,223,${.1+k*.4})`;ctx.lineWidth=Math.max(.5,k);ctx.stroke()}
    if(typeof cityScene==='undefined'){ const horizon=innerHeight*.58;ctx.strokeStyle='#2c757b30';ctx.lineWidth=.7;const scroll=((view.x*.05)%80+80)%80;
    for(let i=-12;i<=12;i++){ctx.beginPath();ctx.moveTo(cx+(i*80-scroll)*.2,horizon);ctx.lineTo(cx+(i*80-scroll)*2.2,innerHeight);ctx.stroke()}
    for(let i=0;i<8;i++){const f=(i+((view.y*.001)%1+1)%1)/8;const y=horizon+f*f*(innerHeight-horizon);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(innerWidth,y);ctx.stroke()}
    }
    const yaw=minimal?0:Math.max(-7,Math.min(7,-rig.vx*view.z*.01)),pitch=minimal?0:Math.max(-5,Math.min(5,rig.vy*view.z*.008));
    document.getElementById('world').style.transform=`perspective(1400px) rotateX(${pitch}deg) rotateY(${yaw}deg) translate(${-view.x*sceneZoom}px,${-view.y*sceneZoom}px) scale(${sceneZoom})`;
    panels.forEach((panel,i)=>{const p=positions[i],distance=Math.hypot(p.x-view.x,p.y-view.y);const near=distance<360;const drift=minimal?0:Math.sin(time*.55+i)*3;const side=i===1?7:i===2?-7:0;panel.style.setProperty('transform',`perspective(1800px) translate3d(${yaw*(i-2)*.6}px,${drift}px,0) rotateY(${side+yaw*.35}deg) rotateX(${pitch*.3}deg)`,'important');panel.classList.toggle('aiLocked',near&&energy<.3);panel.style.setProperty('--energy',energy.toFixed(3))});
    hud.classList.toggle('vectorActive',energy>.08);hud.querySelector('.vectorMode').textContent=energy>.08?'NAVIGATION / '+vector:'SPATIAL CORE / STABLE';hud.querySelector('.vectorDetail').textContent=energy>.08?'VECTOR TRACKING · '+Math.round(energy*100)+'%':'POSITION LOCKED';hud.style.setProperty('--pulse',energy.toFixed(3));
    document.body.style.setProperty('--flight',energy.toFixed(3));
  }
  function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=document.hidden?0:dt;if(!document.hidden){drawCore(elapsed);drawScene(minimal?0:dt,elapsed)}requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();
