'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const J = require('../src/journal-model.js');
const copy = value => JSON.parse(JSON.stringify(value));
const reflection = () => copy(J.emptyRecord());
const withScene = () => ({status:'available',format:'imagery-static-scene',version:3,sha256:'a'.repeat(64),rendererVersion:'0.8.0-preview.1'});
const withExposure = () => ({status:'available',mode:'items',plannedMs:3000,visibleMs:1200,interrupted:true,endedReason:'user-stop'});

test('JOURNAL: defaults are skipped, not absent experiences or symptoms', () => {
  const value = J.emptyRecord();
  assert.deepEqual(Object.values(value.experiences), Array(4).fill('skipped'));
  assert.deepEqual(Object.values(value.symptoms), Array(5).fill('skipped'));
  assert.deepEqual(value.comfort,{before:'skipped',after:'skipped'});
  assert.equal(value.stoppedEarly,'skipped');
  assert.equal(value.preference,'skipped');
  assert.equal(value.easeOfUse,'skipped');
  assert.deepEqual(value.scene,{status:'unavailable'});
  assert.deepEqual(value.exposure,{status:'unavailable'});
  assert.equal(value.note,'');
});

test('JOURNAL: all phenomenology and missingness values remain distinct', () => {
  for (const field of J.EXPERIENCES) for (const response of J.RESPONSE_VALUES) {
    const input=reflection(); input.experiences[field]=response;
    assert.equal(J.canonicalRecord(input).experiences[field],response);
  }
  const input=reflection(); input.experiences.afterimage='present'; input.experiences.voluntaryImagery='none';
  const output=J.canonicalRecord(input);
  assert.equal(output.experiences.afterimage,'present');
  assert.equal(output.experiences.voluntaryImagery,'none');
  assert.equal('score' in output,false); assert.equal('improvement' in output,false);
});

test('JOURNAL: comfort, symptoms, preference and usability retain independent categories', () => {
  for (const response of J.COMFORT_VALUES) {
    const input=reflection(); input.comfort.before=response; input.comfort.after=response;
    assert.deepEqual(J.canonicalRecord(input).comfort,{before:response,after:response});
  }
  for (const field of J.SYMPTOMS) for (const response of J.SYMPTOM_VALUES) {
    const input=reflection(); input.symptoms[field]=response;
    assert.equal(J.canonicalRecord(input).symptoms[field],response);
  }
  for (const [field,values] of [['stoppedEarly',J.STOP_VALUES],['preference',J.PREFERENCE_VALUES],['easeOfUse',J.EASE_VALUES]]) {
    for(const response of values){const input=reflection(); input[field]=response;assert.equal(J.canonicalRecord(input)[field],response);}
  }
});

test('JOURNAL: zero, booleans, null and invented scales are not skipped/none', () => {
  for (const value of [0,1,false,true,null,undefined,'improved','5','']) {
    for(const field of J.EXPERIENCES){const input=reflection();input.experiences[field]=value;assert.throws(()=>J.canonicalRecord(input));}
    for(const field of ['preference','easeOfUse','stoppedEarly']){const input=reflection();input[field]=value;assert.throws(()=>J.canonicalRecord(input));}
  }
});

test('JOURNAL: canonical output is deeply frozen but input is neither mutated nor frozen', () => {
  const input=reflection(),before=copy(input),output=J.canonicalRecord(input);
  assert.deepEqual(input,before); assert.equal(Object.isFrozen(input),false);
  for(const value of [output,output.experiences,output.comfort,output.symptoms,output.scene,output.exposure])assert.ok(Object.isFrozen(value));
  input.experiences.afterimage='present'; assert.equal(output.experiences.afterimage,'skipped');
  assert.throws(()=>{output.experiences.afterimage='none';},TypeError);
  assert.notEqual(J.emptyRecord(),J.emptyRecord());
});

test('JOURNAL: strict reflection and nested records reject unknown, missing and symbol keys', () => {
  for(const locate of [v=>v,v=>v.scene,v=>v.exposure,v=>v.experiences,v=>v.comfort,v=>v.symptoms]){
    const extra=reflection();locate(extra).endpoint='https://example.test';assert.throws(()=>J.canonicalRecord(extra));
    const missing=reflection();delete locate(missing)[Object.keys(locate(missing))[0]];assert.throws(()=>J.canonicalRecord(missing));
    const symbol=reflection();locate(symbol)[Symbol('extra')]=1;assert.throws(()=>J.canonicalRecord(symbol));
  }
});

