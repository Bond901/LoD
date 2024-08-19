document.addEventListener('DOMContentLoaded', function() {
    // 設置 CSV 文件路徑
    const csvFilePath = 'csv/weapon_data.csv';
    const iconFolderPath = 'icon/'; // 設置圖標資料夾路徑

    // 渲染武器卡片的函數
    function renderWeapons(weapons) {
        const weaponGrid = document.querySelector('.weapon-grid');
        weaponGrid.innerHTML = ''; // 清空現有內容
        
        weapons.forEach(weapon => {
            // 創建一個新的武器卡片
            const card = document.createElement('div');
            card.className = 'weapon-card';

            // 根據 invgfx 動態設置圖標路徑
            const iconPath = `${iconFolderPath}${weapon.invgfx}.gif`;
			
			// 祝福或詛咒的顯示
			const blessS = weapon.bless;
			const blessSDisplay = (blessS == 0) ? `受祝福的 ` : (blessS == 2) ? `受詛咒的 ` : '';

			// 可使用職業
			const professionMap = {
			'use_royal': '王族',
			'use_knight': '騎士',
			'use_mage': '法師',
			'use_elf': '妖精',
			'use_darkelf': '黑妖',
			'use_dragonknight': '龍騎',
			'use_illusionist': '幻術'
			};
            // 職業使用情況顯示
            const allProfessions = Object.keys(professionMap);
            const professions = allProfessions.map(key => {
                return weapon[key] === '1' ? professionMap[key] : '';
            }).filter(name => name);			
			// 檢查是否所有職業欄位都為 '1'
            const allProfessionsDisplayed = allProfessions.every(key => weapon[key] === '1');
            const professionDisplay = allProfessionsDisplayed ? '全職業' : professions.join(', ');			
			
			// 材質中文
			const materialMap = {
			'iron': '鐵',
			'steel': '金屬',
			'wood': '木頭',
			'leather': '皮',
			'bone': '骨頭',
			'gemstone': '寶石',
			'mithril': '米索莉',
			'blackmithril': '黑色米索莉',
			'silver': '銀',
			'oriharukon': '奧里哈魯根',
			'platinum': '白金',
			'gold': '金',
			};
			const materialInChinese = materialMap[weapon.material] || weapon.material; // 材質轉換成中文			
			// 類型中文
			const typeMap = {
			'dagger': '匕首',
			'sword': '劍',
			'tohandsword': '雙手劍',
			'bow': '弓',
			'singlebow': '單手弓',
			'staff': '魔杖',
			'tohandstaff': '雙手杖',
			'claw': '鋼爪',
			'edoryu': '雙刀',
			'kiringku': '奇古獸',
			'chainsword': '鎖鏈劍',
			'blunt': '斧錘',
			'tohandblunt': '雙手斧錘',
			'spear': '矛',
			'singlespear': '單手矛',
			'gauntlet': '手甲',
			};
			const typeInChinese = typeMap[weapon.type] || weapon.type; // 類型轉換成中文			
			// 將重量除以 1000 並轉換為整數
			const weightInKg = Math.round(parseFloat(weapon.weight) / 1000); // 除以1000並四捨五入為整數			
			
			// 爆擊率顯示
			const doubledmg = weapon.double_dmg_chance;
			const doubledmgDisplay = (doubledmg && doubledmg > 0) ? `爆擊: ${doubledmg}%<br>` : '';
			
			// 等級限制
			const minlvl = weapon.min_lvl;
			const minlvlDisplay = (minlvl && minlvl > 0) ? `等級: ${minlvl}<br>` : '';
			
			// 命中值顯示
			const addhitmodifier = weapon.hitmodifier;
			const addhitmodifierDisplay = (addhitmodifier && addhitmodifier !== '0') ? `<br>命中: ${addhitmodifier > 0 ? '+' : ''}${addhitmodifier}` : '';
			// 傷害值顯示
			const adddmgmodifier = weapon.dmgmodifier;
			const adddmgmodifierDisplay = (adddmgmodifier && adddmgmodifier !== '0') ? `<br>傷害: ${adddmgmodifier > 0 ? '+' : ''}${adddmgmodifier}` : '';
			// 血量值顯示
			const addhp = weapon.add_hp;
			const addhpDisplay = (addhp && addhp !== '0') ? `<br>血量: ${addhp > 0 ? '+' : ''}${addhp}` : '';
			// 魔力值顯示
			const addmp = weapon.add_mp;
			const addmpDisplay = (addmp && addmp !== '0') ? `<br>魔力: ${addmp > 0 ? '+' : ''}${addmp}` : '';
			// 回血值顯示
			const addhpr = weapon.add_hpr;
			const addhprDisplay = (addhpr && addhpr !== '0') ? `<br>回血: ${addhpr > 0 ? '+' : ''}${addhpr}` : '';
			// 回魔值顯示
			const addmpr = weapon.add_mpr;
			const addmprDisplay = (addmpr && addmpr !== '0') ? `<br>回魔: ${addmpr > 0 ? '+' : ''}${addmpr}` : '';
			// 魔攻值顯示
			const addsp = weapon.add_sp;
			const addspDisplay = (addsp && addsp !== '0') ? `<br>魔攻: ${addsp > 0 ? '+' : ''}${addsp}` : '';
			// 魔防值顯示
			const addm_def = weapon.m_def;
			const addm_defDisplay = (addm_def && addm_def !== '0') ? `<br>魔防: ${addm_def > 0 ? '+' : ''}${addm_def}` : '';

			// 力量值顯示
			const addStr = weapon.add_str;
			const addStrDisplay = (addStr && addStr !== '0') ? `<br>力量 +${addStr}` : '';
			// 體質值顯示
			const addCon = weapon.add_con;
			const addConDisplay = (addCon && addCon !== '0') ? `<br>體質 +${addCon}` : '';
			// 敏捷值顯示
			const addDex = weapon.add_dex;
			const addDexDisplay = (addDex && addDex !== '0') ? `<br>敏捷 +${addDex}` : '';
			// 智力值顯示
			const addInt = weapon.add_int;
			const addIntDisplay = (addInt && addInt !== '0') ? `<br>智力 +${addInt}` : '';
			// 精神值顯示
			const addWis = weapon.add_wis;
			const addWisDisplay = (addWis && addWis !== '0') ? `<br>精神 +${addWis}` : '';
			// 魅力值顯示
			const addCha = weapon.add_cha;
			const addChaDisplay = (addCha && addCha !== '0') ? `<br>魅力 +${addCha}` : '';
			
			// 使用時限顯示
			const usetime = parseInt(weapon.max_use_time, 10);
			let usetimeDisplay = '';
			if (!isNaN(usetime) && usetime > 0) {
			const days = Math.floor(usetime / 86400);  // 計算天數 (86400秒 = 1天)
			const hours = Math.floor((usetime % 86400) / 3600);  // 計算剩餘小時數
			const minutes = Math.floor((usetime % 3600) / 60);  // 計算剩餘分鐘數
			const seconds = usetime % 60;  // 剩餘的秒數
			// 構建顯示的時間格式
			let timeStr = '';
			if (days > 0) timeStr += `${days}天 `;
			if (hours > 0) timeStr += `${hours}小時 `;
			if (minutes > 0) timeStr += `${minutes}分鐘 `;
			if (seconds > 0) timeStr += `${seconds}秒`;
			usetimeDisplay = `<br>使用時限${timeStr.trim()}`;
			}

			// 加速顯示
			const hasteMap = {
			'0': '',
			'1': '<br>人物速度 x1.33',
			};
			const hasteDisplay = hasteMap[weapon.haste_item] || ''; // 根據 haste_item 的值決定顯示內容
			// 損壞顯示
			const canbedmgMap = {
			'0': '<br>不會損壞',
			'1': '',
			};
			const canbedmgDisplay = canbedmgMap[weapon.canbedmg] || ''; // 根據 canbedmg 的值決定顯示內容
			// 可否轉移
			const tradeable = weapon.trade;
			const tradeableDisplay = (tradeable && tradeable > 0) ? `<br>不可轉移` : '';
			// 可否刪除
			const deleteable = weapon.cant_delete;
			const deleteableDisplay = (deleteable && deleteable > 0) ? `<br>不可刪除` : '';
			
            card.innerHTML = `
                <div class="weapon-card-content">
                    <div class="weapon-icon">
                        <img src="${iconPath}" alt="${weapon.name}">
                    </div>
                    <div class="weapon-name">${blessSDisplay}${weapon.name}</div>
                </div>
                <div class="weapon-stats">
                    可用: ${professionDisplay} <br>
					類型: ${typeInChinese} <br>
					${doubledmgDisplay}
					材質: ${materialInChinese} <br>
                    重量: ${weightInKg} <br>
					${minlvlDisplay}
                    攻擊: ${weapon.dmg_small} / ${weapon.dmg_large} <br>
                    安定: ${weapon.safenchant}
					${addhitmodifierDisplay}
					${adddmgmodifierDisplay}
					${addhpDisplay}
					${addmpDisplay}
					${addhprDisplay}
					${addmprDisplay}
					${addspDisplay}
					${addm_defDisplay}
					${addStrDisplay}
					${addConDisplay}
					${addDexDisplay}
					${addIntDisplay}
					${addWisDisplay}
					${addChaDisplay}	
					${(usetimeDisplay || tradeableDisplay || deleteableDisplay || hasteDisplay || (weapon.note && weapon.note.trim() !== "")) ? `<br>備註:` : '' }
					${usetimeDisplay}
					${tradeableDisplay}
					${deleteableDisplay}
					${hasteDisplay}
					${canbedmgDisplay}
					${weapon.note && weapon.note.trim() !== "" ? `<br>備註:<br>${weapon.note}` : ''}
                </div>
            `;
            
            card.dataset.type = weapon.type; // 設置 data-type 屬性
			weaponGrid.appendChild(card);
        });
    }

    // 讀取 CSV 文件並解析
    fetch(csvFilePath)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(csvText => {
            const rows = csvText.trim().split('\n');
            const headers = rows[0].split(',');
            const weapons = rows.slice(1).map(row => {
                const values = row.split(',');
                let weapon = {};
                headers.forEach((header, index) => {
                    weapon[header.replace(/"/g, '')] = values[index].replace(/"/g, '');
                });
                return weapon;
            });
            renderWeapons(weapons);
        })
        .catch(error => {
            console.error('Error fetching or parsing CSV file:', error);
        });

    // 搜索功能
    const searchButton = document.querySelector('.search-bar button');
    const searchInput = document.querySelector('.search-bar input');
    
    searchButton.addEventListener('click', function() {
        const searchTerm = searchInput.value.toLowerCase();
        const weaponCards = document.querySelectorAll('.weapon-card');
        weaponCards.forEach(card => {
            const weaponName = card.querySelector('.weapon-name').textContent.toLowerCase();
            if (weaponName.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // 類型過濾功能
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.textContent;
            const weaponCards = document.querySelectorAll('.weapon-card');
            weaponCards.forEach(card => {
                const weaponType = card.querySelector('.weapon-stats').textContent.includes(`類型: ${type}`);
                if (type === '所有' || weaponType) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});