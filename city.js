// Project a continuously recycled city of solid 3D buildings into the HUD backdrop.
const cityScene=(()=>{
  let seed=8247;
  const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  const blocks=[];let distance=0;
  for(let row=0;row<13;row++)for(let lane=0;lane<10;lane++){
    const width=110+random()*90,depth=120+random()*90,height=70+random()*180+(random()>.85?180:0);
    blocks.push({x:(lane-4.5)*280+random()*20,z:100+row*300+random()*30,width,depth,height,seed:random()*1000,spire:random()>.7,warm:random()>.8});
  }
  function draw(ctx,dt,energy,time){
    const reducedCity=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const advance=reducedCity?0:dt*(18+energy*35);distance+=advance;
    const width=innerWidth,height=innerHeight,horizon=height*.58;
    const lens=Math.min(width*1.2,1850)*Math.max(.72,Math.min(1.35,Math.pow(Math.max(view.z,.0001),.13)));
    const shiftX=Math.sin(view.x*.0005)*190,shiftY=Math.sin(view.y*.00045)*65;
    const yaw=.48+Math.sin(time*.018)*.04+Math.sin(view.x*.0004)*.08;
    const cx=width/2,cy=height*.61-shiftY;
    function project(x,y,z){const dx=x-shiftX,dz=z-2000,rx=dx*Math.cos(yaw)-dz*Math.sin(yaw),rz=dx*Math.sin(yaw)+dz*Math.cos(yaw);const depth=4400+rz*Math.sin(.92)-y*Math.cos(.92),k=lens/Math.max(700,depth);return{x:cx+rx*k,y:cy+(rz*Math.cos(.92)-y*Math.sin(.92))*k,k,depth}}
    function face(points,fill,edge){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=.65;ctx.stroke()}
    const haze=ctx.createRadialGradient(cx,cy,10,cx,cy,width*.7);haze.addColorStop(0,'#1e68642b');haze.addColorStop(.45,'#134c5513');haze.addColorStop(1,'#06141a00');ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
    // A visible ground plane, street blocks and shadows anchor every building.
    face([project(-1650,0,0),project(1650,0,0),project(1650,0,4100),project(-1650,0,4100)],'#081a22','#38555b66');
    for(let col=0;col<10;col++)for(let row=0;row<14;row++){
      const x=(col-4.5)*280,z=30+((row*300-distance%300+4200)%4200);
      face([project(x-120,1,z),project(x+120,1,z),project(x+120,1,z+245),project(x-120,1,z+245)],'#12272f','#46616b55');
    }
    blocks.forEach(b=>{b.z-=advance;if(b.z<30)b.z+=3900});
    // Painter's order: distant buildings first, then the ones passing the camera.
    const ordered=[...blocks].sort((a,b)=>project(b.x,0,b.z).depth-project(a.x,0,a.z).depth);
    for(const b of ordered){
      const x0=b.x-b.width/2,x1=b.x+b.width/2,z0=b.z,z1=b.z+b.depth;
      const a=project(x0,0,z0),c=project(x1,0,z0),d=project(x1,b.height,z0),e=project(x0,b.height,z0);
      const ab=project(x0,0,z1),cb=project(x1,0,z1),db=project(x1,b.height,z1),eb=project(x0,b.height,z1);
      if(Math.max(a.x,c.x,ab.x,cb.x)<-80||Math.min(a.x,c.x,ab.x,cb.x)>width+80)continue;
      const fog=Math.min(1,Math.max(.08,1-z0/16000)),fade=Math.min(1,(z0-30)/170,(3930-z0)/170),alpha=Math.max(0,fog*fade);
      ctx.save();ctx.globalAlpha=Math.max(0,fade)*.93; face([project(x0+15,2,z0+15),project(x1+60,2,z0+15),project(x1+80,2,z1+65),project(x0+45,2,z1+65)],'#00000055',null);
      const edge=`rgba(130,163,174,${.32+fog*.35})`;
      face([a,ab,eb,e],'#18313d',edge);
      
      face([a,c,d,e],'#213d48',edge); face([e,d,db,eb],b.warm?'#455253':'#38515b','#91abb28c');
      // Stable lit windows are mapped to each facade, never randomly flickered.
      const columns=Math.max(2,Math.floor(b.width/25)),rows=Math.max(3,Math.floor(b.height/32));
      if(c.x-a.x>6){
        const winWidth=(c.x-a.x)/columns*.32,winHeight=(a.y-e.y)/rows*.2;
        for(let r=1;r<rows;r++)for(let col=0;col<columns;col++){
          if(Math.sin(b.seed+r*17.3+col*39.1)<.15)continue;
          const windowPoint=project(x0+(col+.35)/columns*b.width,b.height*(1-r/rows),z0-.3),wx=windowPoint.x,wy=windowPoint.y;
          ctx.fillStyle=b.warm?'#c5a97586':'#69bfc18c';ctx.fillRect(wx,wy,Math.max(.65,3*windowPoint.k),Math.max(.55,4*windowPoint.k));
        }
      }
      // Roof edge lights and antennae provide silhouette and depth cues.
      ctx.strokeStyle='#78e5d58c';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(d.x,d.y);ctx.stroke();
      if(b.spire){const bottom=project(b.x,b.height,z0+b.depth/2),top=project(b.x,b.height+75,z0+b.depth/2);ctx.strokeStyle='#70cfc67c';ctx.beginPath();ctx.moveTo(bottom.x,bottom.y);ctx.lineTo(top.x,top.y);ctx.stroke();ctx.fillStyle='#a6fff0';ctx.fillRect(top.x-1,top.y-1,2,2)}
      ctx.restore();
    }
    // Road network across the oblique aerial map.
    ctx.strokeStyle='#71858a55';ctx.lineWidth=.8;
    function road(x0,z0,x1,z1){const a=project(x0,0,z0),b=project(x1,0,z1);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
    for(let col=-1;col<=10;col++){const x=(col-4.5)*280-65;road(x,50,x,3930)}
    for(let row=0;row<14;row++){const z=40+((row*300-distance%300+4200)%4200);road(-1550,z,1550,z)}
    for(let i=0;i<15;i++){
      const z=50+((i*271-distance*(i%2?1.5:-1.5)+39000)%3850),lane=((i%10)-4.5)*280-65;
      const a=project(lane,5,z),b=project(lane,5,z+16);
      ctx.strokeStyle=i%3?'#a2cacb90':'#d0b47790';ctx.lineWidth=Math.max(.8,3*a.k);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    // A central vignette keeps profile text readable without hiding the skyline.
    const vignette=ctx.createRadialGradient(width/2,height*.45,30,width/2,height*.45,width*.48);vignette.addColorStop(0,'#030e1430');vignette.addColorStop(.7,'#030e1400');vignette.addColorStop(1,'#030e1400');ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
  }
  return {draw};
})();
