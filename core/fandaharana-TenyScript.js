// ============================================================
// 1. DONNÉES STATIQUES & UTILITAIRES PRIVÉS
// ============================================================
const REF_ACCUEIL = {
    "salue": ["Romana 1:7", "1 Korintiana 1:3", "2 Tesaloniana 3:16", "3 Jaona 1:14"],
    "joie": ["Filipiana 4:4", "Salamo 118:24", "Nehemia 8:10", "Salamo 16:11"],
    "amour": ["1 Jaona 4:7", "Jaona 3:16", "Jeremia 31:3", "Romana 5:8"],
    "encouragement": ["Isaia 41:10", "Josoa 1:9", "Filipiana 4:13", "Salamo 46:1"],
    "bonheur": ["Salamo 1:1-2", "Matio 5:3-9", "Salamo 34:8", "Ohabolana 16:20"],
    "benediction": ["Nomery 6:24-26", "Salamo 67:1", "2 Korintiana 13:13", "Efesianina 1:3"],
    "defaut": ["Filipiana 4:4", "Isaia 41:10", "Nomery 6:24-26", "1 Jaona 4:7"]
};

async function _fetchMeteo() {
    try {
        const coords = await new Promise((resolve) => {
            if (!navigator.geolocation) resolve({ lat: 47.5, lon: 18.9 });
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                () => resolve({ lat: 47.5, lon: 18.9 }) 
            );
        });
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`;
        const response = await fetch(url);
        const data = await response.json();
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        const icones = { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 61: "🌧️", 71: "❄️", 95: "⚡" };
        return `${icones[code] || "🌤️"} ${temp}°C`;
    } catch (e) { return "🌤️ --°C"; }
}

function injecterStylesFandaharana() {
    if (document.getElementById('fandaharana-ide-styles')) return;
    const style = document.createElement('style');
    style.id = 'fandaharana-ide-styles';
    style.innerHTML = `
        .f-ide-conteneur-pliable { cursor: pointer; position: relative; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; text-align: left; margin: 0; padding: 0; padding-left: 8px; border-left: 2px solid rgba(255,255,255,0.2); transition: border-left-color 0.3s; margin-bottom: 8px; }
        .f-ide-conteneur-pliable:hover { border-left-color: rgba(255, 255, 255, 1); }
        .f-ide-conteneur-pliable.est-ouvert { -webkit-line-clamp: unset; display: block; border-left-color: rgba(255, 224, 130, 1); }
        .f-ide-titre-section { font-weight: bold; font-size: 0.9em; text-transform: uppercase; }
        .f-ide-couleur-perikopa { color: rgba(255, 224, 130, 1); }
        .f-ide-couleur-bible { color: rgba(165, 214, 167, 1); }
        .f-ide-couleur-ia { color: rgba(144, 202, 249, 1); }
        .f-ide-couleur-credo { color: rgba(206, 147, 216, 1); }
        .f-ide-texte-standard { color: rgba(204, 204, 204, 1); display: inline; }
        .f-ide-texte-biblique { font-style: italic; color: rgba(204, 204, 204, 1); display: inline; }
        .f-ide-liste-verticale { display: block; padding: 0; margin: 0; list-style: none; }
        .f-ide-liste-verticale li { display: block; color: rgba(204, 204, 204, 1); margin: 0; padding: 0; }
        .f-ide-perikopa-fixe { display: block; text-align: left; margin: 5px 0; padding: 0 0 0 8px; border-left: 2px solid rgba(255, 224, 130, 1); }
        .f-ide-badge-hira { font-weight: bold; text-transform: uppercase; color: rgba(255, 224, 130, 1); }
        .f-ide-theme-mois { color: rgba(255, 255, 0, 1); font-weight: bold; text-transform: uppercase; }
        .f-ide-note-interne { display: none; }
        .f-ide-timer-badge { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.8em; color: rgba(129, 212, 250, 1); border: 1px solid rgba(129, 212, 250, 0.3); }
        .f-ide-separateur-titre { border-bottom: 1px solid rgba(255,255,255,0.1); margin: 15px 0 10px 0; padding-bottom: 1px; color: rgba(255, 224, 130, 1); font-weight: bold; text-transform: uppercase; display: block; }
        .f-ide-verset-accueil { font-style: italic; border-left: 2px solid rgba(165, 214, 167, 1); margin-bottom: 20px; padding-left: 10px; margin: 5px 0; display: block; }
        .f-ide-alerte { color: rgba(255, 82, 82, 1); font-weight: bold; border: 1px dashed rgba(255, 82, 82, 1); padding: 4px; display: block; margin: 5px 0; }
        .f-ide-meteo { color: rgba(255, 213, 79, 1); font-size: 0.9em; }
        .f-ide-amen { display: block; text-align: right; font-style: italic; font-weight: bold; color: rgba(255, 224, 130, 1); margin-top: 5px; padding-right: 10px; }
        .f-ide-error { color: red; font-size: 0.8em; }
    `;
    document.head.appendChild(style);
}

// ============================================================
// 2. LA LIBRAIRIE UNIFIÉE (FandaharanaLib)
// ============================================================
const FandaharanaLib = {
    
    // --- Utilitaires de base ---
    _getLang: () => localStorage.getItem('langue') || 'mg',
    
    titre: (text) => `<span class='f-ide-separateur-titre'>${text}</span>`,
    note: (text) => `<span class='f-ide-note-interne'>Note: ${text}</span>`,
    alerte: (text) => `<span class='f-ide-alerte'>⚠ ${text}</span>`,
    amen: () => `<span class='f-ide-amen'>Amen.</span>`,
    timer: (txt, min) => `<span class='f-ide-timer-badge'>🕒 ${min || txt} min</span>`,
    
    espace: (val) => {
        let v = val ? val.toString().trim() : "10px";
        if (/^-?\d+(\.\d+)?$/.test(v)) v += 'px';
        return `<div style="display:block; width:100%; height:${v}; min-height:${v}; clear:both;" aria-hidden="true"></div>`;
    },

    // --- Tu peux ajouter de nouvelles fonctions ici très simplement ! ---
    // exemple: (texte) => `<h1>${texte}</h1>`,

    // --- Date et Météo ---
    today: () => `<span style="color:rgb(255, 255, 255); font-weight:bold">${new DateAPI().getDateCompleteTexte(localStorage.getItem('langue')||'mg')}</span>`,
    androany: function() { return this.today(); }, // Alias
    
    meteo: async () => `<span class='f-ide-meteo'>${await _fetchMeteo()}</span>`,

    // --- Perikopa ---
    perikopa: async (options = "") => {
        injecterStylesFandaharana();
        const argsString = options.toLowerCase();
        const modeLecture = argsString.includes(":hamaky") || argsString.includes(":lire") || argsString.includes(":read");
        const showDate = argsString.includes(":date") || argsString.includes(":daty");
        const showName = argsString.includes("with_name") || argsString.includes("name");
        const langue = FandaharanaLib._getLang();

        try {
            const api = new PerikopaAPI(); await api.init();
            const result = api.getClosestReadingsFromToday();

            if (result && result.readings) {
                let htmlOutput = "";
                let dateHtml = "";
                
                if (showDate && result.fullDate) {
                    try {
                        const dApi = new DateAPI(result.fullDate);
                        dateHtml = ` <span style="font-size:0.8em; opacity:0.8; font-weight:normal; text-transform: capitalize;">- ${dApi.getDateCompleteTexte(langue)}</span>`;
                    } catch (e) {}
                }

                let headerContent = ((showName ? result.name : "") + dateHtml).trim();
                if (headerContent.startsWith("-")) headerContent = headerContent.substring(1).trim();

                if (modeLecture) {
                    if (headerContent) {
                        htmlOutput += `<span class='f-ide-separateur-titre' style='border:none; margin-bottom:5px; color:rgb(255, 224, 130);'>${headerContent}</span>`;
                    }
                    const bibleApi = new BibleAPI(langue); await bibleApi.ready;
                    const refPlus = (typeof BibleReferencePlus !== 'undefined') ? new BibleReferencePlus() : null;
                    const bibleRef = (typeof BibleReference !== 'undefined') ? new BibleReference() : null;

                    for (let raw of result.readings) {
                        let ref = raw.replace(/<[^>]*>/g, "").trim();
                        if(refPlus && bibleRef) {
                            ref = refPlus.convertToLong(`${ref}`, langue);
                            ref = await bibleRef.format_autreLangue(ref, langue);
                        }
                        const res = await bibleApi.lireParReference(ref);
                        if(res && !res.error) {
                            const txt = res.verses.map(v => `<sup style='font-size:0.7em;opacity:0.6;margin-right:2px;'>${v.verse}</sup>${typeof normaliserReference === 'function' ? normaliserReference(v.text) : v.text}`).join(' ');
                            htmlOutput += `<div class='f-ide-conteneur-pliable' onclick="this.classList.toggle('est-ouvert')"><span class='f-ide-titre-section f-ide-couleur-bible'>${res.ref}</span><span class='f-ide-texte-biblique'>${txt}</span></div>`;
                        } else {
                            htmlOutput += `<div class='f-ide-alerte'>Tsy hita : ${ref}</div>`;
                        }
                    }
                } else {
                    const list = result.readings.map(r => `<li>${r.replace(/<[^>]*>/g, "")}</li>`).join('');
                    const title = headerContent ? `<span class='f-ide-titre-section f-ide-couleur-perikopa'>${headerContent}</span>` : "";
                    htmlOutput = `<div class='f-ide-perikopa-fixe'>${title}<ul class='f-ide-liste-verticale'>${list}</ul></div>`;
                }
                return htmlOutput;
            }
        } catch (e) { return `<span class="f-ide-error">Erreur Perikopa</span>`; }
        return "";
    },

    vakiteny: function(options = "") {return this.perikopa(options);},

    // --- Bible : Lire une référence simple ---
    hamaky: async (refBrute) => {
        if(!refBrute) return "";
        injecterStylesFandaharana();
        const langue = FandaharanaLib._getLang();
        try {
            const api = new BibleAPI(langue); await api.ready;
            const res = await api.lireParReference(refBrute.replace(/<[^>]*>/g, "").trim());
            if(res && !res.error) {
                const txt = res.verses.map(v => `<br><sup style='font-size:0.7em;opacity:0.6;margin-right:2px;'>${v.verse}</sup>${typeof normaliserReference === 'function' ? normaliserReference(v.text) : v.text}`).join(' ');
                return `<div class='f-ide-conteneur-pliable' onclick="this.classList.toggle('est-ouvert')"><span class='f-ide-titre-section f-ide-couleur-bible'>${res.ref}</span><span class='f-ide-texte-biblique'>${txt}</span></div>`;
            }
            return `<span class="f-ide-error">Tsy hita: ${refBrute}</span>`;
        } catch(e) { return `<span class="f-ide-error">Erreur lecture: ${refBrute}</span>`; }
    },
    lire: function(ref) { return this.hamaky(ref); },
    read: function(ref) { return this.hamaky(ref); },

    // --- Bible : Verset d'accueil aléatoire ---
    verset_accueil: async (categorie = "defaut") => {
        injecterStylesFandaharana();
        let cat = categorie ? categorie.trim().toLowerCase() : "defaut";
        let src = REF_ACCUEIL[cat] || REF_ACCUEIL["defaut"];
        try {
            const langue = FandaharanaLib._getLang();
            const api = new BibleAPI(langue); await api.ready;
            const ref = src[Math.floor(Math.random() * src.length)];
            const res = await api.lireParReference(ref);
            if(res && !res.error) {
                const txt = res.verses.map(v => v.text).join(' ');
                return `<span class='f-ide-verset-accueil'><b>${ref} :</b> ${txt}</span>`;
            }
        } catch(e) { return ""; }
        return "";
    },

    // --- Fihirana : Hihira (Chanter précis) ---
    hihira: async (arg1, arg2) => {
        injecterStylesFandaharana();
        let refBrute = arg1;
        let rawVerses = arg2 || "all";
        
        if (!arg2 && arg1 && arg1.includes(',')) {
            const splitIndex = arg1.indexOf(',');
            refBrute = arg1.substring(0, splitIndex).trim();
            rawVerses = arg1.substring(splitIndex + 1).trim();
        }

        try {
            const api = new FihiranaAPI();
            const refNorm = refBrute.replace(/([a-zA-Z]+)([0-9]+)/, '$1 $2');
            const parts = refNorm.split(/\s+/);
            if(parts.length < 2) return "(Hira ?)";

            const result = await api.chanter(parts[0], parts[1]);
            if(result && result.content) {
                const available = result.content;
                const maxStrophe = Math.max(...available.map(v => v.number));
                let selectedNums = [];
                const vClean = rawVerses.toString().toLowerCase().replace(/[\[\]\s]/g, '');

                if(vClean === 'all' || vClean === '') {
                    selectedNums = available.map(v => v.number);
                } else if (vClean.includes('-')) {
                    const range = vClean.split('-').map(Number);
                    let end = Math.min(range[1], maxStrophe);
                    for (let i = range[0]; i <= end; i++) selectedNums.push(i);
                } else {
                    selectedNums = vClean.split(/[,;]/).map(Number).filter(n => !isNaN(n) && n <= maxStrophe);
                }

                const versesHtml = selectedNums.map(num => {
                    const s = available.find(v => v.number === num);
                    if (!s) return "";
                    const rTxt = s.refrain ? `<br><i style="opacity:0.7">Ref: ${s.refrain.replace(/\n/g, '<br>')}</i>` : "";
                    return `<div style='margin-bottom:10px;'><b style='color:rgb(255, 183, 77);'>${s.number}.</b> ${s.chant.replace(/\n/g, '<br>')}${rTxt}</div>`;
                }).join('');

                return `<div class='f-ide-conteneur-pliable' onclick="this.classList.toggle('est-ouvert')"><div class='f-ide-titre-hira'>${result.ref} (${selectedNums.join(', ')})</div><span class='f-ide-texte-standard'>${versesHtml}</span></div>`;
            }
        } catch (e) { return `<span class="f-ide-error">Hira tsy hita: ${refBrute}</span>`; }
        return "";
    },

    // --- Fihirana : Hira Aléatoire ---
    hira_rand: async (selection = ":auto") => {
        const sel = selection ? selection.trim().toLowerCase() : ":auto";
        try {
            const api = new FihiranaAPI();
            let chant;
            if(sel === ":auto" || sel === "") chant = await api.chantRandom();
            else {
                const { count } = await api.nombreChant(sel);
                if (count > 0) chant = { ref: `${sel.toUpperCase()} ${Math.floor(Math.random() * count) + 1}` };
                else throw new Error();
            }
            return `<span class='f-ide-badge-hira'>${chant.ref}</span>`;
        } catch(e) { return "(?)"; }
    },

    // --- Fihirana : Série de chants ---
    hira_serie: async (livre, nombre) => {
        const type = livre.trim().toLowerCase();
        const nb = parseInt(nombre);
        try {
            const api = new FihiranaAPI();
            const stats = await api.nombreChant(type);
            if(stats && stats.count > 0) {
                let hiras = [], sel = new Set();
                while(hiras.length < nb && sel.size < stats.count) {
                    const r = Math.floor(Math.random() * stats.count) + 1;
                    if(!sel.has(r)) { sel.add(r); hiras.push(`<span class='f-ide-badge-hira'>${type.toUpperCase()} ${r}</span>`); }
                }
                return hiras.join(' - ');
            }
            return `<small>(Recueil ${type} tsy hita)</small>`;
        } catch(e) { return `<span class="f-ide-alerte">Erreur série</span>`; }
    },

    // --- Mofonaina ---
    mofonaina: async () => {
        try {
            const api = new MofonainaAPI();
            const ref = await api.mofonaina_androany();
            return `<span style="color:rgb(255, 255, 255); font-weight:bold">${ref || "(!)"}</span>`;
        } catch (e) { return "(!)"; }
    },

    // --- Theme / Lohahevitra ---
    lohahevitra: async () => {
        try {
            const langue = FandaharanaLib._getLang();
            const th = await new LohahevitraAPI().getCurrentMonthTheme(langue);
            return `<span class='f-ide-theme-mois'>${th}</span>`;
        } catch(e) { return ""; }
    },
    theme: function() { return this.lohahevitra(); },

    // --- Fanekem-pinoana ---
    credo: async (version = "1") => {
        injecterStylesFandaharana();
        const api = new FanekepinoanaAPI();
        const langue = FandaharanaLib._getLang();
        const v = version ? version.toString().trim() : "1";
        try {
            const txt = await api.getVersion(v, langue);
            if(txt) {
                return `<div class='f-ide-conteneur-pliable' onclick="this.classList.toggle('est-ouvert')"><span class='f-ide-titre-section f-ide-couleur-credo'>Fanekem-pinoana ${v}</span><br><span class='f-ide-texte-standard'>${txt.replace(/\n/g, ' ')}</span></div>`;
            }
            return `(Fanekem-pinoana ${v} ?)`;
        } catch(e) { return "(!)"; }
    },
    fanekempinoana: function(v) { return this.credo(v); }
};

// ============================================================
// 3. FONCTION LEGACY (POUR COMPATIBILITÉ MOFONAINA ANCIEN)
// ============================================================
// On garde cette fonction uniquement si l'ancienne application l'appelle encore.
// Pour la V3, c'est le moteur TenyScript-core.js qui fait tout le travail !
async function fandaharana_IDE(text) {
    if (!text) return "";
    injecterStylesFandaharana();

    const tempDiv = document.createElement("div");
    let cleanText = text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/li>/gi, '\n');
    tempDiv.innerHTML = cleanText;
    let processedText = (tempDiv.textContent || tempDiv.innerText || "").replace(/\/\*[\s\S]*?\*\//g, "");

    const context = { text: processedText, variables: {}, langue: FandaharanaLib._getLang() };
    if (typeof executerMiniLangage === "function") await executerMiniLangage(context);
    return context.text.replace(/\n/g, '').trim();
}

// ============================================================
// 🚀 4. AUTO-INJECTION PLUG & PLAY DANS TENYSCRIPT (V3)
// ============================================================
// On intercepte le moteur global pour y glisser nos fonctions automatiquement
if (typeof window.executerMiniLangage === 'function' && !window._fandaInjected) {
    const _moteurOriginal = window.executerMiniLangage;
    
    window.executerMiniLangage = async function(context, debugOverride) {
        // On fusionne silencieusement FandaharanaLib dans les bibliothèques custom du contexte
        context.customLib = Object.assign({}, FandaharanaLib, context.customLib || {});
        return await _moteurOriginal(context, debugOverride);
    };
    
    window._fandaInjected = true;
    console.log("✝️ Bibliothèque Fandaharana auto-injectée dans TenyScript !");
} else {
    window.getFandaharanaRegistry = () => FandaharanaLib;
}

// ============================================================
// 5. CHARGEMENT AUTO DES APIs MOFONAINA
// ============================================================
const import_API = () => {
    const dependencies = {
        "PerikopaAPI": "https://mofonaina-cabea.web.app/assets/js/API/perikopaAPI.js",
        "DateAPI": "https://mofonaina-cabea.web.app/assets/js/API/dateAPI.js",
        "BibleAPI": "https://mofonaina-cabea.web.app/assets/js/API/api_v5c.js",
        "BibleReference": "https://mofonaina-cabea.web.app/assets/js/API/bibleReference.js",
        "BibleReferencePlus": "https://mofonaina-cabea.web.app/assets/js/API/bibleReferencePlus.js",
        "MofonainaAPI": "https://mofonaina-cabea.web.app/assets/js/API/mofonainaAPI.js",
        "FihiranaAPI": "https://mofonaina-cabea.web.app/assets/js/API/fihiranaAPI_v4.js",
        "LohahevitraAPI": "https://mofonaina-cabea.web.app/assets/js/API/lohahevitraAPI.js",
        "FanekempinoanaAPI": "https://mofonaina-cabea.web.app/assets/js/API/fanekempinoanaAPI.js"
    };

    Object.entries(dependencies).forEach(([className, url]) => {
        if (typeof window[className] === 'undefined') {
            console.log(`📥 Chargement auto : ${className}`);
            const script = document.createElement('script');
            script.src = url;
            script.async = false;
            script.onerror = () => console.error(`❌ Impossible de charger ${url}`);
            document.head.appendChild(script);
        }
    });
};

import_API();