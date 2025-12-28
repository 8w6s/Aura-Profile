'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Star, Sword, Zap, X } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/app/context/ToastContext';

export default function GameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { game, uid } = params;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedChar, setSelectedChar] = useState<any>(null);
    const [selectedRelic, setSelectedRelic] = useState<any>(null);

    const [metadata, setMetadata] = useState<Record<string, any>>({});
    const [lcMetadata, setLcMetadata] = useState<Record<string, any>>({});
    const [relicMetadata, setRelicMetadata] = useState<Record<string, any>>({});
    const [relicsListMetadata, setRelicsListMetadata] = useState<Record<string, any>>({});
    const [hsrMainAffixMap, setHsrMainAffixMap] = useState<Record<string, any>>({});
    const [hsrSubAffixMap, setHsrSubAffixMap] = useState<Record<string, any>>({});
    const [loadingMetadata, setLoadingMetadata] = useState(true);

    const [locMetadata, setLocMetadata] = useState<Record<string, string>>({});

    useEffect(() => {
        showToast('This feature is currently in Beta. Data accuracy may vary.', 'info', Infinity);
    }, []);

    useEffect(() => {
        if (!game) return;

        const fetchMetadata = async () => {
            try {
                if (game === 'hsr') {
                    const [chars, lcs, relicSets, relicsList, mainAffixes, subAffixes] = await Promise.all([
                        fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json').then(r => r.json()),
                        fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/light_cones.json').then(r => r.json()),
                        fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/relic_sets.json').then(r => r.json()),
                        fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/relics.json').then(r => r.json()),
                        fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/relic_main_affixes.json').then(r => r.json()),
                        fetch('https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/relic_sub_affixes.json').then(r => r.json())
                    ]);
                    setMetadata(chars);
                    setLcMetadata(lcs);
                    setRelicMetadata(relicSets);
                    setRelicsListMetadata(relicsList);
                    setHsrMainAffixMap(mainAffixes);
                    setHsrSubAffixMap(subAffixes);
                } else if (game === 'genshin') {
                    const [chars, loc] = await Promise.all([
                        fetch('https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json').then(r => r.json()),
                        fetch('https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc_en.json').then(r => r.json()).catch(() => ({}))
                    ]);
                    setMetadata(chars);
                    setLocMetadata(loc);
                }
            } catch (e) {
                console.error('Failed to fetch metadata', e);
            } finally {
                setLoadingMetadata(false);
            }
        };

        fetchMetadata();
    }, [game]);

    useEffect(() => {
        if (!game || !uid) return;
        
        fetch(`/api/hoyoverse?game=${game}&uid=${uid}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                if (data.error) throw new Error(data.error);
                setData(data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [game, uid]);

    const getCharacterInfo = (id: string | number) => {
        const strId = String(id);
        if (!metadata) return null;
        
        if (game === 'hsr') {
            const char = metadata[strId];
            if (char) {
                return {
                    name: char.name,
                    rarity: char.rarity,
                    element: char.element,
                    path: char.path,
                    icon: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${char.icon}`
                };
            }
        } else if (game === 'genshin') {
            let char = metadata[strId];
            if (!char && (strId.startsWith('10000005') || strId.startsWith('10000007'))) {
                char = metadata['10000005'] || metadata['10000007'];
            }
            
            if (char) {
                const name = locMetadata[char.NameTextMapHash] || char.SideIconName?.replace('UI_AvatarIcon_Side_', '') || 'Unknown';
                return {
                    name: name,
                    rarity: char.QualityType === 'QUALITY_ORANGE' ? 5 : 4,
                    element: char.Element,
                    weapon: char.WeaponType,
                    icon: `https://enka.network/ui/${char.SideIconName.replace('Side_', '')}.png`
                };
            }
        }
        return null;
    };

    const statMapping: Record<string, string> = {
        'HPDelta': 'HP',
        'AttackDelta': 'ATK',
        'DefenceDelta': 'DEF',
        'SpeedDelta': 'SPD',
        'HPAddedRatio': 'HP',
        'AttackAddedRatio': 'ATK',
        'DefenceAddedRatio': 'DEF',
        'CriticalChance': 'CRIT Rate',
        'CriticalDamage': 'CRIT DMG',
        'BreakDamageAddedRatio': 'Break Effect',
        'StatusProbability': 'Effect Hit Rate',
        'StatusResistance': 'Effect Res',
        'PhysicalAddedRatio': 'Physical DMG',
        'FireAddedRatio': 'Fire DMG',
        'IceAddedRatio': 'Ice DMG',
        'ThunderAddedRatio': 'Lightning DMG',
        'WindAddedRatio': 'Wind DMG',
        'QuantumAddedRatio': 'Quantum DMG',
        'ImaginaryAddedRatio': 'Imaginary DMG',
        'SPRatioBase': 'Energy Regen',
        'HealRatioBase': 'Outgoing Healing',
    };

    const formatStatValue = (type: string | undefined, value: number) => {
        if (!type) return Math.floor(value || 0).toLocaleString();
        if (type.endsWith('Ratio') || type === 'CriticalChance' || type === 'CriticalDamage' || type === 'StatusProbability' || type === 'StatusResistance' || type === 'SPRatioBase' || type === 'HealRatioBase') {
            return `${((value || 0) * 100).toFixed(1)}%`;
        }
        return Math.floor(value || 0).toLocaleString();
    };

    const getWeaponInfo = (id: string | number) => {
        const strId = String(id);
        if (game === 'hsr' && lcMetadata) {
            const lc = lcMetadata[strId];
            if (lc) {
                return {
                    name: lc.name,
                    icon: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${lc.icon}`,
                    rarity: lc.rarity
                };
            }
        }
        return null;
    };

    const getRelicInfo = (id: string | number) => {
        const strId = String(id);
        if (game === 'hsr') {
            if (relicsListMetadata && relicsListMetadata[strId]) {
                return {
                    name: relicsListMetadata[strId].name,
                    icon: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${relicsListMetadata[strId].icon}`,
                    setId: relicsListMetadata[strId].set_id
                };
            }
        }
        return null;
    };

    const getRelicSetInfo = (id: string | number) => {
        const strId = String(id);
        if (game === 'hsr' && relicMetadata) {
            let set = relicMetadata[strId];
            if (!set) {
                if (strId.length === 5) {
                    const setId = strId.substring(1, 4);
                    set = relicMetadata[setId];
                }
            }
            
            if (set) {
                return {
                    name: set.name,
                    icon: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${set.icon}`
                };
            }
        }
        return null;
    };

    const getHsrRelicStats = (relic: any) => {
        if (!hsrMainAffixMap || !hsrSubAffixMap || !relicsListMetadata) return { main: null, subs: [] };

        let mainStat = null;
        if (relic.mainAffixId) {
             const group = hsrMainAffixMap[String(relic.mainAffixId)];
             const affixData = group?.affixes?.['1'];
             
             if (affixData) {
                 const level = relic.level || 0;
                 const value = affixData.base + (affixData.step * level);
                 mainStat = {
                     type: affixData.property,
                     value: value
                 };
             }
        }

        const relicMeta = relicsListMetadata[String(relic.tid)];
        const subAffixGroupId = relicMeta?.sub_affix_id;
        const subAffixGroup = subAffixGroupId ? hsrSubAffixMap[String(subAffixGroupId)] : null;

        const subStats = (relic.subAffixList || []).map((sub: any) => {
            if (!subAffixGroup) return null;
            const affixData = subAffixGroup.affixes?.[String(sub.affixId)];
            if (!affixData) return null;
            const value = affixData.base * sub.cnt + affixData.step * sub.step;
            
            return {
                type: affixData.property,
                value: value
            };
        }).filter(Boolean);

        return { main: mainStat, subs: subStats };
    };

    const pathMapping: Record<string, string> = {
        'Warrior': 'Destruction',
        'Rogue': 'The Hunt',
        'Mage': 'Erudition',
        'Shaman': 'Harmony',
        'Warlock': 'Nihility',
        'Knight': 'Preservation',
        'Priest': 'Abundance',
        'Memory': 'Remembrance'
    };

    const elementColors: Record<string, string> = {
        'Fire': 'from-red-900/40 to-orange-900/10 border-red-500/30',
        'Ice': 'from-blue-900/40 to-cyan-900/10 border-cyan-500/30',
        'Wind': 'from-green-900/40 to-emerald-900/10 border-emerald-500/30',
        'Electric': 'from-purple-900/40 to-fuchsia-900/10 border-purple-500/30',
        'Lightning': 'from-purple-900/40 to-fuchsia-900/10 border-purple-500/30',
        'Rock': 'from-yellow-900/40 to-amber-900/10 border-yellow-500/30',
        'Physical': 'from-gray-800/40 to-slate-800/10 border-gray-500/30',
        'Quantum': 'from-indigo-900/40 to-violet-900/10 border-indigo-500/30',
        'Imaginary': 'from-yellow-800/40 to-amber-700/10 border-yellow-500/30'
    };

    const getElementColorClass = (element: string) => {
        return elementColors[element] || 'from-gray-800/40 to-gray-900/10 border-white/10';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400">Loading Game Data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
                <div className="text-center space-y-4">
                    <p className="text-red-400 text-xl">Error: {error}</p>
                    <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        Back to Profile
                    </Link>
                </div>
            </div>
        );
    }

    const isGenshin = game === 'genshin';
    const isHSR = game === 'hsr';

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </Link>
                    <div className="text-sm font-mono text-white/40">
                        UID: {uid} • {isGenshin ? 'Genshin Impact' : isHSR ? 'Honkai: Star Rail' : game}
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        {isGenshin ? <Star size={120} /> : <Zap size={120} />}
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 border-4 border-white/5 overflow-hidden flex-shrink-0 relative">
                             {data.avatarUrl ? (
                                <img 
                                    src={data.avatarUrl} 
                                    alt={data.nickname} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                             ) : null}
                             <div className={`w-full h-full flex items-center justify-center text-4xl absolute top-0 left-0 bg-gray-800 ${data.avatarUrl ? 'hidden' : ''}`}>
                                {data.nickname?.[0]}
                             </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h1 className="text-3xl font-bold">{data.nickname}</h1>
                            {data.signature && <p className="text-white/60 italic">"{data.signature}"</p>}
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/5">
                                    <div className="text-xs text-white/40 uppercase tracking-wider">Level</div>
                                    <div className="text-xl font-mono">{data.level}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/5">
                                    <div className="text-xs text-white/40 uppercase tracking-wider">World Level</div>
                                    <div className="text-xl font-mono">{data.worldLevel}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/5">
                                    <div className="text-xs text-white/40 uppercase tracking-wider">Achievements</div>
                                    <div className="text-xl font-mono">{data.achievements?.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {data.characters && data.characters.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                    >
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <User className="text-[var(--primary)]" />
                            <span>Characters Showcase</span>
                        </h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {data.characters.map((char: any, index: number) => {
                                const meta = getCharacterInfo(char.avatarId);
                                const elementClass = meta?.element ? getElementColorClass(meta.element) : 'bg-white/5 border-white/10';
                                
                                return (
                                    <motion.div 
                                        key={char.avatarId ? String(char.avatarId) : `char-${index}`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedChar(char)}
                                        className={`cursor-pointer rounded-xl overflow-hidden relative group border bg-gradient-to-br ${elementClass} aspect-[3/4] shadow-lg`}
                                    >
                                        <div className="absolute inset-0">
                                            {meta?.icon ? (
                                                <img src={meta.icon} alt={meta.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-black/40">
                                                    <span className="text-xs text-white/40">No Image</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                        </div>

                                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                            {meta?.element === 'Fire' && <Zap size={16} className="text-orange-400" />}
                                            {meta?.element === 'Ice' && <Star size={16} className="text-cyan-400" />}
                                            {meta?.element === 'Wind' && <span className="text-emerald-400 text-xs font-bold">WIND</span>}
                                            {meta?.element === 'Electric' && <Zap size={16} className="text-purple-400" />}
                                            {meta?.element === 'Lightning' && <Zap size={16} className="text-purple-400" />}
                                            {meta?.element === 'Rock' && <span className="text-yellow-600 text-xs font-bold">GEO</span>}
                                            {meta?.element === 'Physical' && <Sword size={16} className="text-gray-400" />}
                                            {meta?.element === 'Quantum' && <span className="text-indigo-400 text-xs font-bold">QUA</span>}
                                            {meta?.element === 'Imaginary' && <span className="text-yellow-400 text-xs font-bold">IMG</span>}
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <h3 className={`font-bold text-sm truncate ${meta?.rarity === 5 ? 'text-orange-200' : 'text-purple-200'}`}>
                                                {meta?.name || `Char ${char.avatarId}`}
                                            </h3>
                                            <div className="flex items-center justify-between text-[10px] text-white/60 mt-1">
                                                <span>Lv. {game === 'hsr' ? char.level : (char.propMap?.[4001]?.val || '?')}</span>
                                                {game === 'hsr' && (char.rank || 0) > 0 && (
                                                    <span className="text-[var(--primary)] font-bold bg-black/40 px-1 rounded">E{char.rank}</span>
                                                )}
                                                {game === 'genshin' && (char.talentIdList?.length || 0) > 0 && (
                                                    <span className="text-[var(--primary)] font-bold bg-black/40 px-1 rounded">C{char.talentIdList?.length}</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {selectedChar && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                            onClick={() => setSelectedChar(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            >
                                {(() => {
                                    const char = selectedChar;
                                    const fightPropMap = char.fightPropMap || {};
                                    const meta = getCharacterInfo(char.avatarId);
                                    const elementClass = meta?.element ? getElementColorClass(meta.element) : 'bg-white/5 border-white/10';
                                    
                                    let weapon: any = null;
                                    let relics: any[] = [];
                                    
                                    if (game === 'hsr') {
                                        weapon = char.equipment;
                                        relics = char.relicList || [];
                                    } else {
                                        weapon = char.equipList?.find((i: any) => i.flat.itemType === 'ITEM_WEAPON');
                                        relics = char.equipList?.filter((i: any) => i.flat.itemType === 'ITEM_RELIQUARY') || [];
                                    }

                                    let stats: { label: string; value: string; }[] = [];
                                    if (game === 'hsr') {
                                        const attributes = char.attributes || [];
                                        const properties = char.properties || [];
                                        
                                        const getStat = (field: string, propType?: string) => {
                                            const attr = attributes.find((a: any) => a.field === field);
                                            if (attr) return attr.display || (propType ? formatStatValue(propType, attr.value) : Math.floor(attr.value).toLocaleString());
                                            
                                            if (propType) {
                                                const prop = properties.find((p: any) => p.type === propType);
                                                if (prop) return prop.display || formatStatValue(prop.type, prop.value);
                                            }
                                            return '0';
                                        };

                                        if (attributes.length > 0 || properties.length > 0) {
                                            stats = [
                                                { label: 'HP', value: getStat('hp', 'HP') },
                                                { label: 'ATK', value: getStat('atk', 'Attack') },
                                                { label: 'DEF', value: getStat('def', 'Defence') },
                                                { label: 'SPD', value: getStat('spd', 'Speed') },
                                                { label: 'CRIT', value: getStat('crit_rate', 'CriticalChance') },
                                                { label: 'CDMG', value: getStat('crit_dmg', 'CriticalDamage') },
                                                { label: 'BE', value: getStat('break_dmg', 'BreakDamageAddedRatio') },
                                                { label: 'EHR', value: getStat('effect_hit', 'StatusProbability') },
                                                { label: 'RES', value: getStat('effect_res', 'StatusResistance') },
                                                { label: 'ERR', value: getStat('sp_rate', 'SPRatioBase') },
                                                { label: 'OHB', value: getStat('heal_rate', 'HealRatioBase') },
                                                { label: 'DMG', value: ['Physical', 'Fire', 'Ice', 'Lightning', 'Wind', 'Quantum', 'Imaginary'].map(e => getStat(e.toLowerCase() + '_dmg')).find(v => v !== '0' && v !== '0.0%') || '0.0%' }
                                            ].filter(s => s.value !== '0' && s.value !== '0.0%' && s.value !== undefined);
                                        }
                                    } else {
                                        const fp = fightPropMap;
                                        stats = [
                                            { label: 'HP', value: Math.round(fp[2000] || 0).toLocaleString() },
                                            { label: 'ATK', value: Math.round(fp[2001] || 0).toLocaleString() },
                                            { label: 'DEF', value: Math.round(fp[2002] || 0).toLocaleString() },
                                            { label: 'EM', value: Math.round(fp[28] || 0).toLocaleString() },
                                            { label: 'CRIT', value: ((fp[20] || 0) * 100).toFixed(1) + '%' },
                                            { label: 'CDMG', value: ((fp[22] || 0) * 100).toFixed(1) + '%' },
                                            { label: 'ER', value: ((fp[23] || 0) * 100).toFixed(1) + '%' },
                                            { label: 'DMG', value: ((Math.max(fp[30]||0, fp[40]||0, fp[41]||0, fp[42]||0, fp[43]||0, fp[44]||0, fp[45]||0, fp[46]||0) * 100).toFixed(1)) + '%' }
                                        ].filter(s => s.value !== '0' && s.value !== '0.0%');
                                    }

                                    return (
                                        <div className={`rounded-2xl overflow-hidden relative border bg-gradient-to-br ${elementClass} shadow-2xl`}>
                                            <div className="absolute top-4 right-4 z-20">
                                                <button 
                                                    onClick={() => setSelectedChar(null)}
                                                    className="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>

                                            <div className="p-6 flex items-center justify-between bg-black/20 backdrop-blur-sm border-b border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-16 h-16 rounded-full border-2 overflow-hidden bg-black/50 ${meta?.rarity === 5 ? 'border-orange-400' : 'border-purple-400'}`}>
                                                        {meta?.icon ? (
                                                            <img src={meta.icon} alt={meta.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="flex items-center justify-center h-full text-[10px]">ID:{char.avatarId}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className={`font-bold text-2xl leading-none ${meta?.rarity === 5 ? 'text-orange-200' : 'text-purple-200'}`}>
                                                                {meta?.name || `Char ${char.avatarId}`}
                                                            </h3>
                                                            {meta?.rarity === 5 && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                                                        </div>
                                                        <div className="text-sm text-white/60 flex items-center gap-3 mt-1">
                                                            <span>Lv. {game === 'hsr' ? char.level : (char.propMap?.[4001]?.val || '?')}</span>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                                            {game === 'hsr' && meta?.path && (
                                                                <span className="opacity-80">{pathMapping[meta.path] || meta.path}</span>
                                                            )}
                                                            {game === 'hsr' && (char.rank || 0) > 0 && (
                                                                <span className="text-[var(--primary)] font-bold">E{char.rank}</span>
                                                            )}
                                                            {game === 'genshin' && (char.talentIdList?.length || 0) > 0 && (
                                                                <span className="text-[var(--primary)] font-bold">C{char.talentIdList?.length}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 space-y-6">
                                                {weapon && (
                                                    <div className="flex items-center gap-4 bg-black/20 rounded-xl p-4 border border-white/5">
                                                        <div className="w-16 h-16 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 border border-white/10">
                                                            {(() => {
                                                                let iconUrl = null;
                                                                if (game === 'hsr') {
                                                                    const wpMeta = getWeaponInfo(weapon.tid);
                                                                    iconUrl = wpMeta?.icon || (weapon.icon ? `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${weapon.icon}` : null);
                                                                } else {
                                                                    iconUrl = weapon.flat?.icon ? `https://enka.network/ui/${weapon.flat.icon}.png` : null;
                                                                }
                                                                
                                                                if (iconUrl) return <img src={iconUrl} className="w-full h-full object-cover" alt="Weapon" />;
                                                                return <div className="w-full h-full flex items-center justify-center"><Sword size={20} className="text-white/20" /></div>;
                                                            })()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-lg font-bold truncate text-white/90">
                                                                {(() => {
                                                                    if (game === 'hsr') {
                                                                        const wpMeta = getWeaponInfo(weapon.tid);
                                                                        if (wpMeta?.name) return wpMeta.name;
                                                                        return weapon.name || "Unknown Light Cone";
                                                                    } else {
                                                                        if (weapon.flat?.nameTextMapHash) {
                                                                            return locMetadata[weapon.flat.nameTextMapHash] || "Unknown Weapon";
                                                                        }
                                                                        return "Unknown Weapon";
                                                                    }
                                                                })()}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-white/50 mt-1">
                                                                <span className="bg-white/10 px-2 py-0.5 rounded text-white/70">Lv. {weapon.level}</span>
                                                                <span className="text-[var(--primary)] font-bold">R{game === 'hsr' ? weapon.rank : ((Object.values(weapon.weapon?.affixMap || {})[0] as number) || 0) + 1}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="flex-1 space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                                                        <h4 className="text-white/40 uppercase text-xs font-bold tracking-wider mb-2">Attributes</h4>
                                                        {stats.length > 0 ? stats.map((stat, i) => (
                                                            <div key={`${stat.label}-${i}`} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                                                                <span className="text-white/60 text-sm">{stat.label}</span>
                                                                <span className={`font-mono font-medium ${stat.label.includes('CRIT') ? 'text-yellow-400' : 'text-white/90'}`}>{stat.value}</span>
                                                            </div>
                                                        )) : (
                                                            <div className="text-white/40 text-sm italic">
                                                                No stats available
                                                                <div className="text-[10px] text-white/20 mt-2 font-mono break-all hidden group-hover:block">
                                                                    Keys: {JSON.stringify(Object.keys(char || {}))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {relics.length > 0 && (
                                                        <div className="flex-1 bg-black/20 p-4 rounded-xl border border-white/5">
                                                            <h4 className="text-white/40 uppercase text-xs font-bold tracking-wider mb-3">Relics</h4>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {relics.map((relic: any, idx: number) => {
                                                                    let iconUrl = null;
                                                                    let relicName = 'Relic';
                                                                    let rarity = 5;
                                                                    let hsrStats: any = null;
                                                                    
                                                                    if (game === 'hsr') {
                                                                        const relicInfo = getRelicInfo(relic.tid);
                                                                        if (relicInfo) {
                                                                            iconUrl = relicInfo.icon;
                                                                            relicName = relicInfo.name;
                                                                        } else {
                                                                            const setMeta = getRelicSetInfo(relic.setID || relic.tid);
                                                                            iconUrl = setMeta?.icon || (relic.icon ? `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${relic.icon}` : null);
                                                                            relicName = setMeta?.name || relic.name || 'Unknown Relic';
                                                                        }
                                                                        rarity = relic.rarity || 5;
                                                                        hsrStats = getHsrRelicStats(relic);
                                                                    } else {
                                                                        iconUrl = relic.flat?.icon ? `https://enka.network/ui/${relic.flat.icon}.png` : null;
                                                                        relicName = relic.flat?.nameTextMapHash ? (locMetadata[relic.flat.nameTextMapHash] || 'Relic') : 'Relic';
                                                                        rarity = relic.reliquary?.rankLevel || 5;
                                                                    }

                                                                    return (
                                                                        <div 
                                                                            key={`relic-${idx}`} 
                                                                            className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                                                                            onClick={() => setSelectedRelic({ ...relic, _meta: { name: relicName, icon: iconUrl, rarity }, _hsrStats: hsrStats })}
                                                                        >
                                                                            <div className={`w-10 h-10 rounded-lg bg-black/30 flex-shrink-0 overflow-hidden border ${rarity === 5 ? 'border-orange-400/30' : 'border-purple-400/30'}`}>
                                                                                {iconUrl && <img src={iconUrl} className="w-full h-full object-cover p-1" alt="Relic" />}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className={`text-xs font-bold truncate ${rarity === 5 ? 'text-orange-200' : 'text-purple-200'}`}>
                                                                                    {relicName}
                                                                                </div>
                                                                                <div className="text-[10px] text-white/50 mt-1 flex flex-col gap-0.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-white/70 truncate">
                                                            {game === 'hsr' 
                                                                ? (hsrStats?.main ? (statMapping[hsrStats.main.type] || hsrStats.main.type) : 'Main Stat')
                                                                : (relic.flat?.reliquaryMainstat?.mainPropId ? (statMapping[relic.flat.reliquaryMainstat.mainPropId] || 'Main Stat') : 'Main Stat')
                                                            }
                                                        </span>
                                                        <span className="font-mono text-orange-200">
                                                            {game === 'hsr'
                                                                ? (hsrStats?.main ? formatStatValue(hsrStats.main.type, hsrStats.main.value) : '?')
                                                                : (relic.flat?.reliquaryMainstat?.statValue || '?')
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-end">
                                                        <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/60 font-mono">
                                                            +{game === 'hsr' ? relic.level : (relic.reliquary?.level ? relic.reliquary.level - 1 : 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </motion.div>
                    )}

                    {selectedRelic && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                            onClick={() => setSelectedRelic(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl"
                            >
                                <button 
                                    onClick={() => setSelectedRelic(null)}
                                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className={`w-24 h-24 rounded-xl bg-gradient-to-br ${selectedRelic._meta?.rarity === 5 ? 'from-orange-900/40 to-orange-600/10 border-orange-500/30' : 'from-purple-900/40 to-purple-600/10 border-purple-500/30'} border-2 flex items-center justify-center`}>
                                        {selectedRelic._meta?.icon && <img src={selectedRelic._meta.icon} className="w-20 h-20 object-contain" alt="Relic" />}
                                    </div>
                                    
                                    <div>
                                        <h3 className={`text-lg font-bold ${selectedRelic._meta?.rarity === 5 ? 'text-orange-200' : 'text-purple-200'}`}>
                                            {selectedRelic._meta?.name}
                                        </h3>
                                        <div className="text-sm text-white/40 mt-1">
                                            {game === 'hsr' ? (
                                                getRelicSetInfo(selectedRelic.setID || selectedRelic.tid)?.name
                                            ) : (
                                                selectedRelic.flat?.setNameTextMapHash ? locMetadata[selectedRelic.flat.setNameTextMapHash] : 'Unknown Set'
                                            )}
                                        </div>
                                        <div className="inline-block bg-black/40 px-3 py-1 rounded-full text-orange-300 font-mono font-bold mt-2">
                                            +{game === 'hsr' ? selectedRelic.level : (selectedRelic.reliquary?.level ? selectedRelic.reliquary.level - 1 : 0)}
                                        </div>
                                    </div>

                                    <div className="w-full space-y-4 pt-4 border-t border-white/5">
                                        <div className="bg-white/5 rounded-lg p-3">
                                            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Main Stat</div>
                                            {game === 'hsr' ? (
                                                <div className="flex justify-between items-end">
                                                    <span className="text-white/80">{selectedRelic._hsrStats?.main ? (statMapping[selectedRelic._hsrStats.main.type] || selectedRelic._hsrStats.main.type) : 'Unknown'}</span>
                                                    <span className="text-xl font-bold text-white">{selectedRelic._hsrStats?.main ? formatStatValue(selectedRelic._hsrStats.main.type, selectedRelic._hsrStats.main.value) : '?'}</span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-end">
                                                    <span className="text-white/80">{selectedRelic.flat?.reliquaryMainstat?.mainPropId ? (statMapping[selectedRelic.flat.reliquaryMainstat.mainPropId] || selectedRelic.flat.reliquaryMainstat.mainPropId) : 'Unknown'}</span>
                                                    <span className="text-xl font-bold text-white">{selectedRelic.flat?.reliquaryMainstat?.statValue}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-xs text-white/40 uppercase tracking-wider text-left">Sub Stats</div>
                                            {game === 'hsr' ? (
                                                (selectedRelic._hsrStats?.subs || []).map((sub: any, idx: number) => (
                                                    <div key={`hsr-sub-${idx}`} className="flex justify-between text-sm">
                                                        <span className="text-white/60">{statMapping[sub.type] || sub.type}</span>
                                                        <span className="font-mono text-white/90">{formatStatValue(sub.type, sub.value)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                selectedRelic.flat?.relicStats?.map((sub: any, idx: number) => (
                                                    <div key={`gen-sub-${idx}`} className="flex justify-between text-sm">
                                                        <span className="text-white/60">{statMapping[sub.appendPropId] || sub.appendPropId}</span>
                                                        <span className="font-mono text-white/90">{sub.statValue}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}