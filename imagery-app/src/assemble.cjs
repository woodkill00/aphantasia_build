'use strict';
// Developer packaging only. End users need only index.html, not Node.
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname;
let html=fs.readFileSync(path.join(dir,'shell.html'),'utf8');
for(const [marker,file] of [['/*__STYLE__*/','style.css'],['/*__GEOMETRY__*/','geometry-model.js'],['/*__MODEL__*/','model.js'],['/*__SEQUENCE__*/','sequence-model.js'],['/*__ITEMS__*/','item-model.js'],['/*__EDITOR__*/','editor-model.js'],['/*__EDITOR_AIDS_MODEL__*/','editor-aids-model.js'],['/*__EDITOR_AIDS_UI__*/','editor-aids-ui.js'],['/*__PRESETS__*/','preset-model.js'],['/*__GALLERY_UI__*/','gallery-ui.js'],['/*__PROVENANCE__*/','provenance-model.js'],['/*__IMAGE_FILE__*/','image-file.js'],['/*__IMAGE_MODEL__*/','image-model.js'],['/*__IMAGE_UI__*/','image-ui.js'],['/*__JOURNAL_MODEL__*/','journal-model.js'],['/*__JOURNAL_UI__*/','journal-ui.js'],['/*__APP__*/','app.js']]){
  const source=fs.readFileSync(path.join(dir,file),'utf8');
  if(source.toLowerCase().includes('</script'))throw new Error('Unsafe script terminator in source');
  html=html.replace(marker,()=>source);
}
fs.writeFileSync(path.join(dir,'..','index.html'),html);
console.log('Assembled self-contained index.html ('+Buffer.byteLength(html)+' bytes).');
