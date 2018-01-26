var fs = require('fs');
var request = require('request');

var stats = ["HP","MP","ATK","DEF","MAG","SPR"];
var elements = ["fire", "ice", "lightning", "water", "wind", "earth", "light", "dark"];
var ailments = ["poison", "blind", "sleep", "silence", "paralysis", "confuse", "disease", "petrification"];

var statsMap = {
    "hp": "hp",
    "mp": "mp",
    "atk": "atk",
    "def": "def",
    "int": "mag",
    "mnd": "spr"
}

var typeMap = {
    "Dagger": 'dagger',
    "Sword": 'sword',
    "Greatsword": 'greatSword',
    "Katana": 'katana',
    "Staff": 'staff',
    "Rod": 'rod',
    "Bow": 'bow',
    "Axe": 'axe',
    "Hammer": 'hammer',
    "Lance": 'spear',
    "Harp": 'harp',
    "Whip": 'whip',
    "Projectile": 'throwing',
    "Gun": 'gun',
    "Mace": 'mace',
    "Knuckle": 'fist',
    "Light Shield": 'lightShield',
    "Heavy Shield": 'heavyShield',
    "Hat": 'hat',
    "Helm": 'helm',
    "Clothes": 'clothes',
    "Light Armor": 'lightArmor',
    "Heavy Armor": 'heavyArmor',
    "Robes": 'robe',
    "Accessory": 'accessory'
}

var raceMap = {
    1: 'beast',
    2: 'bird',
    3: 'aquatic',
    4: 'demon',
    5: 'human',
    6: 'machine',
    7: 'dragon',
    8: 'spirit',
    9: 'bug',
    10: 'stone',
    11: 'plant',
    12: 'undead'
}

var ailmentsMap = {
    "Poison": "poison",
    "Blind": "blind",
    "Sleep": "sleep",
    "Silence": "silence",
    "Paralyze": "paralysis",
    "Confusion": "confuse",
    "Disease": "disease",
    "Petrify": "petrification",
    "Death": "death"
}

var elementsMap = {
    1: 'fire',
    2: 'ice',
    3: 'lightning',
    4: 'water',
    5: 'wind',
    6: 'earth',
    7: 'light',
    8: 'dark'
}

filterGame = [20001, 20002, 20006, 20007, 20008, 20011, 20012];

var unitNamesById = {};
var unitIdByTmrId = {};
var enhancementsByUnitId = {};
var oldItemsAccessById = {};
var releasedUnits;
var skillNotIdentifiedNumber = 0;


console.log("Starting");
request.get('https://raw.githubusercontent.com/DanUgore/ffbe_data/master/jp/unit.json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log("units.json downloaded");
        var units = JSON.parse(body);
        request.get('https://raw.githubusercontent.com/DanUgore/ffbe_data/master/jp/learns.json', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("learns.json downloaded");
                var learns = JSON.parse(body);
                request.get('https://raw.githubusercontent.com/DanUgore/ffbe_data/master/jp/enhance.json', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log("enhance.json downloaded");
                        var enhance = JSON.parse(body);
                        request.get('https://raw.githubusercontent.com/DanUgore/ffbe_data/master/jp/ability.json', function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                console.log("ability.json downloaded");
                                var abilities = JSON.parse(body);
                        
                /*request.get('https://raw.githubusercontent.com/aEnigmatic/ffbe/master/enhancements.json', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        console.log("enhancements.json downloaded");
                        var enhancements = JSON.parse(body);
                        
                        for (var index in enhancements) {
                            var enhancement = enhancements[index];
                            for (var unitIdIndex in enhancement.units) {
                                var unitId = enhancement.units[unitIdIndex].toString();
                                if (!enhancementsByUnitId[unitId]) {
                                    enhancementsByUnitId[unitId] = {};
                                }
                                enhancementsByUnitId[unitId][enhancement.skill_id_old.toString()] = enhancement.skill_id_new.toString();
                            }
                        }*/
                
                                var unitSeries = {};
                                var unitsOut = {};
                                for (var unitId in units) {
                                    var serieId = unitId.substr(0, unitId.length - 1);
                                    var stars = parseInt(unitId.substr(unitId.length -1, 1));
                                    if (!unitSeries[serieId]) {
                                        unitSeries[serieId] = {"min":stars, "max":stars};
                                    }
                                    if (unitSeries[serieId].min > stars) {
                                        unitSeries[serieId].min = stars
                                    }
                                    if (unitSeries[serieId].max < stars) {
                                        unitSeries[serieId].max = stars
                                    }
                                }
                                for (var serieId in unitSeries) {
                                    var minUnitId = serieId + unitSeries[serieId].min;
                                    var maxUnitId = serieId + unitSeries[serieId].max;
                                    var unitIn = units[maxUnitId];
                                    if (!maxUnitId.startsWith("9") && learns[minUnitId]) {
                                        var unitOut = treatUnit(minUnitId, maxUnitId, unitIn, unitSeries[serieId].min, unitSeries[serieId].max, learns, enhance, abilities); //, skills, enhancementsByUnitId);
                                        unitsOut[unitOut.data.id] = unitOut.data;
                                    }
                                }
                                console.log(unitsOut);

                                fs.writeFileSync('unitsWithSkill.json', formatOutput(unitsOut));
                                fs.writeFileSync('units.json', formatSimpleOutput(unitsOut));
                            }
                        });
                    }
                });
            }
        });
    }
});

