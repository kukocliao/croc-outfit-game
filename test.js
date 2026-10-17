// node test.js —— 驗證出題一定有解、計分依名次、不重複
const assert = require('assert');
const g = require('./game.js');

for (let t = 0; t < 2000; t++) {
    const board = g.makeBoard();
    const flat = board.flat().sort((a, b) => a - b);
    assert.deepStrictEqual(flat, Array.from({ length: 100 }, (_, i) => i + 1), '盤面要剛好是 1–100');
    const char = t % 2 ? 'cat' : 'croc';
    const r = g.makeRound(t % 7 + 1, 4, Math.random, char);
    assert.strictEqual(r.char, char);
    assert(r.items.length >= 1 && r.items.length <= g.MAX_ITEMS);
    assert.strictEqual(new Set(r.items).size, r.items.length, '配件不重複');
    g.CHARS[char].groups.forEach((grp) => assert(r.items.filter((x) => grp.includes(x)).length <= 1, '同一組（頭、脖子）最多一件'));
    const ids = new Set(g.CHARS[char].parts.map(([id]) => id));
    r.items.forEach((x) => assert(ids.has(x), `${char} 的 ${x} 要有畫法`));
    for (const mode of ['mul', 'add']) assert(g.findCard(board, g.answerOf(r, mode)) >= 0, '答案一定在盤面上');
}
assert.strictEqual(g.makeRound(2, 7).mult, 7, '非換牌回合沿用乘數');

const pts = g.scoreAnswers({ a: { card: 3, at: 300 }, b: { card: 3, at: 100 }, c: { card: 5, at: 50 }, d: { card: 3, at: 200 }, e: { card: 3, at: 400 } }, 3);
assert.deepStrictEqual(pts, { a: 1, b: 3, c: 0, d: 2, e: 1 });
assert.deepStrictEqual(g.scoreAnswers(null, 3), {});
assert(g.charSVG(['beanie'], 'cat').includes('#6E6D72'), '貓的毛帽要畫出來');
assert(!g.charSVG([], 'cat').includes('#6E6D72'), '沒選毛帽就不畫');
console.log('all tests passed');