test('JOURNAL: accessors are rejected without invoking them', () => {
  for (const [pathParts,key] of [[[],'note'],[['scene'],'status'],[['exposure'],'status'],[['experiences'],'afterimage'],[['comfort'],'before'],[['symptoms'],'eyestrain']]) {
    const input=reflection();let calls=0,at=input;
    for(const part of pathParts)at=at[part];
    Object.defineProperty(at,key,{enumerable:true,get(){calls++;throw Error('must not execute');}});
    assert.throws(()=>J.canonicalRecord(input));assert.equal(calls,0);
  }
});

test('JOURNAL: custom prototypes and arrays cannot masquerade as records', () => {
  for(const key of ['scene','exposure','experiences','comfort','symptoms']){
    const input=reflection();Object.setPrototypeOf(input[key],{inherited:'untrusted'});assert.throws(()=>J.canonicalRecord(input));
    input[key]=[];assert.throws(()=>J.canonicalRecord(input));
  }
  assert.throws(()=>J.canonicalRecord([]));
  const input=reflection();Object.setPrototypeOf(input,{method(){}});assert.throws(()=>J.canonicalRecord(input));
  const nullInput=reflection();Object.setPrototypeOf(nullInput,null);assert.deepEqual(J.canonicalRecord(nullInput),J.emptyRecord());
});

test('JOURNAL: note is bounded plain data, preserving permitted whitespace and unicode', () => {
  for(const note of ['', 'Synthetic observation.\nNone\tor unsure.', '🙂'.repeat(1000), '<script>not executable</script>']) {
    const input=reflection();input.note=note;assert.equal(J.canonicalRecord(input).note,note);
  }
  for(const note of ['a'.repeat(2001), '\u0000', '\u0001', '\u007f', '\u0085', '\u202e', '\u2066', null,42]) {
    const input=reflection();input.note=note;assert.throws(()=>J.canonicalRecord(input));
  }
});

test('JOURNAL: scene reference is metadata only, exact digest/version is preserved', () => {
  const input=reflection();input.scene=withScene();
  assert.deepEqual(J.canonicalRecord(input).scene,withScene());
  assert.equal('name' in J.canonicalRecord(input).scene,false);
  for(const version of [1,2,3,4]){input.scene.version=version;assert.equal(J.canonicalRecord(input).scene.version,version);}
});

test('JOURNAL: scene reference rejects sensitive extras and malformed provenance', () => {
  for(const [key,value] of [['sha256','a'.repeat(63)],['sha256','A'.repeat(64)],['sha256','g'.repeat(64)],['sha256',null],['version',0],['version',5],['version','3'],['rendererVersion','0.8.0\n'],['rendererVersion','https://example.test'],['format','other'],['status','claimed']]) {
    const input=reflection();input.scene=withScene();input.scene[key]=value;assert.throws(()=>J.canonicalRecord(input));
  }
  for(const key of ['name','image','filename','latitude','participantId']){
    const input=reflection();input.scene=withScene();input.scene[key]='not permitted';assert.throws(()=>J.canonicalRecord(input));
  }
  const input=reflection();input.scene.sha256='a'.repeat(64);assert.throws(()=>J.canonicalRecord(input),'unavailable is not a metadata bypass');
});

test('JOURNAL: unavailable exposure is not silently converted to zero or completed', () => {
  assert.deepEqual(J.canonicalRecord(reflection()).exposure,{status:'unavailable'});
  const input=reflection();input.exposure=withExposure();assert.deepEqual(J.canonicalRecord(input).exposure,withExposure());
  input.exposure.plannedMs=null;assert.equal(J.canonicalRecord(input).exposure.plannedMs,null);
  input.exposure.visibleMs=0;assert.equal(J.canonicalRecord(input).exposure.visibleMs,0);
});

test('JOURNAL: exposure types, durations and closed end reasons are checked', () => {
  for(const [key,value] of [['plannedMs',-1],['plannedMs',3600001],['plannedMs',0.5],['visibleMs',Infinity],['visibleMs','10'],['visibleMs',null],['visibleMs',NaN],['interrupted',1],['mode','trial'],['endedReason','improved'],['status','missing']]){
    const input=reflection();input.exposure=withExposure();input.exposure[key]=value;assert.throws(()=>J.canonicalRecord(input));
  }
  const input=reflection();input.exposure=withExposure();input.exposure.mouseTrace=[];assert.throws(()=>J.canonicalRecord(input));
});

test('JOURNAL: add is explicit, immutable and session instances are independent', () => {
  const a=J.createJournal(),b=J.createJournal();assert.deepEqual(a.getState(),{revision:0,entries:[]});
  const input=reflection(),entry=a.add(input);input.note='later';
  assert.equal(entry.id,'entry-1');assert.equal(entry.reflection.note,'');
  assert.equal(a.getState().revision,1);assert.equal(b.getState().entries.length,0);
  assert.ok(Object.isFrozen(a.getState().entries));assert.ok(Object.isFrozen(entry));
});