function treatUnit(serieId, unitId, unitIn, minRarity, maxRarity, learns, enhance, abilities) {
    var unit = {};
    unit.data = {};
    
    var data = unit.data;
    
    data["stats"] = {"maxStats":{}, "pots":{}};
    
    for (var stat in statsMap) {
        data["stats"].maxStats[statsMap[stat]] = unitIn.stats[stat].max;
        data["stats"].pots[stat.toLowerCase()] = unitIn.stats[stat].bonus_cap;
    }
    
    data["name"] = unitIn["name"];
    data["max_rarity"] = maxRarity;
    data["min_rarity"] = minRarity;
    data["sex"] = unitIn.gender;
    data["equip"] = getEquip(unitIn.equipment);
    data["id"] = unitId;
    
    data["enhancementSkills"] = [];
    if (!learns[serieId]) {
        console.log(unitIn);
        console.log(serieId);
    }
    for (skillIndex in learns[serieId].abilities) {
        var skill = learns[serieId].abilities[skillIndex];
        var unhancedSkillId = skill.id;
        var skillId = skill.id;
        if (enhance[serieId]) {
            while(enhance[serieId][skillId]) {
                skillId = enhance[serieId][skillId].id;
            }
        }
        if (unhancedSkillId != skillId) {
            data["enhancementSkills"].push(abilities[skillId].name);
        }
    }
    
    //data.skills = getPassives(unitId, unitIn.skills, skills, enhancementsByUnitId[unitId], unitIn.rarity_max, unitData)*/
    return unit;
}

function getEquip(equipIn) {
    var equip = [];
    for(var equipIndex in equipIn) {
        if (equipIn[equipIndex] != "Accessory") {
            equip.push(typeMap[equipIn[equipIndex]]);
        }
    }
    return equip;
}

