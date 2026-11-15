import hardware from '../../src/content/settings/hardware.json' with { type: 'json' };
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as k from './kit/iso-kit.mjs';
import * as A from './kit/audit.mjs';

// All dimensions are illustration units. Chip counts and silhouettes are
// simplified; these are recognisable instruments, not fabrication drawings.
const W = 640, H = 390;
const BASE = { x: -145, y: -98, w: 290, d: 196, r: 8 };
const P = k.fitProjection(k.boxCorners(BASE, -11, 30), W, H, { pad: 42, azimuth: 35, elevation: 38 });
const at = (x, y, z) => k.iso([x, y, z], P);
const R = A.recorder(P);
const line = (d, tone = 'lo') => k.lineSvg(d, { tone });
const dots = (points, size = .5, tone = 'mid') => k.dotsSvg(points, { size, tone });
const items = [];

function slab(id, device, x, y, w, d, z, h, { tone = 'mid', cls = '', inner = '', r = .5, bevel = .25 } = {}) {
  const plan = { x, y, w, d, r };
  const shape = R.solid(A.slab(plan, z, h, { name: id, owner: id, ground: id.startsWith('stand.') }));
  const svg = k.solidSvg(k.slabOf(plan, z, h, P, 5, bevel), { tone, inner, className: cls });
  const item = R.put({ name: id, piece: device, at: [x + w / 2, y + d / 2, z + h / 2], shapes: [shape], svg });
  items.push(item);
  return z + h;
}

function screws(plan, z) {
  return k.corners(plan, 3).map(([x,y]) => line(k.ring(x,y,1.15,z,P,16),'lo') + dots([at(x,y,z)], .4, 'hi')).join('');
}

function chip(id, device, x, y, w, d, z, h = 2.6, active = false) {
  const pad = .85;
  let contacts = '';
  for (let i = 2; i < Math.min(w, d) - 1; i += 2) {
    for (const [px, py, pw, pd] of [[x+i,y-pad,.7,pad],[x+i,y+d,.7,pad],[x-pad,y+i,pad,.7],[x+w,y+i,pad,.7]]) {
      contacts += `<path class="hardware-pad" d="${k.planOutline({x:px,y:py,w:pw,d:pd,r:.1},z,P,2)}"/>`;
    }
  }
  slab(id + '.pads', device, x-pad, y-pad, w+pad*2, d+pad*2, z, .15, { tone:'faint', cls:'solder-mask', inner:contacts, bevel:0 });
  return slab(id, device, x, y, w, d, z+.15, h, { tone:'hi', cls: active ? 'radio-chip' : 'ic', inner:dots([at(x+1.4,y+1.4,z+.15+h)],.55,'hi') });
}

function antenna(x, y, w, d, z) {
  const outline = k.planOutline({x,y,w,d,r:.4},z,P,3);
  const points = [[x+2,y+d],[x+2,y+2],[x+6,y+2],[x+6,y+d-2],[x+10,y+d-2],[x+10,y+2],[x+14,y+2],[x+14,y+d],[x+2,y+d]];
  return line(outline,'faint') + line(k.onTop(points,z,P,true),'mid');
}

function header(id,x,y,w,d,count,along='y') {
  let sockets='';
  for(let i=0;i<count;i++) {
    const px=x+(along==='x'?2+i*(w-4)/(count-1):w/2), py=y+(along==='y'?2+i*(d-4)/(count-1):d/2);
    sockets+=`<path class="hardware-socket" d="${k.planOutline({x:px-.65,y:py-.65,w:1.3,d:1.3,r:.1},19,P,2)}"/>`;
  }
  slab(id,'dk',x,y,w,d,13,6,{tone:'hi',cls:'connector',inner:sockets,r:.4});
}

function usb(id,device,x,y,w,d,z) {
  // A closed inset on the shell's front face reads as a recessed USB opening.
  const front = k.pathOf([at(x+1,y+d,z+1),at(x+w-1,y+d,z+1),at(x+w-1,y+d,z+3),at(x+1,y+d,z+3)],true);
  return slab(id,device,x,y,w,d,z,4,{tone:'hi',cls:'metal',inner:line(front,'hi'),r:.8,bevel:.4});
}

// Structural plate and feet. Every board rests on real standoffs.
for (const [x,y] of k.corners(BASE,20)) slab(`stand.foot.${x}.${y}`,'stand',x-5,y-5,10,10,-11,5,{r:2,tone:'lo'});
slab('stand.base','stand',BASE.x,BASE.y,BASE.w,BASE.d,-6,6,{
  tone:'lo',cls:'bench',r:8,bevel:1,
  inner:line(k.planOutline(k.insetPlan(BASE,4),0,P),'faint') + screws(k.insetPlan(BASE,3),0),
});
slab('stand.nameplate','stand',65,75,52,10,0,.7,{tone:'lo',r:1,inner:k.faceTextSvg(k.topMatrix([91,82],.7,P),hardware.nameplate,{size:3,tone:'lo',anchor:'middle'})});

