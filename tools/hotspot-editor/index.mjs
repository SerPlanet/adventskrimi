// Usage: npm run hotspot-editor -- cases/berghotel   then open http://localhost:4180
// DEVELOPMENT ONLY. Drag the things of a room to where they belong; the position is saved as
// objects[].spot {x,y} in <case>/rooms.yaml. The scene here uses the same mapping as the app
// (see spotsOf in app/src/ui/RoomScene.tsx), so what you drop is what the player sees.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: hotspot-editor <case-dir>');
  process.exit(2);
}
const file = join(dir, 'rooms.yaml');
const load = () => parse(readFileSync(file, 'utf8'));

const PAGE = `<!doctype html><meta charset="utf-8"><title>Hotspot-Editor</title>
<style>
body{font-family:system-ui;margin:1rem;max-width:44rem}
#scene{position:relative;aspect-ratio:100/72;background:#6f8f5e;border:2px solid #333;touch-action:none}
#floor{position:absolute;left:0;right:0;top:64%;bottom:0;background:#3d4f35}
.pin{position:absolute;transform:translate(-50%,-50%);min-width:48px;min-height:48px;border-radius:8px;border:2px solid #222;background:#fff;font-size:11px;cursor:grab;padding:2px}
.pin.drag{cursor:grabbing;background:#ffe9a8}
</style>
<h1>Hotspot-Editor</h1>
<label>Raum <select id="room"></select></label> <span id="msg"></span>
<div id="scene"><div id="floor"></div></div>
<p>Ziehen und loslassen speichert sofort in rooms.yaml.</p>
<script>
const scene = document.getElementById('scene');
const sel = document.getElementById('room');
const msg = document.getElementById('msg');
let rooms = [];
// same mapping as the app: stored y -> scene y and back
const toScene = (y) => Math.min(70, 18 + (y - 20) * 1.7);
const fromScene = (v) => Math.max(0, Math.min(100, 20 + (v - 18) / 1.7));
async function init() {
  rooms = await (await fetch('/api/rooms')).json();
  sel.innerHTML = rooms.map((r) => '<option value="' + r.id + '">' + r.name + '</option>').join('');
  draw();
}
function draw() {
  scene.querySelectorAll('.pin').forEach((n) => n.remove());
  const room = rooms.find((r) => r.id === sel.value);
  (room?.objects ?? []).forEach((o, i) => {
    const n = o.spot ?? { x: ((i + 1) * 100) / (room.objects.length + 1), y: 30 };
    const el = document.createElement('button');
    el.className = 'pin';
    el.textContent = o.name;
    el.style.left = n.x + '%';
    el.style.top = (toScene(n.y) / 72) * 100 + '%';
    el.onpointerdown = (e) => {
      el.setPointerCapture(e.pointerId);
      el.classList.add('drag');
      const move = (m) => {
        const b = scene.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((m.clientX - b.left) / b.width) * 100));
        const v = Math.max(0, Math.min(70, ((m.clientY - b.top) / b.height) * 72));
        el.style.left = x + '%';
        el.style.top = (v / 72) * 100 + '%';
        el.dataset.x = x;
        el.dataset.v = v;
      };
      el.onpointermove = move;
      el.onpointerup = async () => {
        el.classList.remove('drag');
        el.onpointermove = null;
        if (el.dataset.x === undefined) return;
        const body = { room: room.id, object: o.id, x: Math.round(+el.dataset.x), y: Math.round(fromScene(+el.dataset.v)) };
        o.spot = { x: body.x, y: body.y };
        const r = await fetch('/api/spot', { method: 'POST', body: JSON.stringify(body) });
        msg.textContent = r.ok ? 'gespeichert: ' + o.name + ' (' + body.x + ', ' + body.y + ')' : 'Fehler beim Speichern';
        delete el.dataset.x;
      };
    };
    scene.appendChild(el);
  });
}
sel.onchange = draw;
init();
</script>`;

createServer((req, res) => {
  if (req.url === '/api/rooms') {
    res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify(load().rooms));
  }
  if (req.url === '/api/spot' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { room, object, x, y } = JSON.parse(body);
      const data = load();
      const obj = data.rooms.find((r) => r.id === room)?.objects.find((o) => o.id === object);
      if (!obj) {
        res.statusCode = 404;
        return res.end('unknown object');
      }
      obj.spot = { x, y };
      writeFileSync(file, stringify(data, { lineWidth: 0 }));
      res.end('ok');
    });
    return;
  }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(PAGE);
}).listen(4180, '127.0.0.1', () =>
  console.log(`hotspot editor for ${dir}: http://localhost:4180 (Ctrl+C to stop)`),
);
