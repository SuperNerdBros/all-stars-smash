import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWwwChart } from '../lib/roster/www/wwwSpriteBuilder';

test('www sprite builder produces full charts at both era sizes', () => {
  const chart = buildWwwChart({ archetype: 'blade', build: 'standard', hair: 'spiky', headwear: 'none', outfit: 'jacket' }, { w: 24, h: 32 });
  assert.equal(chart.idle.frames[0].length, 32);
  assert.equal(chart.idle.frames[0][0].length, 24);
});
