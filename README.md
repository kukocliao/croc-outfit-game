# 🐊 鱷魚穿搭 croc-outfit-game

改編自桌遊 Crocs' Outfit（BS GA369）的多人網頁版。數角色身上的配件，乘上（或加上）乘數卡，在 25 張數字卡（1–100）裡最快找到答案。角色是自己畫的 SVG，配件每題隨機組合。

角色開局時選（定義在 `game.js` 的 `CHARS`）：
- 🐱 摺耳貓：短影音裡的貓（配色比例照 cube-animation-work 的 actors.ts）；招牌毛帽、圍巾、大衣、黑手套也算配件
- 🐊 鱷魚：第一版角色，git tag `croc-v1` 是只有鱷魚的原始版本

## 三種玩法

| 頁面 | 用途 |
|---|---|
| `host.html` | 大螢幕主控端：顯示鱷魚和乘數卡、計時、計分、排行榜 |
| `player.html` | 玩家手機：點選含有答案的數字卡 |
| `duel.html` | 平板雙人對戰：畫面上下各一半，純本機，不連網 |
| `group.html` | 一台電腦投影的團體模式：大家喊答案，帶領者點卡；全場合作或分 2–4 隊，純本機 |

## 難度設定

開局時選，三種快速預設，也能逐項調（上次的設定會記在瀏覽器裡）：

| 預設 | 玩法 | 盤面 | 計時 | 配件 | 計分 |
|---|---|---|---|---|---|
| 長者 | 只數配件 | 大字 9 張（每題重洗，干擾數字取答案附近） | 不計時 | 最多 5 件 | 答對就 1 分 |
| 兒童 | 數完加乘數 | 25 張（1–100） | 30 秒 | 最多 8 件 | 越快分越高 |
| 一般 | 數完乘乘數 | 25 張（1–100） | 10 秒 | 最多 8 件 | 越快分越高 |

每局 10 題，乘數卡每 3 題換一張；答錯這題鎖住。

## Firebase 設定（第一次要做）

沿用 `spot-the-difference-10a2b` 專案，房間路徑 `rooms/crocoutfit-main`。

1. Firebase 後台 → Authentication → Sign-in method → 開啟「匿名」
2. Realtime Database → 規則 → 貼上 `database.rules.json` 全文 → 發布
   （這份檔案也包含 spot-the-difference 和 speed-colors 的規則，整份貼上才不會弄壞舊遊戲）
3. Authentication → 設定 → 授權網域，確認有 `kukocliao.github.io`

## 安全設計

- 玩家用匿名登入的 uid 當 key，規則限制只能寫自己的 `players/{uid}` 和 `answers/{題號}/{uid}`
- 作答只在 `phase === 'answer'`、題號相符、時間沒到時才能寫，而且每題只能寫一次
- `state`、`scores` 只有主控端（`hostUid`）能寫；計分也由主控端判定
- 主控端第一次開啟時綁定 `hostUid`。換裝置當主控端：到 Firebase 後台刪掉 `rooms/crocoutfit-main/hostUid`

## 開發注意

- 改了 js / css 要把 html 裡 `?v=` 版本號加一，避免玩家吃到舊快取
- 專案在 iCloud 上：不要 `git status` 掃整個 repo，`git add` 只加指定檔案
- 測試：`node test.js`