function getPassives(unitId, skillsIn, skills, enhancements, maxRarity, unitData) {
    var baseEffects = {};
    var skillsOut = [baseEffects];
    
    
    for (skillIndex in skillsIn) {
        if (skillsIn[skillIndex].rarity > maxRarity) {
            continue; // don't take into account skills for a max rarity not yet released
        }
        var skillId = skillsIn[skillIndex].id.toString();
        if (skillId == "0") {
            console.log(skillsIn[skillIndex]);
            continue;
        }
        if (enhancements) {
            while(enhancements[skillId]) {
                skillId = enhancements[skillId];
            }
        }
        var skillIn = skills[skillId];
        if (!skillIn) {
            console.log(skillId);
        }
        for (var rawEffectIndex in skillIn["effects_raw"]) {
            var rawEffect = skillIn["effects_raw"][rawEffectIndex];
            
            // stat bonus
            if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 1) {               
                var effectData = rawEffect[3];
                if (baseEffects == null) {baseEffects = {}};
                addToStat(baseEffects, "hp%", effectData[4]);
                addToStat(baseEffects, "mp%", effectData[5]);
                addToStat(baseEffects, "atk%", effectData[0]);
                addToStat(baseEffects, "def%", effectData[1]);
                addToStat(baseEffects, "mag%", effectData[2]);
                addToStat(baseEffects, "spr%", effectData[3]);
                
            // DW
            } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 14) {               
                var types = rawEffect[3]
                if (baseEffects == null) {baseEffects = {}};
                if (types.length == 1 && types[0] == "none") {
                    addToList(baseEffects,"special","dualWield");
                } else {
                    for(var partialDualWieldIndex in types) {
                        addToList(baseEffects,"partialDualWield",typeMap[types[partialDualWieldIndex]]);
                    }                    
                }
            }
            
            // Killers
            else if (((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 11) ||
                (rawEffect[0] == 1 && rawEffect[1] == 1 && rawEffect[2] == 11)) {
                var killerData = rawEffect[3];
                
                var killerRace = raceMap[killerData[0]];
                var physicalPercent = killerData[1];
                var magicalPercent = killerData[2];
                addKiller(baseEffects, killerRace, physicalPercent, magicalPercent);
            }
            
            // physical evade
            else if (rawEffect[1] == 3 && rawEffect[2] == 22) {
                if (!baseEffects.evade) {
                    baseEffects.evade = {"physical":rawEffect[3][0]}
                } else if (baseEffects.evade.physical) {
                    baseEffects.evade.physical += rawEffect[3][0];
                } else {
                    baseEffects.evade.physical = rawEffect[3][0];
                }
            }
                
            // magical evade
            else if (rawEffect[1] == 3 && rawEffect[2] == 54 && rawEffect[3][0] == -1) {
                if (!baseEffects.evade) {
                    baseEffects.evade = {"magical":rawEffect[3][1]}
                } else if (baseEffects.evade.magical) {
                    baseEffects.evade.magical += rawEffect[3][1];
                } else {
                    baseEffects.evade.magical = rawEffect[3][1];
                }
            }
            
            // Mastery
            else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 6) {
                var masteryEffect = rawEffect[3];
                var masteryType = typeMap[masteryEffect[0]];
                var masterySkill = {"equipedConditions":[masteryType]};
                
                if (masteryEffect.length > 5) {
                    if (masteryEffect[5]) {
                        masterySkill["hp%"] = masteryEffect[5]
                    }
                    if (masteryEffect[6]) {
                        masterySkill["mp%"] = masteryEffect[6]
                    }
                }
                if (masteryEffect[1]) {
                    masterySkill["atk%"] = masteryEffect[1]
                }
                if (masteryEffect[2]) {
                    masterySkill["def%"] = masteryEffect[2]
                }
                if (masteryEffect[3]) {
                    masterySkill["mag%"] = masteryEffect[3]
                }
                if (masteryEffect[4]) {
                    masterySkill["spr%"] = masteryEffect[4]
                }
                skillsOut.push(masterySkill);
            }

            // unarmed
            else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 19) {
                var masteryEffect = rawEffect[3];    
                var masterySkill = {"equipedConditions":["unarmed"]};
                
                if (masteryEffect[0]) {
                    masterySkill["atk%"] = masteryEffect[0]
                }
                if (masteryEffect[1]) {
                    masterySkill["def%"] = masteryEffect[1]
                }
                if (masteryEffect[2]) {
                    masterySkill["mag%"] = masteryEffect[2]
                }
                if (masteryEffect[3]) {
                    masterySkill["spr%"] = masteryEffect[3]
                }
                skillsOut.push(masterySkill);
            }
            
            // element based mastery
            else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 10004) {
                var masteryEffect = rawEffect[3];
                var masteryType = elementsMap[masteryEffect[0]];
                var masterySkill = {"equipedConditions":[masteryType]};
                if (masteryEffect[3]) {
                    masterySkill["atk%"] = masteryEffect[3];
                }
                if (masteryEffect[5]) {
                    masterySkill["def%"] = masteryEffect[5];
                }
                if (masteryEffect[4]) {
                    masterySkill["mag%"] = masteryEffect[4];
                }
                if (masteryEffect[6]) {
                    masterySkill["spr%"] = masteryEffect[6];
                }
                if (masteryEffect[1]) {
                    masterySkill["hp%"] = masteryEffect[1];
                }
                if (masteryEffect[2]) {
                    masterySkill["mp%"] = masteryEffect[2];
                }
                skillsOut.push(masterySkill);
            }
            
            //doublehand
            else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 13) {
                if (rawEffect[3].length == 3 && rawEffect[3][2] == 2) {
                    if (!baseEffects.singleWielding) {baseEffects.singleWielding = {}};
                    addToStat(baseEffects.singleWielding, "atk", rawEffect[3][0]);
                } else {
                    if (!baseEffects.singleWieldingOneHanded) {baseEffects.singleWieldingOneHanded = {}};
                    addToStat(baseEffects.singleWieldingOneHanded, "atk", rawEffect[3][0]);
                }
            }
            else if (rawEffect[0] == 1 && rawEffect[1] == 3 && rawEffect[2] == 10003) {
                var doublehandSkill = {};
                var doublehandEffect = rawEffect[3];
                if (doublehandEffect.length == 7 && doublehandEffect[6] == 1) {
                    if (!baseEffects.singleWieldingGL) {baseEffects.singleWieldingGL = {}};
                    doublehandSkill = baseEffects.singleWieldingGL;
                } else {
                    if (!baseEffects.singleWieldingOneHandedGL) {baseEffects.singleWieldingOneHandedGL = {}};
                    doublehandSkill = baseEffects.singleWieldingOneHandedGL;
                }
                if (doublehandEffect[2]) {
                    addToStat(doublehandSkill, "atk", doublehandEffect[2]);
                }
                if (doublehandEffect[4]) {
                    addToStat(doublehandSkill, "def", doublehandEffect[4]);
                }
                if (doublehandEffect[3]) {
                    addToStat(doublehandSkill, "mag", doublehandEffect[3]);
                }
                if (doublehandEffect[5]) {
                    addToStat(doublehandSkill, "spr", doublehandEffect[5]);
                }
                if (doublehandEffect[0]) {
                    addToStat(doublehandSkill, "hp", doublehandEffect[0]);
                }
                if (doublehandEffect[1]) {
                    addToStat(doublehandSkill, "mp", doublehandEffect[1]);
                }
                
            // Element Resist
            } else if (!skillIn.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 3) {
                addElementalResist(baseEffects, rawEffect[3]);

            // Ailments Resist
            } else if (!skillIn.active && (rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 2) {
                addAilmentResist(baseEffects, rawEffect[3]);
                
                // MP refresh
            } else if ((rawEffect[0] == 0 || rawEffect[0] == 1) && rawEffect[1] == 3 && rawEffect[2] == 32) {
                var mpRefresh = rawEffect[3][0];
                addToStat(baseEffects, "mpRefresh", mpRefresh);
            }
        }
    }
    addElementalResist(baseEffects, unitData.element_resist);
    addAilmentResist(baseEffects, unitData.status_resist);
    
    if (Object.keys(baseEffects).length === 0) {
        skillsOut.splice(0,1);
    }
    
    return skillsOut;
}

