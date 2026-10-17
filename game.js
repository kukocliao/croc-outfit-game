// 純遊戲邏輯＋角色 SVG：host / player / duel 共用，node test.js 也能直接跑
// 每個角色：groups 裡每組最多戴一件（頭上一頂、脖子一條），other 是其餘配件
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

function pickItems(rng = Math.random, char = 'croc') {
    const c = CHARS[char];
    const count = 1 + Math.floor(rng() * MAX_ITEMS);
    const pool = shuffle([...c.groups.map((g) => g[Math.floor(rng() * g.length)]), ...c.other], rng);
    return pool.slice(0, count);
}

// 乘數卡每 3 題換一張，跟桌遊「疊上新的乘數卡」的節奏差不多
function makeRound(n, prevMult, rng = Math.random, char = 'croc') {
    const mult = (n - 1) % 3 === 0 || !prevMult ? 1 + Math.floor(rng() * 10) : prevMult;
    return { n, items: pickItems(rng, char), mult, char };
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

// ── 角色 SVG：底圖分層畫（'base' 一定畫），配件依 items 開關 ──
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

// ── 摺耳貓：照影片定稿（cube-animation-work 的 actors.ts CAT）的配色與比例改寫成 SVG ──
// 原點在腳底中央，身體 210×320、圓角 74；招牌的毛帽、圍巾、大衣、黑手套在這裡都算配件
const INK = '#3b3330';
const stk = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const BODY_RECT = 'x="-105" y="-320" width="210" height="320" rx="74"';
const whiskers = [-1, 1].map((sd) => [0, 1, 2].map((i) => {
    const y0 = -230 + i * 11;
    return `M${sd * 63},${y0} Q${sd * 105},${y0 - 6 + i * 4} ${sd * 131},${y0 - 8 + i * 8}`;
}).join(' ')).join(' ');
const CAT_PARTS = [
    ['base', `<path d="M80,-30 Q160,-40 150,-130" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/><path d="M80,-30 Q160,-40 150,-130" fill="none" stroke="#F3DDA6" stroke-width="16" stroke-linecap="round"/>`],
    ['tailbow', `<path d="M150,-132 l-22,-13 v26 z M150,-132 l22,-13 v26 z" fill="#e84f9a" ${stk(3)}/><circle cx="150" cy="-132" r="6" fill="#c2357a" ${stk(3)}/>`],
    ['base', `<rect x="-62" y="-14" width="26" height="36" rx="8" fill="#F3DDA6" ${stk(4)}/><rect x="36" y="-14" width="26" height="36" rx="8" fill="#F3DDA6" ${stk(4)}/>`],
    ['socks', `<rect x="-62" y="0" width="26" height="16" fill="#7b3fa0" ${stk(3)}/><rect x="36" y="0" width="26" height="16" fill="#7b3fa0" ${stk(3)}/><rect x="-62" y="0" width="26" height="5" fill="#f0913a"/><rect x="36" y="0" width="26" height="5" fill="#f0913a"/>`],
    ['boots', `<path d="M-64,12 h30 v14 h-36 a6,6 0 0 1 6,-14z" fill="#2c3e8c" ${stk(3)}/><path d="M34,12 h30 v14 h-36 a6,6 0 0 1 6,-14z" fill="#2c3e8c" ${stk(3)}/>`],
    ['base', `<defs><clipPath id="catClip"><rect ${BODY_RECT}/></clipPath><linearGradient id="catBlush" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0A060" stop-opacity=".55"/><stop offset="1" stop-color="#F0A060" stop-opacity="0"/></linearGradient></defs><rect ${BODY_RECT} fill="#F3DDA6"/><rect x="-105" y="-320" width="210" height="60" fill="url(#catBlush)" clip-path="url(#catClip)"/>`],
    ['coat', `<g clip-path="url(#catClip)"><rect x="-105" y="-170" width="210" height="170" fill="#EDCF8E"/><rect x="-105" y="-64" width="210" height="64" fill="${INK}" opacity=".07"/></g><path d="M4,-160 Q6,-96 3,-6" fill="none" stroke="${INK}" stroke-opacity=".55" stroke-width="3"/>${[-122, -80, -38].map((y) => `<circle cx="-10" cy="${y}" r="9" fill="#FBF7EE" ${stk(3)}/>`).join('')}<rect x="-20" y="-7" width="40" height="14" rx="4" fill="#E6E2D8" ${stk(3)} transform="translate(63 -26) rotate(22)"/><rect x="-20" y="-7" width="40" height="14" rx="4" fill="#E6E2D8" ${stk(3)} transform="translate(-63 -26) rotate(-22)"/>`],
    ['belt', `<g clip-path="url(#catClip)"><rect x="-105" y="-62" width="210" height="16" fill="#8a3fa0"/></g><rect x="-12" y="-66" width="24" height="24" rx="3" fill="none" stroke="#e0b030" stroke-width="4"/>`],
    ['base', `<rect ${BODY_RECT} fill="none" ${stk(5)}/><path d="M99,-298 Q121,-290 117,-262 Q103,-270 91,-268 Z" fill="#F3DDA6" ${stk(4)}/><path d="M-99,-298 Q-121,-290 -117,-262 Q-103,-270 -91,-268 Z" fill="#F3DDA6" ${stk(4)}/><path d="M-50,-256 A8,8 0 0 0 -34,-256 Z M34,-256 A8,8 0 0 0 50,-256 Z" fill="${INK}"/><path d="M-64,-254 L-22,-257 M20,-258 L62,-255" ${stk(4.5)}/><path d="M-7,-234 Q0,-237 7,-234 Q2,-225 0,-225 Q-2,-225 -7,-234 Z" fill="${INK}"/><path d="M0,-225 V-220 M0,-220 Q-6,-214 -13,-218 M0,-220 Q6,-214 13,-218 ${whiskers}" fill="none" ${stk(3.5)}/>`],
    ['glasses', `<circle cx="-42" cy="-254" r="21" fill="#fff" fill-opacity=".25" ${stk(4)}/><circle cx="42" cy="-254" r="21" fill="#fff" fill-opacity=".25" ${stk(4)}/><path d="M-21,-256 Q0,-264 21,-256" fill="none" ${stk(4)}/>`],
    ['earring', `<circle cx="112" cy="-256" r="8" fill="none" stroke="#f0913a" stroke-width="4"/>`],
    ['scarf', `<path d="M-111,-190 Q0,-170 111,-190 L109,-158 Q0,-136 -109,-158 Z" fill="#9E2F4E" ${stk(4)}/><g transform="translate(-55 -162) rotate(7)"><rect x="-18" y="0" width="36" height="84" rx="6" fill="#9E2F4E" ${stk(4)}/><path d="M-12,84 l1,14 M-4,84 l1,14 M4,84 l1,14 M12,84 l1,14" ${stk(3)}/></g>`],
    ['bowtie', `<path d="M0,-178 l-26,-15 v30 z M0,-178 l26,-15 v30 z" fill="#2c3e8c" ${stk(3)}/><circle cx="0" cy="-178" r="6" fill="#1d2a66" ${stk(3)}/>`],
    ['base', `<path d="M-100,-150 Q-130,-130 -138,-92 M100,-150 Q130,-130 138,-92" fill="none" ${stk(5)}/>`],
    ['coat', `<circle cx="-134" cy="-104" r="12" fill="#EDCF8E" ${stk(3.5)}/><circle cx="134" cy="-104" r="12" fill="#EDCF8E" ${stk(3.5)}/>`],
    ['base', `<circle cx="-138" cy="-92" r="10.5" fill="#F3DDA6" ${stk(3.5)}/><circle cx="138" cy="-92" r="10.5" fill="#F3DDA6" ${stk(3.5)}/>`],
    ['mitten', `<circle cx="138" cy="-92" r="13" fill="#3F3D40" ${stk(3.5)}/>`],
    ['watch', `<rect x="-8" y="-6" width="16" height="12" rx="3" fill="#e0b030" ${stk(3)} transform="translate(-130 -112) rotate(60)"/>`],
    ['bag', `<path d="M-152,-88 Q-138,-114 -124,-88" fill="none" ${stk(4)}/><rect x="-164" y="-88" width="52" height="36" rx="5" fill="#3a3a44" ${stk(3)}/>`],
    ['beanie', `<path d="M-94.5,-308 Q-92.4,-382 10.5,-384 Q88.2,-380 98.7,-308 Z" fill="#6E6D72" ${stk(4)}/><path d="M-52,-324 Q-58,-354 -32,-376 M0,-324 Q0,-354 0,-376 M52,-324 Q58,-354 32,-376" fill="none" stroke="${INK}" stroke-opacity=".25" stroke-width="3"/><rect x="-105" y="-328" width="210" height="30" rx="14" fill="#FBF7EE" ${stk(4)}/><circle cx="97" cy="-342" r="21" fill="#FBF7EE" ${stk(4)}/>`],
    ['strawhat', `<ellipse cx="0" cy="-316" rx="150" ry="20" fill="#E8C468" ${stk(4)}/><path d="M-70,-318 Q-62,-395 0,-395 Q62,-395 70,-318 Z" fill="#E8C468" ${stk(4)}/><rect x="-68" y="-338" width="136" height="14" fill="#c0392b"/>`],
    ['hairbow', `<path d="M-60,-322 l-26,-16 v32 z M-60,-322 l26,-16 v32 z" fill="#e84f9a" ${stk(3)}/><circle cx="-60" cy="-322" r="7" fill="#c2357a" ${stk(3)}/>`],
];

const CHARS = {
    croc: {
        name: '鱷魚', emoji: '🐊', viewBox: '0 0 200 250', parts: CROC_PARTS,
        groups: [['hat', 'cap', 'hairbow']],
        other: ['bowtie', 'necklace', 'shirt', 'pants', 'belt', 'bag', 'watch', 'earring', 'socks', 'boots', 'tailbow'],
    },
    cat: {
        name: '摺耳貓', emoji: '🐱', viewBox: '-175 -400 350 432', parts: CAT_PARTS,
        groups: [['beanie', 'strawhat', 'hairbow'], ['scarf', 'bowtie']],
        other: ['coat', 'mitten', 'glasses', 'earring', 'bag', 'belt', 'socks', 'boots', 'tailbow', 'watch'],
    },
};

function charSVG(items, char = 'croc') {
    const c = CHARS[char] || CHARS.croc;
    const on = new Set(items || []);
    const body = c.parts.filter(([id]) => id === 'base' || on.has(id)).map(([, svg]) => svg).join('');
    return `<svg viewBox="${c.viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name}">${body}</svg>`;
}
function boardHTML(board, cls = '') {
    return board.map((card, i) =>
        `<button class="ncard ${cls}" data-card="${i}">${card.map((n) => `<span>${n}</span>`).join('')}</button>`
    ).join('');
}

if (typeof module !== 'undefined') {
    module.exports = { shuffle, makeBoard, pickItems, makeRound, answerOf, findCard, scoreAnswers, charSVG, CHARS, MAX_ITEMS };
}
