// Project a continuously recycled city of solid 3D buildings into the HUD backdrop.
const cityScene=(()=>{
  let seed=8247;
  const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  const blocks=[];let distance=0;
  for(let row=0;row<16;row++)for(const side of [-1,1])for(let lane=0;lane<3;lane++){
    const width=80+random()*120,depth=100+random()*160,height=160+random()*640;
    blocks.push({x:side*(320+lane*360+random()*100),z:200+row*390+random()*150,width,depth,height,seed:random()*1000,spire:random()>.7,warm:random()>.8});
  }
  function draw(ctx,dt,energy,time){
    const reducedCity=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const advance=reducedCity?0:dt*(100+energy*170);distance+=advance;
    const width=innerWidth,height=innerHeight,horizon=height*.58;
    const lens=Math.min(width*.9,780)*Math.max(.72,Math.min(1.35,Math.pow(Math.max(view.z,.0001),.13)));
    const shiftX=Math.sin(view.x*.0005)*190,shiftY=Math.sin(view.y*.00045)*65;
    const yaw=Math.max(-.065,Math.min(.065,rig.vx*view.z*.000045));
    const cx=width/2-yaw*width,cy=horizon-shiftY;
    function project(x,y,z){const k=lens/(z+300);return{x:cx+(x-shiftX)*k,y:cy+(225-y)*k,k}}
    function face(points,fill,edge){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=.65;ctx.stroke()}
    const haze=ctx.createRadialGradient(cx,cy,10,cx,cy,width*.7);haze.addColorStop(0,'#1e68642b');haze.addColorStop(.45,'#134c5513');haze.addColorStop(1,'#06141a00');ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
    blocks.forEach(b=>{b.z-=advance;if(b.z<30)b.z+=6400});
    // Painter's order: distant buildings first, then the ones passing the camera.
    const ordered=[...blocks].sort((a,b)=>b.z-a.z);
    for(const b of ordered){
      const x0=b.x-b.width/2,x1=b.x+b.width/2,z0=b.z,z1=b.z+b.depth;
      const a=project(x0,0,z0),c=project(x1,0,z0),d=project(x1,b.height,z0),e=project(x0,b.height,z0);
      const ab=project(x0,0,z1),cb=project(x1,0,z1),db=project(x1,b.height,z1),eb=project(x0,b.height,z1);
      if(Math.max(a.x,c.x,ab.x,cb.x)<-80||Math.min(a.x,c.x,ab.x,cb.x)>width+80)continue;
      const fog=Math.min(1,Math.max(.08,1-z0/7200)),fade=Math.min(1,(z0-30)/150),alpha=Math.max(0,fog*fade);
      ctx.save();ctx.globalAlpha=alpha;
      const edge=`rgba(83,192,184,${.28+fog*.35})`;
      if(b.x>0)face([a,ab,eb,e],'#071f29',edge);else face([c,cb,db,d],'#08232d',edge);
      face([e,d,db,eb],'#12343d',edge);
      face([a,c,d,e],'#0a2631',edge);
      // Stable lit windows are mapped to each facade, never randomly flickered.
      const columns=Math.max(2,Math.floor(b.width/25)),rows=Math.max(3,Math.floor(b.height/32));
      if(c.x-a.x>6){
        const winWidth=(c.x-a.x)/columns*.32,winHeight=(a.y-e.y)/rows*.2;
        for(let r=1;r<rows;r++)for(let col=0;col<columns;col++){
          if(Math.sin(b.seed+r*17.3+col*39.1)<.15)continue;
          const wx=e.x+(col+.35)/columns*(d.x-e.x),wy=e.y+r/rows*(a.y-e.y);
          ctx.fillStyle=b.warm?'#c5a97586':'#69bfc18c';ctx.fillRect(wx,wy,Math.max(.65,winWidth),Math.max(.55,winHeight));
        }
      }
      // Roof edge lights and antennae provide silhouette and depth cues.
      ctx.strokeStyle='#78e5d58c';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(d.x,d.y);ctx.stroke();
      if(b.spire){const bottom=project(b.x,b.height,z0+b.depth/2),top=project(b.x,b.height+75,z0+b.depth/2);ctx.strokeStyle='#70cfc67c';ctx.beginPath();ctx.moveTo(bottom.x,bottom.y);ctx.lineTo(top.x,top.y);ctx.stroke();ctx.fillStyle='#a6fff0';ctx.fillRect(top.x-1,top.y-1,2,2)}
      ctx.restore();
    }
    // Road lines flow toward the viewer at the same speed as the buildings.
    ctx.strokeStyle='#60bfba30';ctx.lineWidth=.8;
    for(const x of [-255,-190,190,255]){const a=project(x,0,100),b=project(x,0,6500);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
    for(let i=0;i<28;i++){const z=60+((i*240-distance%240+6720)%6720);const a=project(-170,0,z),b=project(170,0,z);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
    for(let i=0;i<5;i++){
      const z=200+((i*1300-distance*1.7+65000)%6500),lane=i%2?90:-90;
      const a=project(lane,15,z),b=project(lane,15,z+45);
      ctx.strokeStyle=i%2?'#68e9eaa0':'#d9b68890';ctx.lineWidth=Math.max(1,a.k*2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    // A central vignette keeps profile text readable without hiding the skyline.
    const vignette=ctx.createRadialGradient(width/2,height*.45,30,width/2,height*.45,width*.48);vignette.addColorStop(0,'#030e1430');vignette.addColorStop(.7,'#030e1400');vignette.addColorStop(1,'#030e1400');ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
  }
  return {draw};
})();
