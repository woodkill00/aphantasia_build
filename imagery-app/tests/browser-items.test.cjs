'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {isPrecisionTarget}=require('./browser-items.cjs');
test('NATIVE HARNESS: precision target minimum uses element role, not diagnostic or actual ID',()=>{
 for(const tag of ['LABEL','SPAN','DIV','FIELDSET'])for(const id of ['',tag,'named-label'])assert.equal(isPrecisionTarget({id,tag}),false,`${tag} must retain bounds/hit checks without the input target minimum`);
 for(const tag of ['INPUT','BUTTON','SELECT'])for(const id of ['',tag,'actual-control'])assert.equal(isPrecisionTarget({id,tag}),true,`${tag} always retains44px width/height assertions`);
});
