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

// 每種預設 × 每個角色：答案一定在該題的盤面上；大字盤面 9 張不重複；配件數不超過上限
for (const [name, set] of Object.entries(g.PRESETS)) {
    for (const char of Object.keys(g.CHARS)) {
        const full = g.makeBoard();
        for (let t = 0; t < 500; t++) {
            const r = g.makeRound(t + 1, 5, Math.random, char, set);
            assert(r.items.length <= set.maxItems, `${name} 配件上限`);
            const board = g.boardOf(r, full);
            assert(g.findCard(board, g.answerOf(r)) >= 0, `${name} 答案要在盤面上`);
            if (set.board === 'big') {
                assert.strictEqual(board.length, 9);
                assert.strictEqual(new Set(board.flat()).size, 9, '大字盤面不重複');
                assert(board.flat().every((n) => n >= 1), '大字盤面沒有 0 或負數');
            }
        }
    }
}
const elder = g.makeRound(1, 0, Math.random, 'cat', g.PRESETS.elder);
assert.strictEqual(g.answerOf(elder), elder.items.length, '只數配件時答案就是件數');
assert.strictEqual(g.equationText(elder), `一共 ${elder.items.length} 件`);
assert.deepStrictEqual(g.scoreAnswers({ a: { card: 1, at: 2 }, b: { card: 1, at: 1 }, c: { card: 0, at: 0 } }, 1, false), { a: 1, b: 1, c: 0 }, '不比快時答對都 1 分');

const pts = g.scoreAnswers({ a: { card: 3, at: 300 }, b: { card: 3, at: 100 }, c: { card: 5, at: 50 }, d: { card: 3, at: 200 }, e: { card: 3, at: 400 } }, 3);
assert.deepStrictEqual(pts, { a: 1, b: 3, c: 0, d: 2, e: 1 });
assert.deepStrictEqual(g.scoreAnswers(null, 3), {});
assert(g.charSVG(['beanie'], 'cat').includes('#6E6D72'), '貓的毛帽要畫出來');
assert(!g.charSVG([], 'cat').includes('#6E6D72'), '沒選毛帽就不畫');
// 瀏覽器裡各 <script> 共用全域，撞名（例如兩邊都宣告 S）整頁會掛；接起來編譯一次就抓得到
const fs = require('fs'), vm = require('vm');
for (const page of ['host.html', 'player.html', 'duel.html', 'group.html', 'index.html']) {
    const html = fs.readFileSync(page, 'utf8');
    const srcs = [...html.matchAll(/<script src="(game|sync)\.js[^"]*">/g)].map((m) => fs.readFileSync(m[1] + '.js', 'utf8'));
    const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    new vm.Script([...srcs, ...inline].join('\n;\n'), { filename: page });
}
console.log('all tests passed');