function addToStat(skill, stat, value) {
    if (!skill[stat]) {
        skill[stat] = value;
    } else {
        skill[stat] += value;
    }
}
    
function addToList(skill, listName, value) {
    if (!skill[listName]) {
        skill[listName] = [value];
    } else {
        if (!skill[listName].includes(value)) {
            skill[listName].push(value);
        }
    }
}

function addKiller(skill, race, physicalPercent, magicalPercent) {
    if (!skill.killers) {
        skill.killers = [];
    }
    var killerData;
    for (var index in skill.killers) {
        if (skill.killers[index].name == race) {
            killerData = skill.killers[index];
            break;
        }
    }
    
    if (!killerData) {
        killerData = {"name":race};
        skill.killers.push(killerData);
    }
    if (physicalPercent != 0) {
        if (killerData.physical) {
            killerData.physical += physicalPercent;
        } else {
            killerData.physical = physicalPercent;
        }
    }
    if (magicalPercent != 0) {
        if (killerData.magical) {
            killerData.magical += magicalPercent;
        } else {
            killerData.magical = magicalPercent;
        }
    }
}

function addElementalResist(item, values) {
    for (var index in elements) {
        if (values[index]) {
            if (!item.resist) {
                item.resist = [];
            }
            item.resist.push({"name":elements[index],"percent":values[index]})
        }
    }
}

