document.addEventListener('DOMContentLoaded', function() {
    // 設置 CSV 文件路徑
    const csvFilePath = 'csv/armor_data.csv';
    const iconFolderPath = 'icon/'; // 設置圖標資料夾路徑

    // 渲染武器卡片的函數
    function renderarmors(armor) {
        const armorGrid = document.querySelector('.armor-grid');
        armorGrid.innerHTML = ''; // 清空現有內容
        
        armor.forEach(armor => {
            // 創建一個新的武器卡片
            const card = document.createElement('div');
            card.className = 'armor-card';

            // 根據 invgfx 動態設置圖標路徑
            const iconPath = `${iconFolderPath}${armor.invgfx}.gif`;
			
			// 祝福或詛咒的顯示
			const blessS = armor.bless;
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
                return armor[key] === '1' ? professionMap[key] : '';
            }).filter(name => name);			
			// 檢查是否所有職業欄位都為 '1'
            const allProfessionsDisplayed = allProfessions.every(key => armor[key] === '1');
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
			'dragonscale': '龍鱗',
			'cloth': '布',
			'vegetation': '植物',
			'gold': '金',
			'paper': '紙',
			'copper': '銅',
			};
			const materialInChinese = materialMap[armor.material] || armor.material; // 材質轉換成中文			
			// 類型中文
			const typeMap = {
			'helm': '頭盔',
			'armor': '盔甲',
			'cloak': '斗篷',
			'T': 'T恤',
			'glove': '手套',
			'boots': '長靴',
			'shield': '盾牌',
			'belt': '腰帶',
			'amulet': '項鍊',
			'ring': '戒指',
			'earring': '耳環',
			'guarder': '臂甲',
			'aidl': '輔助',
			'aidl2': '特殊',
			};
			const typeInChinese = typeMap[armor.type] || armor.type; // 類型轉換成中文			
			// 將重量除以 1000 並轉換為整數
			const weightInKg = Math.round(parseFloat(armor.weight) / 1000); // 除以1000並四捨五入為整數			
			
			// 依照 greater 欄位顯示級別
const greaterValue = parseInt(armor.greater, 10); // 將 greater 轉為數字類型
let greaterDisplay = '';

switch (greaterValue) {
    case 3:
        greaterDisplay = '等級: 特級<br>';
        break;
    case 2:
        greaterDisplay = '等級: 中級<br>';
        break;
    case 1:
        greaterDisplay = '等級: 初級<br>';
        break;
    case 0:
        greaterDisplay = '等級: 高級<br>';
        break;
	case -1:
        greaterDisplay = ''; // 不顯示
        break;
    default:
        greaterDisplay = ''; // 其他不顯示
}

			// 等級限制
			const minlvl = armor.min_lvl;
			const minlvlDisplay = (minlvl && minlvl > 0) ? `等級: ${minlvl}<br>` : '';
			
			// 防禦顯示
			const acc = armor.ac;
			const accDisplay = (acc && acc !== '0') ? `防禦: ${acc}<br>` : '';
			// 減傷顯示
			const dmgreduction = armor.damage_reduction;
			const dmgreductionDisplay = (dmgreduction && dmgreduction !== '0') ? `<br>傷害減免: ${dmgreduction}` : '';
			// 負重減免顯示
			const weightReduction = (armor.weight_reduction * 25);
			const weightReductionDisplay = (weightReduction && weightReduction !== 0) ? `<br>負重: +${weightReduction}` : '';
			
			// 命中值顯示
			const addhitmodifier = armor.hit_modifier;
			const addhitmodifierDisplay = (addhitmodifier && addhitmodifier !== '0') ? `<br>命中: ${addhitmodifier > 0 ? '+' : ''}${addhitmodifier}` : '';
			// 傷害值顯示
			const adddmgmodifier = armor.dmg_modifier;
			const adddmgmodifierDisplay = (adddmgmodifier && adddmgmodifier !== '0') ? `<br>傷害: ${adddmgmodifier > 0 ? '+' : ''}${adddmgmodifier}` : '';
			// 遠距命中值顯示
			const addbowhitmodifier = armor.bow_hit_modifier;
			const addbowhitmodifierDisplay = (addbowhitmodifier && addbowhitmodifier !== '0') ? `<br>遠距命中: ${addbowhitmodifier > 0 ? '+' : ''}${addbowhitmodifier}` : '';
			// 遠距傷害值顯示
			const addbowdmgmodifier = armor.bow_dmg_modifier;
			const addbowdmgmodifierDisplay = (addbowdmgmodifier && addbowdmgmodifier !== '0') ? `<br>遠距傷害: ${addbowdmgmodifier > 0 ? '+' : ''}${addbowdmgmodifier}` : '';
			// 血量值顯示
			const addhp = armor.add_hp;
			const addhpDisplay = (addhp && addhp !== '0') ? `<br>血量: ${addhp > 0 ? '+' : ''}${addhp}` : '';
			// 魔力值顯示
			const addmp = armor.add_mp;
			const addmpDisplay = (addmp && addmp !== '0') ? `<br>魔力: ${addmp > 0 ? '+' : ''}${addmp}` : '';
			// 回血值顯示
			const addhpr = armor.add_hpr;
			const addhprDisplay = (addhpr && addhpr !== '0') ? `<br>回血: ${addhpr > 0 ? '+' : ''}${addhpr}` : '';
			// 回魔值顯示
			const addmpr = armor.add_mpr;
			const addmprDisplay = (addmpr && addmpr !== '0') ? `<br>回魔: ${addmpr > 0 ? '+' : ''}${addmpr}` : '';
			// 魔攻值顯示
			const addsp = armor.add_sp;
			const addspDisplay = (addsp && addsp !== '0') ? `<br>魔攻: ${addsp > 0 ? '+' : ''}${addsp}` : '';
			// 魔防值顯示
			const addm_def = armor.m_def;
			const addm_defDisplay = (addm_def && addm_def !== '0') ? `<br>魔防: ${addm_def > 0 ? '+' : ''}${addm_def}` : '';

			// 力量值顯示
			const addStr = armor.add_str;
			const addStrDisplay = (addStr && addStr !== '0') ? `<br>力量 +${addStr}` : '';
			// 體質值顯示
			const addCon = armor.add_con;
			const addConDisplay = (addCon && addCon !== '0') ? `<br>體質 +${addCon}` : '';
			// 敏捷值顯示
			const addDex = armor.add_dex;
			const addDexDisplay = (addDex && addDex !== '0') ? `<br>敏捷 +${addDex}` : '';
			// 智力值顯示
			const addInt = armor.add_int;
			const addIntDisplay = (addInt && addInt !== '0') ? `<br>智力 +${addInt}` : '';
			// 精神值顯示
			const addWis = armor.add_wis;
			const addWisDisplay = (addWis && addWis !== '0') ? `<br>精神 +${addWis}` : '';
			// 魅力值顯示
			const addCha = armor.add_cha;
			const addChaDisplay = (addCha && addCha !== '0') ? `<br>魅力 +${addCha}` : '';
			
			// 水屬性防禦顯示
			const defenseWater = armor.defense_water;
			const defenseWaterDisplay = (defenseWater && defenseWater !== '0') ? `<br>水屬性防禦: +${defenseWater}` : '';
			// 風屬性防禦顯示
			const defenseWind = armor.defense_wind;
			const defenseWindDisplay = (defenseWind && defenseWind !== '0') ? `<br>風屬性防禦: +${defenseWind}` : '';
			// 火屬性防禦顯示
			const defenseFire = armor.defense_fire;
			const defenseFireDisplay = (defenseFire && defenseFire !== '0') ? `<br>火屬性防禦: +${defenseFire}` : '';
			// 地屬性防禦顯示
			const defenseEarth = armor.defense_earth;
			const defenseEarthDisplay = (defenseEarth && defenseEarth !== '0') ? `<br>地屬性防禦: +${defenseEarth}` : '';
			
			// 昏迷耐性顯示
			const registStun = armor.regist_stun;
			const registStunDisplay = (registStun && registStun !== '0') ? `<br>昏迷耐性: +${registStun}` : '';
			// 石化耐性顯示
			const registStone = armor.regist_stone;
			const registStoneDisplay = (registStone && registStone !== '0') ? `<br>石化耐性: +${registStone}` : '';
			// 睡眠耐性顯示
			const registSleep = armor.regist_sleep;
			const registSleepDisplay = (registSleep && registSleep !== '0') ? `<br>睡眠耐性: +${registSleep}` : '';
			// 寒冰耐性顯示
			const registFreeze = armor.regist_freeze;
			const registFreezeDisplay = (registFreeze && registFreeze !== '0') ? `<br>寒冰耐性: +${registFreeze}` : '';
			// 支撐耐性顯示
			const registSustain = armor.regist_sustain;
			const registSustainDisplay = (registSustain && registSustain !== '0') ? `<br>支撐耐性: +${registSustain}` : '';
			// 闇黑耐性顯示
			const registBlind = armor.regist_blind;
			const registBlindDisplay = (registBlind && registBlind !== '0') ? `<br>闇黑耐性: +${registBlind}` : '';
			
			// 加速顯示
			const hasteMap = {
			'0': '',
			'1': '<br>1段加速',
			};
			const hasteDisplay = hasteMap[armor.haste_item] || ''; // 根據 haste_item 的值決定顯示內容
			// 損壞顯示
			const canbedmgMap = {
			'0': '<br>不會損壞',
			'1': '',
			};
			const canbedmgDisplay = canbedmgMap[armor.canbedmg] || ''; // 根據 canbedmg 的值決定顯示內容
			// 可否轉移
			const tradeable = armor.trade;
			const tradeableDisplay = (tradeable && tradeable > 0) ? `<br>不可轉移` : '';
			// 可否刪除
			const deleteable = armor.cant_delete;
			const deleteableDisplay = (deleteable && deleteable > 0) ? `<br>不可刪除` : '';
			
            card.innerHTML = `
                <div class="armor-card-content">
                    <div class="armor-icon">
                        <img src="${iconPath}" alt="${armor.name}">
                    </div>
                    <div class="armor-name">${blessSDisplay}${armor.name}</div>
                </div>
                <div class="armor-stats">
                    可用: ${professionDisplay} <br>
					類型: ${typeInChinese} <br>
					材質: ${materialInChinese} <br>
                    重量: ${weightInKg} <br>
					${greaterDisplay}
					${minlvlDisplay}
					${accDisplay}
                    安定: ${armor.safenchant}
					${dmgreductionDisplay}
					${weightReductionDisplay}
					${addhitmodifierDisplay}
					${adddmgmodifierDisplay}
					${addbowhitmodifierDisplay}
					${addbowdmgmodifierDisplay}
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
					${defenseEarthDisplay}
					${defenseWaterDisplay}					
					${defenseFireDisplay}
					${defenseWindDisplay}
					${registStunDisplay}
					${registStoneDisplay}
					${registSleepDisplay}
					${registFreezeDisplay}
					${registSustainDisplay}
					${registBlindDisplay}
					${(tradeableDisplay || deleteableDisplay || (armor.note && armor.note.trim() !== "")) ? `<br>備註:` : '' }
					${tradeableDisplay}
					${deleteableDisplay}
					${armor.note && armor.note.trim() !== "" ? `<br>${armor.note}` : ''}
                </div>
            `;
            
            card.dataset.type = armor.type; // 設置 data-type 屬性
			armorGrid.appendChild(card);
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
            const armors = rows.slice(1).map(row => {
                const values = row.split(',');
                let armor = {};
                headers.forEach((header, index) => {
                    armor[header.replace(/"/g, '')] = values[index].replace(/"/g, '');
                });
                return armor;
            });
            renderarmors(armors);
        })
        .catch(error => {
            console.error('Error fetching or parsing CSV file:', error);
        });

    // 搜索功能
    const searchButton = document.querySelector('.search-bar button');
    const searchInput = document.querySelector('.search-bar input');
    
    searchButton.addEventListener('click', function() {
        const searchTerm = searchInput.value.toLowerCase();
        const armorCards = document.querySelectorAll('.armor-card');
        armorCards.forEach(card => {
            const armorName = card.querySelector('.armor-name').textContent.toLowerCase();
            if (armorName.includes(searchTerm)) {
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
            const armorCards = document.querySelectorAll('.armor-card');
            armorCards.forEach(card => {
                const armorType = card.querySelector('.armor-stats').textContent.includes(`類型: ${type}`);
                if (type === '所有' || armorType) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});