test('JOURNAL: rejected additions preserve state and identifiers', () => {
  const journal=J.createJournal();const invalid=reflection();invalid.name='unsupported';
  assert.throws(()=>journal.add(invalid));assert.deepEqual(journal.getState(),{revision:0,entries:[]});
  assert.equal(journal.add(reflection()).id,'entry-1');
});

test('JOURNAL: twenty-entry cap is atomic and deletion restores capacity', () => {
  const journal=J.createJournal();for(let i=0;i<J.MAX_ENTRIES;i++)journal.add(reflection());
  const before=journal.getState();assert.throws(()=>journal.add(reflection()));assert.deepEqual(journal.getState(),before);
  journal.remove('entry-5');assert.equal(journal.add(reflection()).id,'entry-21');assert.equal(journal.getState().entries.length,20);
});

test('JOURNAL: removal and clear affect memory only and never reuse identifiers', () => {
  const journal=J.createJournal();journal.add(reflection());journal.add(reflection());
  assert.throws(()=>journal.remove('entry-999'));assert.equal(journal.getState().revision,2);
  journal.remove('entry-1');assert.deepEqual(journal.getState().entries.map(e=>e.id),['entry-2']);
  journal.clear();assert.equal(journal.getState().entries.length,0);assert.equal(journal.add(reflection()).id,'entry-3');
});

test('JOURNAL: exact selected export preview is immutable and does not export unselected notes', () => {
  const journal=J.createJournal();const a=reflection(),b=reflection();a.note='selected synthetic';b.note='not selected synthetic';
  const first=journal.add(a);journal.add(b);
  const preview=journal.previewExport([first.id]);
  assert.equal(preview.document.entries.length,1);assert.ok(preview.text.includes(a.note));assert.ok(!preview.text.includes(b.note));
  assert.equal(preview.text,JSON.stringify(preview.document,null,2)+'\n');
  assert.ok(Object.isFrozen(preview));assert.ok(Object.isFrozen(preview.document.entries));
  assert.equal(preview.document.purpose,'private-exploratory-reflection');
});

test('JOURNAL: export requires exact true and consumes the reviewed approval', () => {
  const journal=J.createJournal(),entry=journal.add(reflection()),preview=journal.previewExport([entry.id]);
  for(const include of [false,undefined,null,1,'true'])assert.throws(()=>journal.confirmExport(preview,include));
  assert.equal(journal.confirmExport(preview,true),preview.text);
  assert.throws(()=>journal.confirmExport(preview,true));
});

test('JOURNAL: additions, removals and clear invalidate previously reviewed exports', () => {
  for(const change of [j=>j.add(reflection()),j=>j.remove('entry-1'),j=>j.clear()]){
    const journal=J.createJournal();journal.add(reflection());journal.add(reflection());
    const preview=journal.previewExport(['entry-1']);change(journal);
    assert.throws(()=>journal.confirmExport(preview,true));
  }
});

test('JOURNAL: forged and cross-session previews cannot authorize export', () => {
  const a=J.createJournal(),b=J.createJournal();a.add(reflection());b.add(reflection());
  const preview=a.previewExport(['entry-1']);
  assert.throws(()=>b.confirmExport(preview,true));assert.throws(()=>a.confirmExport(copy(preview),true));
  assert.throws(()=>a.confirmExport(null,true));assert.equal(a.confirmExport(preview,true),preview.text);
});

test('JOURNAL: invalid, repeated, nonexistent and empty selections fail without changes', () => {
  const journal=J.createJournal();journal.add(reflection());const before=journal.getState();
  for(const ids of [[],['entry-1','entry-1'],['entry-2'],['entry-0'],['entry-01'],[1],null,'entry-1',Array(21).fill('entry-1')])assert.throws(()=>journal.previewExport(ids));
  assert.deepEqual(journal.getState(),before);
});

test('JOURNAL: selection holes, accessors, symbol keys and custom array prototypes fail', () => {
  const journal=J.createJournal();journal.add(reflection());
  const hole=Array(1);assert.throws(()=>journal.previewExport(hole));
  const extra=['entry-1'];extra.extra=1;assert.throws(()=>journal.previewExport(extra));
  const symbol=['entry-1'];symbol[Symbol('extra')]=1;assert.throws(()=>journal.previewExport(symbol));
  const proto=['entry-1'];Object.setPrototypeOf(proto,{});assert.throws(()=>journal.previewExport(proto));
  let calls=0;const accessor=['entry-1'];Object.defineProperty(accessor,'0',{get(){calls++;return 'entry-1';}});
  assert.throws(()=>journal.previewExport(accessor));assert.equal(calls,0);
});

