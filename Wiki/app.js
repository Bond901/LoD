/**
 * 怪物掉落物品查詢系統 - 主程式
 */
(function () {
  'use strict';

  // ---- Data Storage ----
  let DATA = {
    maps: [],       // mapids.json
    npcs: [],       // npc.json
    spawns: [],     // spawnlist.json
    drops: [],      // droplist.json
    dropsMap: [],   // droplist_map.json
    etcitems: [],   // etcitem.json
    weapons: [],    // weapon.json
    armors: [],     // armor.json
    bosses: [],     // server_boss.json
  };

  // ---- Lookup Indexes ----
  let IDX = {
    npcById: {},          // npcid -> npc object
    itemById: {},         // itemId -> { data, type: 'weapon'|'armor'|'etc' }
    spawnsByMap: {},       // mapid -> [spawn entries]
    spawnsByNpc: {},       // npc_templateid -> [spawn entries]
    dropsByMob: {},       // mobId -> [drop entries]
    dropsMapByMap: {},    // mapid -> [droplist_map entries]
    mapById: {},          // mapid -> map object
  };

  // ---- State ----
  let currentTab = 'map';  // 'map', 'monster', or 'item'
  let expandedCards = new Set();

  // ---- DOM Elements ----
  const $loading = document.getElementById('loading-overlay');
  const $tabMap = document.getElementById('tab-map');
  const $tabMonster = document.getElementById('tab-monster');
  const $tabItem = document.getElementById('tab-item');
  const $searchInput = document.getElementById('search-input');
  const $clearBtn = document.getElementById('clear-btn');
  const $searchResults = document.getElementById('search-results');
  const $resultMap = document.getElementById('result-map');
  const $resultMonster = document.getElementById('result-monster');
  const $resultItem = document.getElementById('result-item');
  const $placeholder = document.getElementById('placeholder');
  const $mapHeader = document.getElementById('map-header');
  const $mapMonsterList = document.getElementById('map-monster-list');
  const $monsterHeader = document.getElementById('monster-header');
  const $monsterMaps = document.getElementById('monster-maps');
  const $monsterDrops = document.getElementById('monster-drops');
  const $itemHeader = document.getElementById('item-header');
  const $itemDropperList = document.getElementById('item-dropper-list');

  // ==========================
  // Data Loading
  // ==========================
  async function loadJSON(path) {
    const res = await fetch(path);
    return res.json();
  }

  async function loadAllData() {
    const [maps, npcs, spawns, drops, dropsMap, etcitems, weapons, armors, bosses] = await Promise.all([
      loadJSON('data_json/mapids.json'),
      loadJSON('data_json/npc.json'),
      loadJSON('data_json/spawnlist.json'),
      loadJSON('data_json/droplist.json'),
      loadJSON('data_json/droplist_map.json'),
      loadJSON('data_json/etcitem.json'),
      loadJSON('data_json/weapon.json'),
      loadJSON('data_json/armor.json'),
      fetch('data_json/server_boss.json').then(r => r.ok ? r.json() : []),
    ]);

    DATA.maps = maps;
    DATA.npcs = npcs;
    DATA.spawns = spawns;
    DATA.drops = drops;
    DATA.dropsMap = dropsMap;
    DATA.etcitems = etcitems;
    DATA.weapons = weapons;
    DATA.armors = armors;
    DATA.bosses = bosses || [];

    buildIndexes();
  }

  // ==========================
  // Build Indexes
  // ==========================
  function buildIndexes() {
    // NPC by ID
    for (const npc of DATA.npcs) {
      IDX.npcById[npc.npcid] = npc;
    }

    // Map by ID
    for (const m of DATA.maps) {
      IDX.mapById[m.mapid] = m;
    }

    // Items by ID (with type tag)
    for (const w of DATA.weapons) {
      IDX.itemById[w.item_id] = { data: w, type: 'weapon' };
    }
    for (const a of DATA.armors) {
      IDX.itemById[a.item_id] = { data: a, type: 'armor' };
    }
    for (const e of DATA.etcitems) {
      IDX.itemById[e.item_id] = { data: e, type: 'etc' };
    }

    // Spawns by map & by NPC
    for (const s of DATA.spawns) {
      if (!IDX.spawnsByMap[s.mapid]) IDX.spawnsByMap[s.mapid] = [];
      IDX.spawnsByMap[s.mapid].push(s);

      if (!IDX.spawnsByNpc[s.npc_templateid]) IDX.spawnsByNpc[s.npc_templateid] = [];
      IDX.spawnsByNpc[s.npc_templateid].push(s);
    }

    // Drops by mob
    for (const d of DATA.drops) {
      if (!IDX.dropsByMob[d.mobId]) IDX.dropsByMob[d.mobId] = [];
      IDX.dropsByMob[d.mobId].push(d);
    }

    // Reverse drops: itemId -> [drop entries]
    IDX.dropsByItem = {};
    for (const d of DATA.drops) {
      if (!IDX.dropsByItem[d.itemId]) IDX.dropsByItem[d.itemId] = [];
      IDX.dropsByItem[d.itemId].push(d);
    }

    // Drops map by mapid and by itemid
    IDX.dropsMapByItemId = {};
    for (const dm of DATA.dropsMap) {
      if (!IDX.dropsMapByMap[dm.mapid]) IDX.dropsMapByMap[dm.mapid] = [];
      IDX.dropsMapByMap[dm.mapid].push(dm);

      if (!IDX.dropsMapByItemId[dm.itemid]) IDX.dropsMapByItemId[dm.itemid] = [];
      IDX.dropsMapByItemId[dm.itemid].push(dm);
    }

    // Boss indexes
    IDX.bossByNpcId = {};   // npc_templateid -> [boss entries]
    IDX.bossByMapId = {};   // mapid -> [boss entries]
    for (const b of DATA.bosses) {
      if (!IDX.bossByNpcId[b.npc_templateid]) IDX.bossByNpcId[b.npc_templateid] = [];
      IDX.bossByNpcId[b.npc_templateid].push(b);

      if (!IDX.bossByMapId[b.mapid]) IDX.bossByMapId[b.mapid] = [];
      IDX.bossByMapId[b.mapid].push(b);
    }
  }

  // ==========================
  // Helpers
  // ==========================

  /** Convert chance (per 1,000,000) to percentage string */
  function chanceToPercent(chance) {
    const pct = chance / 10000;
    if (pct >= 1) return pct.toFixed(1) + '%';
    if (pct >= 0.01) return pct.toFixed(2) + '%';
    return pct.toFixed(3) + '%';
  }

  /** Get display name for NPC (prefer nameid-related or name) */
  function npcDisplayName(npc) {
    return npc.name || 'Unknown';
  }

  /** Get item type icon */
  function itemIcon(type) {
    switch (type) {
      case 'weapon': return '🗡️';
      case 'armor': return '🛡️';
      default: return '📦';
    }
  }

  /** Get item type label */
  function itemTypeLabel(type) {
    switch (type) {
      case 'weapon': return '武器';
      case 'armor': return '防具';
      default: return '雜物';
    }
  }

  /** Determine item type from itemId using the note or ID lookup */
  function getItemInfo(itemId) {
    const entry = IDX.itemById[itemId];
    if (entry) {
      return { name: entry.data.name, type: entry.type };
    }
    return { name: `未知道具 (${itemId})`, type: 'etc' };
  }

  /** Get unique monsters for a map from spawnlist + boss list */
  function getMonstersInMap(mapid) {
    const seen = new Map(); // npc_templateid -> { npc, totalCount, bossList }

    // Regular spawns
    const spawns = IDX.spawnsByMap[mapid] || [];
    for (const s of spawns) {
      const npc = IDX.npcById[s.npc_templateid];
      if (!npc) continue;
      if (seen.has(s.npc_templateid)) {
        seen.get(s.npc_templateid).totalCount += s.count;
      } else {
        seen.set(s.npc_templateid, { npc, totalCount: s.count, bossList: [] });
      }
    }

    // Boss spawns — include even if not in spawnlist
    const bossEntries = IDX.bossByMapId ? (IDX.bossByMapId[mapid] || []) : [];
    for (const b of bossEntries) {
      const npc = IDX.npcById[b.npc_templateid];
      if (!npc) continue;
      if (seen.has(b.npc_templateid)) {
        seen.get(b.npc_templateid).bossList.push(b);
      } else {
        seen.set(b.npc_templateid, { npc, totalCount: 0, bossList: [b] });
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.npc.lvl - b.npc.lvl);
  }

  /** Get maps where a monster spawns (regular + boss) */
  function getMapsForMonster(npcid) {
    const seen = new Map(); // mapid -> { mapid, name, totalCount, bossList }

    // Regular spawns
    const spawns = IDX.spawnsByNpc[npcid] || [];
    for (const s of spawns) {
      const map = IDX.mapById[s.mapid];
      const name = map ? map.locationname : (s.mapnote || `地圖 ${s.mapid}`);
      if (!seen.has(s.mapid)) {
        seen.set(s.mapid, { mapid: s.mapid, name, totalCount: s.count, bossList: [] });
      } else {
        seen.get(s.mapid).totalCount += s.count;
      }
    }

    // Boss spawns
    const bossEntries = IDX.bossByNpcId ? (IDX.bossByNpcId[npcid] || []) : [];
    for (const b of bossEntries) {
      const map = IDX.mapById[b.mapid];
      const name = map ? map.locationname : `地圖 ${b.mapid}`;
      if (!seen.has(b.mapid)) {
        seen.set(b.mapid, { mapid: b.mapid, name, totalCount: 0, bossList: [b] });
      } else {
        seen.get(b.mapid).bossList.push(b);
      }
    }

    return Array.from(seen.values());
  }

  // ==========================
  // Tab Logic
  // ==========================
  function switchTab(tab) {
    currentTab = tab;
    $tabMap.classList.toggle('active', tab === 'map');
    $tabMonster.classList.toggle('active', tab === 'monster');
    $tabItem.classList.toggle('active', tab === 'item');
    const placeholders = { map: '輸入地圖名稱搜尋...', monster: '輸入怪物名稱搜尋...', item: '輸入道具名稱搜尋...' };
    $searchInput.placeholder = placeholders[tab] || '搜尋...';
    $searchInput.value = '';
    $clearBtn.classList.remove('visible');
    $searchResults.classList.remove('visible');
    showPlaceholder();
  }

  // ==========================
  // Search Logic
  // ==========================
  function performSearch(query) {
    if (!query.trim()) {
      $searchResults.classList.remove('visible');
      return;
    }

    const q = query.trim().toLowerCase();
    let results = [];

    if (currentTab === 'map') {
      results = DATA.maps
        .filter(m => m.locationname.toLowerCase().includes(q))
        .slice(0, 50)
        .map(m => ({
          id: m.mapid,
          name: m.locationname,
          sub: `ID: ${m.mapid}`,
          icon: '📍',
        }));
    } else if (currentTab === 'monster') {
      // Search monsters - deduplicate by npcid
      const seen = new Map();
      for (const npc of DATA.npcs) {
        const displayName = npcDisplayName(npc);
        if (!displayName.toLowerCase().includes(q)) continue;
        if (!npc.impl || !npc.impl.includes('Monster')) continue;
        if (!seen.has(npc.npcid)) {
          seen.set(npc.npcid, {
            id: npc.npcid,
            name: displayName + (npc.note ? ` (${npc.note})` : '') + (npc.npcid ? ` (${npc.npcid})` : ''),
            sub: `Lv.${npc.lvl}`,
            icon: '👹',
          });
        }
        if (seen.size >= 50) break;
      }
      results = Array.from(seen.values());
    } else {
      // Search items across weapon, armor, etcitem
      const seen = new Map();
      const allItems = [
        ...DATA.weapons.map(d => ({ id: d.item_id, name: d.name, icon: '🗡️' })),
        ...DATA.armors.map(d => ({ id: d.item_id, name: d.name, icon: '🛡️' })),
        ...DATA.etcitems.map(d => ({ id: d.item_id, name: d.name, icon: '📦' })),
      ];
      for (const it of allItems) {
        if (!it.name || !it.name.toLowerCase().includes(q)) continue;
        if (!seen.has(it.id)) {
          seen.set(it.id, { id: it.id, name: it.name, sub: `ID: ${it.id}`, icon: it.icon });
        }
        if (seen.size >= 50) break;
      }
      results = Array.from(seen.values());
    }

    renderSearchResults(results);
  }

  function renderSearchResults(results) {
    if (results.length === 0) {
      $searchResults.innerHTML = '<div class="no-results">沒有找到符合的結果</div>';
      $searchResults.classList.add('visible');
      return;
    }

    $searchResults.innerHTML = results.map(r => `
      <div class="search-result-item" data-id="${r.id}">
        <span class="result-icon">${r.icon}</span>
        <span class="result-name">${escapeHtml(r.name)}</span>
        <span class="result-sub">${escapeHtml(r.sub)}</span>
      </div>
    `).join('');

    $searchResults.classList.add('visible');

    // Bind click events
    $searchResults.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        $searchResults.classList.remove('visible');
        if (currentTab === 'map') {
          selectMap(id);
        } else if (currentTab === 'monster') {
          selectMonster(id);
        } else if (currentTab === 'item') {
          selectItem(id);
        }
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==========================
  // Show / Hide Panels
  // ==========================
  function showPlaceholder() {
    $placeholder.style.display = '';
    $resultMap.style.display = 'none';
    $resultMonster.style.display = 'none';
    $resultItem.style.display = 'none';
    expandedCards.clear();
  }

  function showMapResult() {
    $placeholder.style.display = 'none';
    $resultMap.style.display = '';
    $resultMonster.style.display = 'none';
    $resultItem.style.display = 'none';
    expandedCards.clear();
  }

  function showMonsterResult() {
    $placeholder.style.display = 'none';
    $resultMap.style.display = 'none';
    $resultMonster.style.display = '';
    $resultItem.style.display = 'none';
    expandedCards.clear();
  }

  function showItemResult() {
    $placeholder.style.display = 'none';
    $resultMap.style.display = 'none';
    $resultMonster.style.display = 'none';
    $resultItem.style.display = '';
    expandedCards.clear();
  }

  // ==========================
  // Map Mode
  // ==========================
  function selectMap(mapid) {
    const map = IDX.mapById[mapid];
    if (!map) return;

    $searchInput.value = map.locationname;
    $clearBtn.classList.add('visible');
    showMapResult();

    // Render header
    $mapHeader.innerHTML = `
      <div class="result-title">📍 ${escapeHtml(map.locationname)}</div>
      <div class="result-meta">
        <span class="meta-tag">地圖 ID: ${map.mapid}</span>
        <span class="meta-tag">怪物倍率: ${map.monster_amount}x</span>
        <span class="meta-tag">掉落倍率: ${map.drop_rate}x</span>
      </div>
    `;

    // Get monsters
    const monsters = getMonstersInMap(mapid);

    // Render monster list
    let html = '<div class="section-title">👹 出沒怪物列表</div>';

    if (monsters.length === 0) {
      html += '<div class="no-drops">此地圖沒有怪物出沒資料</div>';
    } else {
      for (const { npc, totalCount, bossList } of monsters) {
        const drops = IDX.dropsByMob[npc.npcid] || [];
        html += renderMonsterCard(npc, totalCount, drops, bossList);
      }
    }

    // Map extra drops
    const extraDrops = IDX.dropsMapByMap[mapid] || [];
    if (extraDrops.length > 0) {
      html += `
        <div class="extra-drops-section">
          <div class="section-title">🎁 地圖額外掉落</div>
          ${renderDropItems(extraDrops.map(d => ({
        itemId: d.itemid,
        min: d.min,
        max: d.max,
        chance: d.chance,
        note: [d.note, d.itemnote].filter(Boolean).join(' '),
      })))}
        </div>
      `;
    }

    $mapMonsterList.innerHTML = html;
    bindMonsterCardEvents($mapMonsterList);
  }

  // ==========================
  // Monster Mode
  // ==========================
  function selectMonster(npcid) {
    const npc = IDX.npcById[npcid];
    if (!npc) return;

    $searchInput.value = npcDisplayName(npc);
    $clearBtn.classList.add('visible');
    showMonsterResult();

    // Header
    const weakAttrLabel = (() => {
      const map = { 0: '無', 1: '🔥火', 2: '💧水', 4: '🌪️風', 8: '🌍地', 16: '✨光', 32: '🌑暗' };
      return map[npc.weakAttr] || `${npc.weakAttr}`;
    })();
    const sizeLabel = { small: '小型', medium: '中型', large: '大型' }[npc.size] || npc.size;
    const boolTag = (v, label) => v ? `<span class="meta-tag meta-tag-on">${label}</span>` : '';
    $monsterHeader.innerHTML = `
      <div class="result-title">👹 ${escapeHtml(npcDisplayName(npc))}${npc.note ? ` <span style="color:var(--text-muted);font-size:0.85rem">(${escapeHtml(npc.note)})</span>` : ''}</div>
      <div class="result-meta">
        <span class="meta-tag">Lv. ${npc.lvl}</span>
        <span class="meta-tag">HP: ${npc.hp}</span>
        <span class="meta-tag">MP: ${npc.mp}</span>
        <span class="meta-tag">EXP: ${npc.exp}</span>
        <span class="meta-tag">AC: ${npc.ac}</span>
        <span class="meta-tag">MR: ${npc.mr}</span>
        <span class="meta-tag">體型: ${sizeLabel}</span>
        <span class="meta-tag">弱點: ${weakAttrLabel}</span>
      </div>
      <div class="result-meta" style="margin-top:6px">
        <span class="meta-tag">STR: ${npc.str}</span>
        <span class="meta-tag">CON: ${npc.con}</span>
        <span class="meta-tag">DEX: ${npc.dex}</span>
        <span class="meta-tag">WIS: ${npc.wis}</span>
        <span class="meta-tag">INT: ${npc.intel}</span>
        ${npc.damage_reduction > 0 ? `<span class="meta-tag">傷害減免: ${npc.damage_reduction}</span>` : ''}
        ${npc.lawful !== 0 ? `<span class="meta-tag">正義值: ${npc.lawful}</span>` : ''}
        ${npc.karma !== 0 ? `<span class="meta-tag">友好度: ${Math.abs(npc.karma)}</span>`  : ''}
        ${npc.hpr > 0 ? `<span class="meta-tag">HP回復: ${npc.hpr}/${npc.hprinterval}s</span>` : ''}
      </div>
      <div class="result-meta" style="margin-top:6px">
        ${boolTag(npc.agro, '⚔️ 主動')}
        ${boolTag(npc.undead, '💀 不死')}
        ${boolTag(npc.IsTU, '🔄 起死回生')}
        ${boolTag(npc.agrososc, '👀 識破變形')}
        ${boolTag(npc.poison_atk, '☠️ 毒素')}
        ${boolTag(npc.paralysis_atk, '⚡ 麻痺')}
        ${boolTag(npc.ranged, '🏹 遠程')}
        ${boolTag(npc.tamable, '🐾 可迷魅')}
        ${boolTag(npc.teleport, '🌀 瞬移')}
        ${boolTag(npc.hard, '💪 硬皮')}
        ${npc.agrofamily > 0 ? `
        <span class="meta-tag">互助: ${npc.agrofamily === 1 ? '種族' : '所有 NPC'}</span>` : ''}
        ${npc.family && npc.family !== "" ? `<span class="meta-tag">種族: ${escapeHtml(npc.family)}</span>` : ''}
      </div>
    `;

    // Maps
    const maps = getMapsForMonster(npcid);
    if (maps.length > 0) {
      $monsterMaps.innerHTML = `
        <div class="section-title">📍 出沒地圖</div>
        <div class="map-tag-list">
          ${maps.map(m => {
        const bossInfos = (m.bossList || []).map(b => {
          const interval = b.spawn_interval >= 60
            ? `${Math.floor(b.spawn_interval / 60)}h${b.spawn_interval % 60 > 0 ? (b.spawn_interval % 60) + 'm' : ''}`
            : `${b.spawn_interval}m`;
          const loc = b.location ? escapeHtml(b.location) : '';
          return `<span class="boss-inline-tag" title="${loc}">⭐ BOSS 刷新:${interval}</span>`;
        }).join('');
        const countTag = m.totalCount > 0 ? `(${m.totalCount}隻)` : '';
        return `<span class="map-tag">🗺️ ${escapeHtml(m.name)} ${countTag}${bossInfos}</span>`;
      }).join('')}
        </div>
      `;
    } else {
      $monsterMaps.innerHTML = `
        <div class="section-title">📍 出沒地圖</div>
        <div class="no-drops">沒有出沒資料</div>
      `;
    }

    // Drops
    const drops = IDX.dropsByMob[npcid] || [];
    let dropsHtml = '<div class="section-title">💎 掉落物品列表</div>';
    if (drops.length === 0) {
      dropsHtml += '<div class="no-drops">沒有掉落物品資料</div>';
    } else {
      dropsHtml += renderDropItems(drops.map(d => ({
        itemId: d.itemId,
        min: d.min,
        max: d.max,
        chance: d.chance,
        note: d.note,
      })));
    }
    $monsterDrops.innerHTML = dropsHtml;
  }

  // ==========================
  // Rendering Helpers
  // ==========================
  function renderMonsterCard(npc, totalCount, drops, bossList = []) {
    const id = npc.npcid;
    const isBoss = bossList.length > 0;
    const bossTag = isBoss ? `<span class="boss-card-badge">⭐ BOSS</span>` : '';
    const bossDetails = isBoss ? bossList.map(b => {
      const interval = b.spawn_interval >= 60
        ? `${Math.floor(b.spawn_interval / 60)}h${b.spawn_interval % 60 > 0 ? (b.spawn_interval % 60) + 'm' : ''}`
        : `${b.spawn_interval}m`;
      const loc = b.location ? escapeHtml(b.location) : '';
      return `<span class="boss-spawn-info" title="${loc}">刷新: ${interval}${b.exist_time > 0 ? `  存在: ${b.exist_time}m` : ''}</span>`;
    }).join('') : '';
    const countDisplay = totalCount > 0 ? `<span class="stat"><span class="stat-label">數量</span><span class="stat-value">${totalCount}</span></span>` : '';
    return `
      <div class="monster-card${isBoss ? ' boss-card' : ''}" data-npcid="${id}">
        <div class="monster-card-header">
          <span class="monster-name">${escapeHtml(npcDisplayName(npc))}${bossTag}${npc.note ? ` <span style="color:var(--text-muted);font-size:0.8rem">(${escapeHtml(npc.note)})</span>` : ''}</span>
          <div class="monster-stats">
            <span class="stat"><span class="stat-label">Lv.</span><span class="stat-value">${npc.lvl}</span></span>
            <span class="stat"><span class="stat-label">HP</span><span class="stat-value">${npc.hp}</span></span>
            <span class="stat"><span class="stat-label">EXP</span><span class="stat-value">${npc.exp}</span></span>
            ${countDisplay}
            ${bossDetails}
          </div>
          <span class="monster-toggle">▶</span>
        </div>
        <div class="monster-drops-content">
          <div class="drops-label">💎 掉落物品 (${drops.length} 項)</div>
          ${drops.length > 0 ? renderDropItems(drops.map(d => ({
      itemId: d.itemId,
      min: d.min,
      max: d.max,
      chance: d.chance,
      note: d.note,
    }))) : '<div class="no-drops">無掉落物品資料</div>'}
        </div>
      </div>
    `;
  }

  function renderDropItems(items) {
    return items.map(d => {
      const info = getItemInfo(d.itemId);
      const type = info.type;
      const name = d.note || info.name;
      const icon = itemIcon(type);
      const qty = d.min === d.max ? `${d.min}` : `${d.min}~${d.max}`;
      return `
        <div class="drop-item">
          <div class="drop-item-icon ${type}">${icon}</div>
          <span class="drop-item-name ${type}" title="${escapeHtml(name)} (${itemTypeLabel(type)})">${escapeHtml(name)}</span>
          <div class="drop-item-info">
            <span class="drop-chance">${chanceToPercent(d.chance)}</span>
            <span class="drop-quantity">x${qty}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function bindMonsterCardEvents(container) {
    container.querySelectorAll('.monster-card-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest('.monster-card');
        card.classList.toggle('expanded');
      });
    });
  }

  // ==========================
  // Item Mode
  // ==========================
  function selectItem(itemId) {
    const info = getItemInfo(itemId);
    $searchInput.value = info.name;
    $clearBtn.classList.add('visible');
    showItemResult();

    // Header — just item name, no type label
    $itemHeader.innerHTML = `
      <div class="result-title">${itemIcon(info.type)} ${escapeHtml(info.name)}</div>
    `;

    let html = '';

    // --- Monsters from droplist ---
    const dropEntries = IDX.dropsByItem[itemId] || [];
    if (dropEntries.length > 0) {
      html += '<div class="section-title">👹 掉落此道具的怪物</div>';
      html += '<div class="item-dropper-list">';
      for (const entry of dropEntries) {
        const npc = IDX.npcById[entry.mobId];
        if (!npc) continue;
        const maps = getMapsForMonster(npc.npcid);
        const qty = entry.min === entry.max ? `${entry.min}` : `${entry.min}~${entry.max}`;
        const mapsHtml = maps.length > 0
          ? maps.map(m => `<span class="dropper-map-tag">🗺️ ${escapeHtml(m.name)}</span>`).join('')
          : '<span class="dropper-map-tag" style="opacity:0.5">無出沒地圖資料</span>';
        html += `
          <div class="dropper-card">
            <div class="dropper-card-row">
              <span class="dropper-name">👹 ${escapeHtml(npcDisplayName(npc))}${npc.note ? ` <span style="color:var(--text-muted);font-size:0.8rem">(${escapeHtml(npc.note)})</span>` : ''}</span>
              <div class="dropper-stats">
                <span class="stat"><span class="stat-label">Lv.</span><span class="stat-value">${npc.lvl}</span></span>
                <span class="stat"><span class="stat-label">HP</span><span class="stat-value">${npc.hp}</span></span>
                <span class="drop-chance">${chanceToPercent(entry.chance)}</span>
                <span class="drop-quantity">x${qty}</span>
              </div>
            </div>
            <div class="dropper-maps">${mapsHtml}</div>
          </div>
        `;
      }
      html += '</div>';
    } else {
      html += '<div class="section-title">👹 掉落此道具的怪物</div>';
      html += '<div class="no-drops">沒有怪物掉落此道具的資料</div>';
    }

    // --- Map-specific drops (droplist_map) ---
    const mapDrops = IDX.dropsMapByItemId ? (IDX.dropsMapByItemId[itemId] || []) : [];
    if (mapDrops.length > 0) {
      html += '<div class="item-mapdrops-section">';
      html += '<div class="section-title" style="margin-bottom:var(--space-sm)">🗺️ 地圖限定掉落</div>';
      for (const dm of mapDrops) {
        const map = IDX.mapById[dm.mapid];
        const mapName = map ? map.locationname : `地圖 ${dm.mapid}`;
        const mobName = dm.note || `怪物 ${dm.mobid}`;
        const qty = dm.min === dm.max ? `${dm.min}` : `${dm.min}~${dm.max}`;
        html += `
          <div class="dropper-card" style="margin-bottom:var(--space-xs)">
            <div class="dropper-card-row">
              <span class="dropper-name">👹 ${escapeHtml(mobName)}</span>
              <div class="dropper-stats">
                <span class="drop-chance">${chanceToPercent(dm.chance)}</span>
                <span class="drop-quantity">x${qty}</span>
              </div>
            </div>
            <div class="dropper-maps"><span class="dropper-map-tag">🗺️ ${escapeHtml(mapName)}</span></div>
          </div>
        `;
      }
      html += '</div>';
    }

    $itemDropperList.innerHTML = html;
  }

  // ==========================
  // Event Listeners
  // ==========================
  function setupEvents() {
    // Tab clicks
    $tabMap.addEventListener('click', () => switchTab('map'));
    $tabMonster.addEventListener('click', () => switchTab('monster'));
    $tabItem.addEventListener('click', () => switchTab('item'));

    // Search input
    let debounceTimer;
    $searchInput.addEventListener('input', () => {
      const val = $searchInput.value;
      $clearBtn.classList.toggle('visible', val.length > 0);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => performSearch(val), 150);
    });

    $searchInput.addEventListener('focus', () => {
      if ($searchInput.value.trim()) {
        performSearch($searchInput.value);
      }
    });

    // Clear button
    $clearBtn.addEventListener('click', () => {
      $searchInput.value = '';
      $clearBtn.classList.remove('visible');
      $searchResults.classList.remove('visible');
      showPlaceholder();
      $searchInput.focus();
    });

    // Close search results on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-panel')) {
        $searchResults.classList.remove('visible');
      }
    });

    // Keyboard navigation
    $searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $searchResults.classList.remove('visible');
        $searchInput.blur();
      }
    });
  }

  // ==========================
  // Init
  // ==========================
  async function init() {
    setupEvents();
    try {
      await loadAllData();
      // Hide loading
      $loading.classList.add('hidden');
      setTimeout(() => { $loading.style.display = 'none'; }, 500);
    } catch (err) {
      console.error('資料載入失敗:', err);
      $loading.querySelector('.loading-text').textContent = '資料載入失敗，請重新整理頁面';
      $loading.querySelector('.loading-spinner').style.borderTopColor = 'var(--danger)';
    }
  }

  init();
})();
