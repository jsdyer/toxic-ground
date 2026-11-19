import test from 'node:test';
import assert from 'node:assert/strict';
import {folded,quote,knownSum,selectRows} from '../web/model.mjs';
test('Filtering combines accent-insensitive search with structured values',()=>{
 const r={kind:'Office',status:'Owned',owner:'Agency',search:folded('Étage Halifax')};
 assert.deepEqual(selectRows([r],'etage HAL','Office','','Agency',()=>true),[r]);
 assert.deepEqual(selectRows([r],'etage','','Leased','',()=>true),[]);
});
test('Blank figures and zeroes remain distinct',()=>{assert.equal(knownSum([null]),null);assert.equal(knownSum([null,0]),0);assert.equal(quote('a"b'),'"a""b"')});

import {stepStreak} from '../web/model.mjs';
test('a gap, ambiguous year or changed step ends the series',()=>{
 assert.equal(stepStreak([['2025-2026','07'],['2024-2025','07'],['2024-2025','07'],['2022-2023','07']]),2);
 assert.equal(stepStreak([['2025-2026','07'],['2025-2026','08']]),0);
 assert.equal(stepStreak([['2025-2026',''],['2024-2025','07']]),0);
});