test('JOURNAL: export byte bound is applied independently of character length', () => {
  const journal=J.createJournal();
  for(let i=0;i<20;i++){const input=reflection();input.note='界'.repeat(2000);journal.add(input);}
  assert.throws(()=>journal.previewExport(journal.getState().entries.map(e=>e.id)),/resource bound/);
  const preview=journal.previewExport(['entry-1']);assert.ok(Buffer.byteLength(preview.text)<J.MAX_EXPORT_BYTES);
});

test('JOURNAL: submission contract is disabled, immutable, and contains no transport', () => {
  assert.equal(J.SUBMISSION.enabled,false);assert.equal(J.SUBMISSION.status,'not-available');
  assert.ok(J.SUBMISSION.prerequisites.includes('competent-ethics-determination'));
  assert.ok(J.SUBMISSION.prerequisites.includes('separate-explicit-activation-authorization'));
  assert.ok(Object.isFrozen(J.SUBMISSION));assert.ok(Object.isFrozen(J.SUBMISSION.prerequisites));
  for(const key of ['endpoint','submit','token','consent','participantId'])assert.equal(key in J.SUBMISSION,false);
  assert.throws(()=>{J.SUBMISSION.enabled=true;},TypeError);
});

test('JOURNAL: browser UMD exports without DOM, clock, storage, network or dynamic code', () => {
  const source=fs.readFileSync(path.join(__dirname,'../src/journal-model.js'),'utf8');
  const sandbox={};vm.createContext(sandbox);vm.runInContext(source,sandbox);
  assert.ok(sandbox.ImageryJournal);assert.equal(sandbox.ImageryJournal.emptyRecord().note,'');
  for(const pattern of [/\bfetch\s*\(/,/\bXMLHttpRequest\b/,/\bWebSocket\b/,/\bDate\b/,/\bperformance\b/,/\blocalStorage\b/,/\bsessionStorage\b/,/\bindexedDB\b/,/\bdocument\b\s*\./,/\beval\s*\(/,/new\s+Function\b/,/\bsetTimeout\s*\(/,/\bsetInterval\s*\(/])assert.doesNotMatch(source,pattern);
});

test('JOURNAL V2: sequence references have their own exact version bounds', () => {
  for (const version of [1,2,3]) {
    const input=reflection();input.scene={...withScene(),format:'imagery-field-sequence',version};input.exposure={...withExposure(),mode:'sequence'};
    assert.equal(J.canonicalRecord(input).scene.version,version);
  }
  for (const version of [0,4,5,'3',null,NaN]) {
    const input=reflection();input.scene={...withScene(),format:'imagery-field-sequence',version};assert.throws(()=>J.canonicalRecord(input));
  }
});

test('JOURNAL V2: whole-sequence identity cannot be mislabeled as a static or item display', () => {
  for (const mode of ['static','items']) {
    const input=reflection();input.scene={...withScene(),format:'imagery-field-sequence'};input.exposure={...withExposure(),mode};
    assert.throws(()=>J.canonicalRecord(input),/disagree/);
  }
  const input=reflection();input.scene=withScene();input.exposure={...withExposure(),mode:'sequence'};
  assert.throws(()=>J.canonicalRecord(input),/disagree/);
});

test('JOURNAL V2: legacy record validator retains the original static-only contract explicitly', () => {
  assert.equal(J.VERSION,2);assert.equal(J.LEGACY_VERSION,1);
  const input=reflection();input.scene=withScene();input.exposure=withExposure();
  assert.deepEqual(J.canonicalRecordV1(input),J.canonicalRecord(input));
  input.exposure.mode='sequence';assert.equal(J.canonicalRecordV1(input).exposure.mode,'sequence');
  input.scene.format='imagery-field-sequence';assert.throws(()=>J.canonicalRecordV1(input));
  assert.equal(J.canonicalRecord(input).scene.format,'imagery-field-sequence');
});

test('JOURNAL V2: exact export declares v2 but unassociated reflections remain fully usable', () => {
  const journal=J.createJournal(),entry=journal.add(reflection());
  const preview=journal.previewExport([entry.id]);
  assert.equal(preview.document.version,2);assert.deepEqual(preview.document.entries[0].reflection.scene,{status:'unavailable'});
  assert.deepEqual(preview.document.entries[0].reflection.exposure,{status:'unavailable'});
  assert.throws(()=>journal.confirmExport(preview,false));assert.equal(journal.confirmExport(preview,true),preview.text);
});