const DK={x:-27,y:-77,w:67,d:132,r:2};
const trace = points => line(k.onTop(points,13,P),'faint') + dots(points.map(([x,y])=>at(x,y,13)),.35,'lo');
let traces = dots(k.dotGrid(20,-58,3,4,2.5,13,P),.35,'lo');
for(let i=0;i<4;i++) {
  traces += trace([[-20,-45+i*2.5],[-11-i,-45+i*2.5],[-11-i,-32+i*2.5],[-4.8,-32+i*2.5]]);
  traces += trace([[13.8,-24+i*2.5],[26+i,-24+i*2.5],[26+i,-7+i*2.5],[33,-7+i*2.5]]);
}
for(let i=0;i<3;i++) traces += trace([[-20,17+i*2.5],[-11-i,17+i*2.5],[-11-i,5+i*2.5],[-5.8,5+i*2.5]]);
for(const [x,y] of k.corners(DK,4)) slab(`dk.mount.${x}.${y}`,'dk',x-1.7,y-1.7,3.4,3.4,0,10,{r:.6,tone:'lo'});
slab('dk.pcb','dk',DK.x,DK.y,DK.w,DK.d,10,3,{tone:'hi',cls:'pcb',r:2,inner:screws(DK,13)+line(k.planOutline(k.insetPlan(DK,2),13,P),'faint')+antenna(-5,-73,22,17,13)+traces});
header('dk.header.left.back',-24,-50,4,38,13);
header('dk.header.left.front',-24,0,4,37,12);
header('dk.header.right.back',33,-50,4,38,13);
header('dk.header.right.front',33,0,4,37,12);
usb('dk.usb.debug','dk',-18,45,12,11,13);
usb('dk.usb.native','dk',15,45,12,11,13);
chip('dk.soc','dk',-4,-35,17,17,13,3,true);
chip('dk.debugger','dk',-5,0,15,15,13,2.5);
slab('dk.crystal','dk',17,-31,6,3,13,1.8,{cls:'metal'});
slab('dk.reset','dk',15,25,5,5,13,2,{cls:'button'});
for(let i=0;i<4;i++) {
  const x=-15+i*12;
  slab(`dk.button.${i}`,'dk',x,36,7,7,13,2,{tone:'hi',cls:'button',r:.7});
  slab(`dk.button.cap.${i}`,'dk',x+1.5,37.5,4,4,15,1.3,{tone:'hi',r:.7});
  slab(`dk.led.${i}`,'dk',x+2,28,3,2,13,1,{tone:'mid',cls:'led'});
}
for(let i=0;i<8;i++) slab(`dk.passive.${i}`,'dk',i%2?20:18,-15+Math.floor(i/2)*6,2.4,1.3,13,1,{tone:'lo',cls:'passive'});

const TH={x:-123,y:-5,w:65,d:66,r:3};
for(const [x,y] of k.corners(TH,4)) slab(`thingy.mount.${x}.${y}`,'thingy',x-1.5,y-1.5,3,3,0,8,{tone:'lo',r:.4});
slab('thingy.pcb','thingy',TH.x,TH.y,TH.w,TH.d,8,3,{tone:'mid',cls:'pcb',r:3,inner:screws(TH,11)+line(k.planOutline(k.insetPlan(TH,2),11,P),'faint')+antenna(-119,-1,21,13,11)});
slab('thingy.shield','thingy',-94,0,29,23,11,5,{tone:'hi',cls:'metal',r:1.3,bevel:.5,inner:line(k.planOutline({x:-92,y:2,w:25,d:19,r:.8},16,P),'lo')});
chip('thingy.radio','thingy',-111,23,13,13,11,2.5,true);
for(let i=0;i<4;i++) slab(`thingy.sensor.${i}`,'thingy',-90+(i%2)*12,29+Math.floor(i/2)*12,7,7,11,2.5,{tone:'hi',cls:'ic',inner:dots([at(-88+(i%2)*12,31+Math.floor(i/2)*12,13.5)],.45,'lo')});
usb('thingy.usb','thingy',-110,53,11,9,11);
slab('thingy.button','thingy',-119,42,7,7,11,3,{tone:'hi',cls:'button',r:2});

const DG={x:81,y:-28,w:22,d:75,r:2};
for(const y of [-19,37]) slab(`dongle.mount.${y}`,'dongle',84,y,16,4,0,7,{r:.5,tone:'lo'});
slab('dongle.pcb','dongle',DG.x,DG.y,DG.w,DG.d,7,2,{tone:'mid',cls:'pcb',r:2,inner:line(k.planOutline(k.insetPlan(DG,1.3),9,P),'faint')+antenna(83,-25,18,18,9)});
chip('dongle.soc','dongle',86,0,12,12,9,2.4,true);
slab('dongle.usb','dongle',82,32,20,15,9,.8,{tone:'hi',cls:'metal',r:.5});
for(let i=0;i<4;i++) slab(`dongle.contact.${i}`,'dongle',84+i*4.5,34,2.5,11,9.8,.25,{tone:'hi',cls:'contact',r:.1,bevel:0});
slab('dongle.switch','dongle',88,20,7,5,9,2.2,{tone:'hi',cls:'button'});
for(let i=0;i<3;i++) slab(`dongle.passive.${i}`,'dongle',83,2+i*5,1.4,2.6,9,.8,{tone:'lo',cls:'passive'});

// Settle true depth once at build time. No 3D or geometry library is shipped.
A.settle(R,P,{skip:()=>false});
A.auditOrExit(R,P);
const sorted=[...items].sort((a,b)=>a.key-b.key);
const halo=`<path class="iso-halo" d="${k.haloOf(BASE,-11,6,P)}"/>`;
const art=halo+sorted.map(item=>`<g data-device="${item.piece}" data-part="${item.name}"${item.piece==='dk'?' data-selected=""':''}>${item.svg}</g>`).join('');
const root=fileURLToPath(new URL('../../src/components/hardware/',import.meta.url));
writeFileSync(root+'art.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="iso-svg" role="img" aria-label="${hardware.illustrationLabel.replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]))}">${art}</svg>`);
console.log(`Hardware figure: ${items.length} solids, ${W} × ${H}; art generated.`);