function addAilmentResist(item, values) {
    for (var index in ailments) {
        if (values[index]) {
            if (!item.resist) {
                item.resist = [];
            }
            item.resist.push({"name":ailments[index],"percent":values[index]})
        }
    }
}

function formatOutput(units) {
    var properties = ["id","name","type","hp","hp%","mp","mp%","atk","atk%","def","def%","mag","mag%","spr","spr%","evade","singleWielding","singleWieldingOneHanded","singleWieldingGL","singleWieldingOneHandedGL","accuracy","damageVariance","element","partialDualWield","resist","ailments","killers","mpRefresh","special","exclusiveSex","exclusiveUnits","equipedConditions","tmrUnit","access","icon"];
    var result = "{\n";
    var first = true;
    for (var unitId in units) {
        var unit = units[unitId]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += getUnitBasicInfo(unitId, unit) + ",";
        result += "\n\t\t\"skills\": [";
        var firstSkill = true;
        for (var skillIndex in unit.skills) {
            var skill = unit.skills[skillIndex];
            if (firstSkill) {
                firstSkill = false;
            } else {
                result+= ",";
            }
            result+= "\n\t\t\t{"
            var firstProperty = true;
            for (var propertyIndex in properties) {
                var property = properties[propertyIndex];
                if (skill[property]) {
                    if (firstProperty) {
                        firstProperty = false;
                    } else {
                        result += ", ";
                    }
                    result+= "\"" + property + "\":" + JSON.stringify(skill[property]);
                }
            }
            result+= "}"
        }
        result += "\n\t\t]";
        
        result += "\n\t}";
    }
    result += "\n}";
    return result;
}

function formatSimpleOutput(units) {
    var result = "{\n";
    var first = true;
    for (var unitId in units) {
        var unit = units[unitId]
        if (first) {
            first = false;
        } else {
            result += ",";
        }
        result += getUnitBasicInfo(unitId, unit);
        result += "\n\t}";
    }
    result += "\n}";
    return result;
}

function getUnitBasicInfo(unitId, unit) {
    var result = "";
    result += "\n\t\"" + unitId + "\": {";
    result += "\n\t\t\"name\":\"" + unit.name + "\","
    result += "\n\t\t\"id\":\"" + unit.id + "\","
    result += "\n\t\t\"max_rarity\":\"" + unit.max_rarity + "\","
    result += "\n\t\t\"min_rarity\":\"" + unit.min_rarity + "\","
    result += "\n\t\t\"sex\":\"" + unit.sex + "\","
    result += "\n\t\t\"stats\": {";
    result += "\n\t\t\t\"maxStats\":" + JSON.stringify(unit.stats.maxStats) + ","
    result += "\n\t\t\t\"pots\":" + JSON.stringify(unit.stats.pots)
    result += "\n\t\t},";
    result += "\n\t\t\"equip\":" + JSON.stringify(unit.equip)
    if (unit.enhancementSkills.length > 0) {
        result += ",\n\t\t\"enhancementSkills\":" + JSON.stringify(unit.enhancementSkills);
    }
    
    return result;
}
