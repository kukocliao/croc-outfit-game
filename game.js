// 純遊戲邏輯＋鱷魚 SVG：host / player / duel 共用，node test.js 也能直接跑
const HEADWEAR = ['hat', 'cap', 'hairbow'];           // 頭上只會戴其中一種
const OTHER_ITEMS = ['bowtie', 'necklace', 'shirt', 'pants', 'belt', 'bag', 'watch', 'earring', 'socks', 'boots', 'tailbow'];
const MAX_ITEMS = 8;                                  // 配件數 1–8，乘數 1–10，乘積不超過 100

function shuffle(arr, rng = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// 1–100 洗牌後切成 25 張、每張 4 個數字，跟實體桌遊一樣
function makeBoard(rng = Math.random) {
    const nums = shuffle(Array.from({ length: 100 }, (_, i) => i + 1), rng);
    return Array.from({ length: 25 }, (_, i) => nums.slice(i * 4, i * 4 + 4));
}

function pickItems(rng = Math.random) {
    const count = 1 + Math.floor(rng() * MAX_ITEMS);
    const pool = shuffle([HEADWEAR[Math.floor(rng() * HEADWEAR.length)], ...OTHER_ITEMS], rng);
    return pool.slice(0, count);
}

// 乘數卡每 3 題換一張，跟桌遊「疊上新的乘數卡」的節奏差不多
function makeRound(n, prevMult, rng = Math.random) {
    const mult = (n - 1) % 3 === 0 || !prevMult ? 1 + Math.floor(rng() * 10) : prevMult;
    return { n, items: pickItems(rng), mult };
}

function answerOf(round, mode) {
    return mode === 'add' ? round.items.length + round.mult : round.items.length * round.mult;
}

function findCard(board, answer) {
    return board.findIndex((card) => card.includes(answer));
}

// 依名次給分：第 1 名 3 分、第 2 名 2 分、其他答對 1 分；答錯 0 分
const RANK_POINTS = [3, 2];
function scoreAnswers(answers, correctCard) {
    const correct = Object.entries(answers || {})
        .filter(([, a]) => a && a.card === correctCard)
        .sort((x, y) => x[1].at - y[1].at);
    const pts = {};
    Object.keys(answers || {}).forEach((uid) => { pts[uid] = 0; });
    correct.forEach(([uid], i) => { pts[uid] = RANK_POINTS[i] ?? 1; });
    return pts;
}

// ── 鱷魚 SVG：底圖分層畫，配件依 items 開關 ──
const CROC_PARTS = [
    ['base', '<polygon points="72,168 18,232 84,198" fill="#4e9a3f"/>'],
    ['tailbow', '<path d="M22,226 l-14,-10 v20 z M22,226 l14,-10 v20 z" fill="#e84f9a"/><circle cx="22" cy="226" r="4" fill="#c2357a"/>'],
    ['base', '<rect x="76" y="192" width="16" height="44" rx="6" fill="#5bb04a"/><rect x="108" y="192" width="16" height="44" rx="6" fill="#5bb04a"/>'],
    ['socks', '<rect x="74" y="212" width="20" height="16" fill="#7b3fa0"/><rect x="106" y="212" width="20" height="16" fill="#7b3fa0"/><rect x="74" y="212" width="20" height="4" fill="#f0913a"/><rect x="106" y="212" width="20" height="4" fill="#f0913a"/>'],
    ['boots', '<path d="M72,228 h24 v14 h-30 a6,6 0 0 1 6,-14z" fill="#2c3e8c"/><path d="M104,228 h24 v14 h-30 a6,6 0 0 1 6,-14z" fill="#2c3e8c"/>'],
    ['base', '<rect x="60" y="88" width="80" height="112" rx="36" fill="#5bb04a"/><ellipse cx="102" cy="148" rx="28" ry="44" fill="#a8d98f"/>'],
    ['shirt', '<path d="M68,104 h64 l4,62 h-72 z" fill="#ffffff" stroke="#bbb" stroke-width="1.5"/><path d="M84,104 q16,16 32,0" fill="#5bb04a"/>'],
    ['pants', '<path d="M66,178 h68 l-4,20 h-22 l-8,-8 l-8,8 h-22 z" fill="#2c3e8c"/>'],
    ['belt', '<rect x="62" y="164" width="76" height="12" fill="#8a3fa0"/><rect x="94" y="162" width="14" height="16" fill="none" stroke="#e0b030" stroke-width="3"/>'],
    ['base', '<path d="M64,108 l-20,24 l20,16" fill="none" stroke="#5bb04a" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M136,108 l20,24 l-20,16" fill="none" stroke="#5bb04a" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>'],
    ['bag', '<path d="M30,140 q12,-16 24,0" fill="none" stroke="#333" stroke-width="3"/><rect x="26" y="140" width="32" height="22" rx="4" fill="#3a3a44"/>'],
    ['watch', '<rect x="150" y="124" width="12" height="9" rx="2" fill="#e0b030" transform="rotate(40 156 128)"/><circle cx="156" cy="128" r="3" fill="#fff"/>'],
    ['base', '<ellipse cx="100" cy="66" rx="32" ry="27" fill="#5bb04a"/><rect x="108" y="56" width="74" height="26" rx="11" fill="#5bb04a"/><polyline points="118,82 124,90 130,82 136,90 142,82 148,90 154,82 160,90 166,82 172,90 178,82" fill="#fff" stroke="#888" stroke-width="1"/><circle cx="94" cy="44" r="9" fill="#fff"/><circle cx="112" cy="44" r="9" fill="#fff"/><circle cx="96" cy="45" r="3.5" fill="#222"/><circle cx="114" cy="45" r="3.5" fill="#222"/><circle cx="174" cy="62" r="2" fill="#2f6b27"/>'],
    ['earring', '<circle cx="78" cy="78" r="6" fill="none" stroke="#f0913a" stroke-width="3"/>'],
    ['necklace', '<path d="M76,92 q26,26 52,0" fill="none" stroke="#e0b030" stroke-width="3"/><circle cx="102" cy="112" r="7" fill="#e0b030"/><text x="102" y="116" font-size="10" text-anchor="middle" fill="#8a5a00" font-family="sans-serif">$</text>'],
    ['bowtie', '<path d="M102,96 l-14,-8 v16 z M102,96 l14,-8 v16 z" fill="#2c3e8c"/><circle cx="102" cy="96" r="3.5" fill="#1d2a66"/>'],
    ['hat', '<ellipse cx="100" cy="36" rx="34" ry="7" fill="#e0a526"/><path d="M80,36 q20,-34 40,0 z" fill="#e8b84a"/><rect x="81" y="30" width="38" height="5" fill="#8a5a00"/>'],
    ['cap', '<path d="M74,38 q26,-34 52,0 z" fill="#2c3e8c"/><path d="M120,36 h30 a4,4 0 0 1 0,6 h-34 z" fill="#1d2a66"/>'],
    ['hairbow', '<path d="M100,24 l-16,-10 v20 z M100,24 l16,-10 v20 z" fill="#e84f9a"/><circle cx="100" cy="24" r="4.5" fill="#c2357a"/>'],
];

function crocSVG(items) {
    const on = new Set(items || []);
    const body = CROC_PARTS.filter(([id]) => id === 'base' || on.has(id)).map(([, svg]) => svg).join('');
    return `<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="鱷魚">${body}</svg>`;
}

function boardHTML(board, cls = '') {
    return board.map((card, i) =>
        `<button class="ncard ${cls}" data-card="${i}">${card.map((n) => `<span>${n}</span>`).join('')}</button>`
    ).join('');
}

if (typeof module !== 'undefined') {
    module.exports = { shuffle, makeBoard, pickItems, makeRound, answerOf, findCard, scoreAnswers, crocSVG, HEADWEAR, MAX_ITEMS };
}
