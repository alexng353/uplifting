import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { renderMuscles, muscleIds } from "../apps/mobile/components/muscles/renderMuscles";

const output = new URL("../apps/mobile/assets/muscles/", import.meta.url);
await mkdir(output, { recursive: true });
const front = renderMuscles([], { defaultColour: "#f0d900" });
const back = renderMuscles([], { view: "back", defaultColour: "#f0d900" });
await Bun.write(new URL("front.svg", output), front);
await Bun.write(new URL("back.svg", output), back);
await Bun.write(
  new URL("preview.html", output),
  `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Addressable muscle map</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#101212;color:#eee;font:15px system-ui,sans-serif}main{max-width:930px;margin:auto;padding:32px 24px}h1{font-size:25px;font-weight:550;margin:0 0 8px}p{color:#aaa;line-height:1.6;margin:0 0 24px}.figures{display:flex;justify-content:center;gap:24px;background:#151717;border-radius:20px;padding:24px}.figure{width:min(42vw,290px);text-align:center}.figure svg{display:block;width:100%;height:auto}.figure h2{font-size:13px;font-weight:500;color:#aaa}.figure svg g[id]{cursor:pointer}.figure svg g[id]:hover{filter:brightness(1.3)}.controls{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:24px 0}select,button{border:1px solid #414747;border-radius:8px;padding:10px;background:#202525;color:#eee;font:inherit}button{cursor:pointer}input{width:44px;height:38px;padding:2px;border:0;background:none}pre{white-space:pre-wrap;line-height:1.65;padding:20px;background:#191d1d;border-radius:12px;color:#b2e6c1;font-size:13px}label{display:flex;align-items:center;gap:8px}.hint{font-size:13px}
</style>
<main><h1>Addressable muscle map</h1><p>Click a muscle to select it, then choose a colour. Left and right refer to the body’s own sides.</p>
<div class="figures"><section class="figure" id="front"><h2>FRONT</h2>${front}</section><section class="figure" id="back"><h2>BACK</h2>${back}</section></div>
<div class="controls"><label>Muscle <select id="muscle">${muscleIds.map((id) => `<option value="${id}">${id}</option>`).join("")}</select></label><label>Colour <input aria-label="Muscle colour" id="colour" type="color" value="#22c55e"></label><button id="apply">Apply</button><button id="reset">Reset</button><button id="download">Download front SVG</button><button id="downloadBack">Download back SVG</button></div>
<pre id="code"></pre><p class="hint">Each muscle is an SVG group with a stable ID. Segments within a muscle inherit its colour. These are approximate hand-traced shapes from the supplied raster reference.</p></main>
<script>
const selections = new Map();
const muscle = document.querySelector('#muscle');
const colour = document.querySelector('#colour');
muscle.value = 'leftPec';
function updateCode() {
 document.querySelector('#code').textContent = 'renderMuscles(' + JSON.stringify(Array.from(selections, ([muscle, colour]) => ({muscle, colour})), null, 2) + ', { view: "front", defaultColour: "#f0d900" })';
}
function apply() {
 selections.set(muscle.value, colour.value);
 document.querySelectorAll('svg g[id]').forEach(group => { if (group.id === muscle.value) group.setAttribute('fill', colour.value); });
 updateCode();
}
document.querySelectorAll('svg g[id]').forEach(group => group.addEventListener('click', () => { muscle.value = group.id; colour.value = selections.get(group.id) || '#22c55e'; }));
document.querySelector('#apply').addEventListener('click', apply);
document.querySelector('#reset').addEventListener('click', () => { selections.clear(); document.querySelectorAll('svg g[id]').forEach(group => group.setAttribute('fill', '#f0d900')); updateCode(); });
function download(view) {
 const xml = new XMLSerializer().serializeToString(document.querySelector('#' + view + ' svg'));
 const url = URL.createObjectURL(new Blob([xml], {type:'image/svg+xml'}));
 const link = document.createElement('a'); link.href=url; link.download=view + '.svg'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.querySelector('#download').addEventListener('click', () => download('front'));
document.querySelector('#downloadBack').addEventListener('click', () => download('back'));
apply();
</script></html>`,
);
const formatted = Bun.spawnSync([
  "bunx",
  "oxfmt",
  "--write",
  fileURLToPath(new URL("preview.html", output)),
]);
if (formatted.exitCode !== 0) throw new Error(formatted.stderr.toString());
console.log("Generated front.svg, back.svg, and preview.html in apps/mobile/assets/muscles");
