// --- SYSTÈME DE MODULES HYBRIDE (JS/TENY) ---
window.TenyModules = {};

// Cette fonction permet à un fichier JS externe de déclarer du code TenyScript
window.ts_define = (nomModule, codeTeny) => {
    console.log("📦 Module chargé en mémoire : " + nomModule);
    window.TenyModules[nomModule] = codeTeny;
};


// --- MOTEUR GRAPHIQUE GLOBAL (Chart.js Loader) ---
window.TenyChartSystem = {
    loadAndDraw: function(id, labels, data, title) {
        const ctx = document.getElementById(id);
        if (!ctx) return; // Le DOM n'est pas encore prêt

        // 1. Si Chart.js n'est pas là, on le charge
        if (typeof Chart === 'undefined') {
            if (!window.chartLoading) {
                window.chartLoading = true;
                const script = document.createElement('script');
                script.src = "https://cdn.jsdelivr.net/npm/chart.js";
                script.onload = () => { window.chartLoading = false; };
                document.head.appendChild(script);
            }
            // On réessaie dans 100ms
            setTimeout(() => this.loadAndDraw(id, labels, data, title), 100);
            return;
        }

        // 2. Si on charge encore, on attend
        if (window.chartLoading) {
            setTimeout(() => this.loadAndDraw(id, labels, data, title), 100);
            return;
        }

        // 3. Dessin du graphique
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    borderColor: '#00e676', // Couleur Cyberpunk
                    backgroundColor: 'rgba(0, 230, 118, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#000',
                    pointBorderColor: '#00e676'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#aaa' } } },
                scales: {
                    y: { ticks: { color: '#666' }, grid: { color: '#333' } },
                    x: { ticks: { color: '#666' }, grid: { color: '#333' } }
                }
            }
        });
    }
};



// 2. AVERTISSEMENT (Optionnel, utile pour le debug)
// alert("PATCH MÉMOIRE ACTIVÉ.\nLancez votre script 'main.teny' maintenant.");

async function executerMiniLangage(context, debugOverride = false) {
    if (typeof injecterStylesTenyScript == "function") { injecterStylesTenyScript(); };

    // --- AJOUT : SAUVEGARDE DU CODE SOURCE (Pour le rechargement) ---
    if (!context.isRecursion && context.text) {
        window.TenyLastSource = context.text;
    }

    // --- DEBUG SETUP ---
    const debug = (localStorage.getItem('debug_TS') === 'true') || debugOverride;
    let logger = null;
    if (debug && !context.isRecursion) {
        logger = injectDebugConsole();
        logger('INFO', '--- EXÉCUTION (TenyScript Turbo Engine) ---');
    } else if (context.debugLogger) {
        logger = context.debugLogger;
    }
    const trace = (type, msg, line = null) => { if (logger) logger(type, msg, line); };
    context.debugLogger = logger;

    const startTime = performance.now();
    let text = context.text || ""; 
    const langue = context.langue || 'fr';



  // --- AJOUT : Partage des fonctions (pour que les boutons les voient) ---
    if (!window.TenyGlobalRegistry) window.TenyGlobalRegistry = {};
    const functionRegistry = context.functionRegistry || window.TenyGlobalRegistry;
    // On met à jour le registre global si on est dans le script principal
    if (!context.isRecursion) window.TenyGlobalRegistry = functionRegistry;
    // -----------------------------------------------------------------------




    const globalVars = context.variables;
    const localVars = context.localScope || (context.isRecursion ? Object.create(globalVars) : null);
    const mathCache = context.mathCache || new Map();
    context.mathCache = mathCache;

    let opsCounter = 0;
    const MAX_OPS = 5000;
    const MAX_TIME_MS = 10000;
    const MAX_RECURSION_DEPTH = 5;
    const MAX_LOOP_ITER = 200;

    context.recursionDepth = context.recursionDepth || 0;
    if (context.isRecursion) context.recursionDepth++;
    if (context.recursionDepth > MAX_RECURSION_DEPTH) {
        return renderError(`Limite de récursion dépassée`);
    }

    // --- OUTILS ---
    const getLineNumber = (index) => {
        if (index < 0 || !text) return 1;
        return text.substring(0, index).split('\n').length;
    };
    
    const renderError = (msg, index = -1) => {
        const line = index > -1 ? getLineNumber(index) : "?";
        trace('ERROR', msg, line);
        return `<div class='f-ide-error'>🚫 Erreur [Ligne ${line}] : ${msg}</div>`;
    };

    const getVar = (name) => {
        if (localVars && name in localVars) return localVars[name];
        if (globalVars && name in globalVars) return globalVars[name];
        return undefined;
    };
    
    const setVar = (name, val) => {
        if (localVars) {
            let scope = localVars;
            while (scope) {
                if (Object.prototype.hasOwnProperty.call(scope, name)) { scope[name] = val; return; }
                scope = Object.getPrototypeOf(scope);
                if (scope === globalVars || scope === null) break;
            }
        }
        if (Object.prototype.hasOwnProperty.call(globalVars, name)) { globalVars[name] = val; return; }
        if (localVars) localVars[name] = val; else globalVars[name] = val;
    };

    const interpolate = (str) => {
        if (!str || typeof str !== 'string') return str || "";
        if (str.indexOf('$') === -1) return str;
        return str.replace(/\$(\w+)/g, (match, varName) => {
            const val = getVar(varName);
            if (typeof val === 'object' && val !== null) return JSON.stringify(val);
            return val !== undefined ? val : match;
        });
    };

    const evalSimple = (expr) => {
        if (!expr) return "";
        if (typeof expr === 'object') return expr;
        expr = expr.toString().trim();
        if (/^\$\w+$/.test(expr)) {
            const val = getVar(expr.substring(1));
            return val !== undefined ? val : expr;
        }
        if (!isNaN(expr) && expr !== "") return Number(expr);
        if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
            return expr.slice(1, -1);
        }
        if ((expr.startsWith('[') && expr.endsWith(']')) || (expr.startsWith('{') && expr.endsWith('}'))) {
            try { return JSON.parse(expr); } catch (e) { }
        }
        return interpolate(expr);
    };

    // --- EVALMATH CORRIGÉ (Vrai Fix JS) ---
    const evalMath = (expr) => {
        if (!expr) return 0;
        if (mathCache.has(expr)) return mathCache.get(expr);
        
        let clean = expr.toString().trim()
            .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/\r?\n|\r/g, ' '); 

        // Remplacement Variables
        let readyToEval = clean.replace(/\$(\w+)/g, (m, v) => {
            const val = getVar(v);
            if (val === undefined) return 0;
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') return '"' + val.replace(/"/g, '\\"') + '"';
            if (typeof val === 'object') return JSON.stringify(val);
            return val;
        });

        // Opérateurs logiques
        readyToEval = readyToEval.replace(/\band\b/gi, '&&').replace(/\bor\b/gi, '||').replace(/\bnot\b/gi, '!');

        // --- CORRECTION MAJEURE ICI ---
        // On met les noms de fonctions en MINUSCULES (Math.floor) et les constantes en MAJUSCULES (Math.PI)
        readyToEval = readyToEval.replace(/\b(PI|SQRT|POW|SIN|COS|TAN|FLOOR|CEIL|ROUND|ABS|RANDOM)\b/gi, (m) => {
            const upper = m.toUpperCase();
            if (upper === 'PI') return 'Math.PI';
            if (upper === 'E') return 'Math.E';
            return 'Math.' + upper.toLowerCase(); // Math.floor, Math.pow, etc.
        });
        
        // Correction spécifique pour RANDOM(min, max)
        // La regex précédente a transformé RANDOM en Math.random, donc on cherche "Math.random"
        readyToEval = readyToEval.replace(/Math\.random\s*\(\s*([^,)]+)\s*,\s*([^,)]+)\s*\)/gi, (m, min, max) => {
            return `(Math.floor(Math.random() * ((${max}) - (${min}) + 1)) + (${min}))`;
        });

        try {
            const res = new Function(`return (${readyToEval})`)();
            return res;
        } catch (e) {
            return interpolate(expr); 
        }
    };

    function trouverFinBloc(str, debut, type = '{}') {
        if (!str) return -1;
        let niveau = 0; const [ouvrant, fermant] = type.split('');
        for (let i = debut; i < str.length; i++) {
            if (str[i] === ouvrant) niveau++; else if (str[i] === fermant) { niveau--; if (niveau === 0) return i; }
        }
        return -1;
    }

    function parseArguments(content) {
        if (!content) return []; 
        if (!/['"()[\]{}+*/-]/.test(content)) {
            return content.split(',').map(arg => evalSimple(arg.trim()));
        }
        let args = []; let cur = ""; let inQ = false; let quoteChar = null; let pLevel = 0; let bLevel = 0; let cLevel = 0;
        for (let i = 0; i < content.length; i++) {
            let c = content[i];
            if ((c === '"' || c === "'") && !inQ) { inQ = true; quoteChar = c; }
            else if (c === quoteChar && inQ) { inQ = false; quoteChar = null; }
            if (!inQ) {
                if (c === '(') pLevel++; else if (c === ')') pLevel--;
                if (c === '[') bLevel++; else if (c === ']') bLevel--;
                if (c === '{') cLevel++; else if (c === '}') cLevel--;
            }
            if (c === ',' && !inQ && pLevel === 0 && bLevel === 0 && cLevel === 0) { args.push(cur.trim()); cur = ""; } else { cur += c; }
        }
        if (cur.trim()) args.push(cur.trim());
        
        return args.map(a => {
            if (/[+\-*/]/.test(a) || a.includes('"') || a.includes("'")) {
                let res = evalMath(a);
                if (res !== undefined) return res;
            }
            return evalSimple(a);
        });
    }

    const stdLib = {
        // --- RELOAD SÉCURISÉ (Empêche les boucles infinies) ---
    
        date: () => new Date().toLocaleDateString(),
        upper: (str) => str?.toString().toUpperCase() || "",
        lower: (str) => str?.toString().toLowerCase() || "",
        len: (arg) => {
            if (Array.isArray(arg)) return arg.length;
            if (typeof arg === 'object' && arg !== null) return Object.keys(arg).length;
            return arg ? arg.toString().length : 0;
        },
        random: (min, max) => Math.floor(Math.random() * (Number(max) - Number(min) + 1)) + Number(min),
        wait: async (ms) => new Promise(r => setTimeout(r, Number(ms))),
        json_stringify: (obj) => JSON.stringify(obj, null, 2),
        json_parse: (str) => { try { return JSON.parse(str); } catch (e) { return {}; } },
        get: (obj, path) => {
            if (typeof obj === 'string') try { obj = JSON.parse(obj); } catch (e) { }
            if (!obj) return undefined;
            const keys = path.toString().split('.');
            let current = obj;
            for (let k of keys) {
                if (current === undefined || current === null) return undefined;
                current = current[k];
            }
            return current;
        },
        set: (obj, path, val) => {
            let isStr = typeof obj === 'string';
            if (isStr) try { obj = JSON.parse(obj); } catch (e) { }
            if (typeof obj !== 'object' || obj === null) return obj;
            const keys = path.toString().split('.');
            const lastKey = keys.pop();
            let current = obj;
            for (let k of keys) {
                if (!current[k]) current[k] = {}; current = current[k];
            }
            current[lastKey] = val;
            return obj;
        },
        push: (container, arg1) => {
            if (Array.isArray(container)) { container.push(arg1); }
            return ""; // <--- MODIFICATION : Retour vide
        },
        self: () => {
            const preview = document.getElementById('preview-frame');
            const container = preview || document.body; 
            if (container.lastElementChild) {
                const target = container.lastElementChild;
                if (!target.id) target.id = "ts_" + Math.random().toString(36).substr(2, 5);
                return target.id;
            }
            return "body";
        },
        dom_style: (sel, prop, val) => { const el = document.querySelector(sel); if(el) el.style[prop] = val; return ""; },
        dom_update: (sel, html) => { const el = document.querySelector(sel); if(el) el.innerHTML = html; return ""; },
        dom_get_elements: (sel) => Array.from(document.querySelectorAll(sel)),
        dom_get_attr: (el, attr) => el ? el.getAttribute(attr) : null,
        dom_replace_text: (search, replace) => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while(node = walker.nextNode()) {
                if (node.nodeValue.includes(search)) node.nodeValue = node.nodeValue.replace(new RegExp(search, 'g'), replace);
            }
            return "";
        },
        
        dom_inject_banner: (msg, col = "#007acc") => {
            const b = document.createElement('div');
            b.style = `position:fixed;top:0;left:0;width:100%;z-index:999999;background:${col};color:#fff;padding:8px;text-align:center;font-family:sans-serif;box-shadow:0 2px 10px rgba(0,0,0,0.2);`;
            b.innerHTML = `<b>TS:</b> ${msg}`;
            document.body.prepend(b);
            setTimeout(() => b.remove(), 3000); // Auto-suppression après 3s (Bonus)
            return ""; // <--- MODIFICATION : Retour vide pour ne rien afficher
        },

        http_get: async (url) => {
            try { const r = await fetch(url); return await r.json(); } catch(e) { return {error:true, msg:e.message}; }
        },
        http_post: async (url, data) => {
            try {
                const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
                return await r.json();
            } catch(e) { return {error:true, msg:e.message}; }
        },


        // Remplacer uniquement la fonction chart_line par celle-ci :
        chart_line: (labels, data, title = "Graphique") => {
            if (!data) return "";
            const chartId = "c_" + Math.random().toString(36).substr(2, 9);
            
            // Préparation des données pour l'injection
            const lArr = Array.isArray(labels) ? labels : labels.toString().split(',');
            const dArr = Array.isArray(data) ? data : data.toString().split(',').map(Number);
            
            // On convertit les données en chaîne JSON sécurisée pour l'attribut HTML
            const lSafe = JSON.stringify(lArr).replace(/"/g, "&quot;");
            const dSafe = JSON.stringify(dArr).replace(/"/g, "&quot;");
            
            // Le Trigger : <img src=x onerror="...">
            return `
            <div style="background:#111; padding:10px; border-radius:8px; border:1px solid #333; margin:10px 0;">
                <div style="height:250px; position:relative;">
                    <canvas id="${chartId}"></canvas>
                    <img src="x" style="display:none;" 
                         onerror="window.TenyChartSystem.loadAndDraw('${chartId}', ${lSafe}, ${dSafe}, '${title}')">
                </div>
            </div>`;
        },

        // --- AJOUTEZ CETTE LIGNE ---
        reload: () => { location.reload(); return ""; },


        list_modules: async () => {
            try {
                const m = await TSStorage.listModules();
                if(!m || m.length === 0) return "Aucun module.";
                return `<div class='f-ide-system-msg'>📦 <b>Modules:</b><br>${m.filter(x=>x!=='ide_session_state').map(x=>`• ${x}`).join('<br>')}</div>`;
            } catch(e) { return "Erreur module list"; }
        },
        import: async (fileName) => {
            const baseName = fileName.replace(/\.(teny|js)$/, "");
            const runInternal = async (source, origine) => {
                if (!source) return "";
                const tempCtx = { 
                    text: source, variables: globalVars, functionRegistry, 
                    isRecursion: false, mathCache 
                };
                await executerMiniLangage(tempCtx);
                return `<div style="color:#888; font-size:0.8em; margin-top:5px;">[Import] Chargé depuis : ${origine}</div>` + tempCtx.text;
            };
            if (window.TenyModules && window.TenyModules[baseName]) return await runInternal(window.TenyModules[baseName], "Mémoire (Cache JS)");
            try {
                let codeDB = await TSStorage.importModule(baseName + ".teny");
                if (!codeDB) codeDB = await TSStorage.importModule(baseName);
                if (codeDB) return await runInternal(codeDB, "Base de Données (Local)");
            } catch (e) { console.error("Err DB", e); }
            try {
                const jsUrl = baseName + ".js?t=" + Date.now();
                await new Promise((resolve, reject) => {
                    const s = document.createElement("script");
                    s.src = jsUrl; s.onload = resolve; s.onerror = () => reject();
                    document.head.appendChild(s);
                });
                if (window.TenyModules && window.TenyModules[baseName]) return await runInternal(window.TenyModules[baseName], "Fichier JS Externe");
            } catch(e) {}
            try {
                const rTeny = await fetch(baseName + ".teny");
                if (rTeny.ok) return await runInternal(await rTeny.text(), "Fichier .teny Serveur");
            } catch(e) {}
            return `<div class="f-ide-error">🚫 Import impossible : '${baseName}' introuvable.</div>`;
        },
        debug_functions: () => {
            const funcs = Object.keys(functionRegistry);
            if(funcs.length === 0) return "Aucune fonction chargée.";
            return `<div class="f-ide-system-msg">🔧 <b>Fonctions actives :</b><br>• ${funcs.join('<br>• ')}</div>`;
        },
        css: (url) => { if(!url) return ""; const l = document.createElement("link"); l.rel="stylesheet"; l.href=url; document.head.appendChild(l); return ""; },
        js: async (url) => { if(!url) return ""; return new Promise(r => { const s = document.createElement("script"); s.src=url; s.onload=r; document.head.appendChild(s); }); },
        execution_time: () => "",


        // --- 1. MANIPULATION AVANCÉE (TEXTE & TABLEAUX) ---
        split: (str, sep) => (str || "").toString().split(sep || " "),
        join: (arr, sep) => Array.isArray(arr) ? arr.join(sep || "") : arr,
        replace: (str, search, repl) => (str || "").toString().replace(new RegExp(search, 'g'), repl),
        trim: (str) => (str || "").toString().trim(),
        
        pop: (arr) => Array.isArray(arr) ? arr.pop() : null,
        shift: (arr) => Array.isArray(arr) ? arr.shift() : null,
        sort: (arr) => Array.isArray(arr) ? arr.sort() : arr,
        reverse: (arr) => Array.isArray(arr) ? arr.reverse() : arr,
        contains: (arr, val) => Array.isArray(arr) ? arr.includes(val) : (arr || "").toString().includes(val),

        // --- 2. PERSISTANCE (LOCALSTORAGE) ---
        save_data: (key, val) => {
            const v = typeof val === 'object' ? JSON.stringify(val) : val;
            localStorage.setItem("ts_user_" + key, v);
            return "";
        },
        load_data: (key) => {
            const v = localStorage.getItem("ts_user_" + key);
            try { return JSON.parse(v); } catch(e) { return v; }
        },
        clear_data: (key) => { localStorage.removeItem("ts_user_" + key); return ""; },

        // --- 3. INTERACTIVITÉ (UI & EVENTS) ---
        
        // Créer un Input
        input: (id, placeholder = "", val = "") => {
            return `<input type="text" id="${id}" value="${val}" placeholder="${placeholder}" 
                    style="background:#333; border:1px solid #555; color:#eee; padding:5px 10px; border-radius:4px; outline:none; width:100%;">`;
        },

        // Lire la valeur d'un Input (CRITIQUE pour l'interaction)
        dom_val: (id) => {
            const el = document.getElementById(id);
            return el ? el.value : "";
        },

        // Bouton Interactif : Exécute du code TenyScript au clic !
        // Astuce : On encode le code TenyScript dans l'attribut onclick pour le relancer via window.executerMiniLangage
        // --- AJOUT : On passe 'window.TenyGlobalRegistry' au contexte du bouton ---
        button: (label, codeToRun, styleColor = "#007acc") => {
            const cleanCode = codeToRun.replace(/\n/g, ' ');
            // Notez l'ajout de : functionRegistry:window.TenyGlobalRegistry
            const jsPayload = `(async()=>{const ctx={text:decodeURIComponent("${encodeURIComponent(cleanCode)}"),variables:{},langue:'mg',functionRegistry:window.TenyGlobalRegistry};if(window.getFandaharanaRegistry)ctx.customLib=window.getFandaharanaRegistry();await window.executerMiniLangage(ctx);})()`;
            return `<button onclick="${jsPayload.replace(/"/g, '&quot;')}" style="background:${styleColor}; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; margin:2px;">${label}</button>`;
        }





    };

    if (!context.isRecursion && text) {
        let clean = ""; let idx = 0;
        while (idx < text.length) {
            if (text.substring(idx).match(/^\$>def\s+/)) {
                let dN = idx + 5; let dP = text.indexOf("(", dN);
                if (dP > -1) {
                    let name = text.substring(dN, dP).trim(); let fP = text.indexOf(")", dP); let dB = text.indexOf("{", fP); let fB = trouverFinBloc(text, dB, "{}");
                    if (dB > -1 && fB > -1) {
                        let params = text.substring(dP + 1, fP).split(',').map(s => s.trim()).filter(s => s);
                        let body = text.substring(dB + 1, fB);
                        functionRegistry[name] = { params, body }; idx = fB + 1; continue;
                    }
                }
            }
            if (text.substring(idx).match(/^\$>def\s*=/)) {
                 let offset = text.substring(idx).indexOf('=') + 1; let dP = text.indexOf("(", idx + offset);
                 if (dP > -1) { let dB = text.indexOf("{", dP); let fB = trouverFinBloc(text, dB, "{}"); if (dB > -1 && fB > -1) { let name = text.substring(idx + text.substring(idx).indexOf('=') + 1, dP).trim(); let fP = text.indexOf(")", dP); let params = text.substring(dP + 1, fP).split(',').map(s => s.trim()).filter(s => s); let body = text.substring(dB + 1, fB); functionRegistry[name] = { params, body }; idx = fB + 1; continue; } }
            }
            clean += text[idx]; idx++;
        }
        text = clean;
    }

    async function interpreter(code, doInterpolation = true) {
        if (!code) return ""; 
        let resultat = ""; let i = 0;
        while (i < code.length) {
            if (code[i] === '/' && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; if (code[i] === '\n') i++; continue; }
            opsCounter++; if (opsCounter > MAX_OPS) return resultat + renderError(`Limite d'opérations`);
            if (performance.now() - startTime > MAX_TIME_MS) return resultat + renderError(`Temps dépassé`);

            let nextTag = code.indexOf("$>", i);
            if (nextTag === -1) { let rest = code.substring(i); if (!rest.trim().startsWith("//")) resultat += doInterpolation ? interpolate(rest) : rest; break; }

            let textBefore = code.substring(i, nextTag);
            if (textBefore.indexOf("//") === -1 && textBefore.trim() !== "") { resultat += doInterpolation ? interpolate(textBefore) : textBefore; } 
            else if (textBefore.indexOf("//") > -1) { let cleanPart = textBefore.split("//")[0]; if(cleanPart.trim() !== "") resultat += doInterpolation ? interpolate(cleanPart) : cleanPart; }
            
            i = nextTag; let handled = false;

            if (code.startsWith("$>math(", i)) {
                let finMath = trouverFinBloc(code, i + 6, "()");
                if (finMath > -1) {
                    let content = code.substring(i + 7, finMath);
                    let resolvedContent = await interpreter(content);
                    resultat += evalMath(resolvedContent);
                    i = finMath + 1; handled = true; continue;
                }
            }

            if (code.substring(i).match(/^\$>var\s+/)) {
                let finInstruction = i + 4; let pLevel = 0; let foundEqual = false;
                while (finInstruction < code.length) {
                    let c = code[finInstruction]; if (c === '=' && pLevel === 0) foundEqual = true; if (c === '(') pLevel++; else if (c === ')') pLevel--; if (c === '\n' && pLevel <= 0 && foundEqual) break; finInstruction++;
                }
                let ligne = code.substring(i, finInstruction);
                let match = ligne.match(/\$>var\s*=?\s*(\w+)\s*=\s*([\s\S]*)/);
                if (match) {
                    let name = match[1].trim(); let rawVal = match[2].trim();
                    if (rawVal.includes('$>') || /[+\-*/]/.test(rawVal)) {
                         if (rawVal.startsWith("$>")) {
                             let tempCtx = { text: rawVal, variables: globalVars, localScope: localVars, langue, functionRegistry, isRecursion: true, mathCache };
                             await executerMiniLangage(tempCtx);
                             let res = tempCtx.text.trim();
                             if (!isNaN(res) && res !== "") res = Number(res); else try { res = JSON.parse(res); } catch {}
                             setVar(name, res);
                         } else { setVar(name, evalMath(interpolate(rawVal))); }
                    } else { setVar(name, evalSimple(interpolate(rawVal))); }
                }
                i = finInstruction + 1; handled = true; continue;
            }

            let matchAuto = code.substring(i).match(/^\$>(\w+)/);
            if (!handled && matchAuto) {
                let funcName = matchAuto[1];
                if (!['var', 'if', 'else', 'for', 'repeat', 'def', 'comment', 'set', 'call', 'import', 'export', 'math', 'br', 'while', 'css', 'js'].includes(funcName)) {
                    let nextIdx = i + matchAuto[0].length; let hasParens = (code[nextIdx] === '('); let args = []; let newIndex = i; let executed = false; let output = undefined;
                    if (hasParens) {
                        let finArgs = trouverFinBloc(code, nextIdx, "()");
                        if (finArgs > -1) {
                            let content = code.substring(nextIdx + 1, finArgs);
                            let resolvedArgsString = await interpreter(content, false);
                            args = parseArguments(resolvedArgsString) || [];
                            newIndex = finArgs + 1;
                        }
                    } else { newIndex = nextIdx; }

                    // 1. Fonction interne PRINT
                    if (funcName === 'print') {
                        let msg = args.length > 0 ? args[0] : ""; 
                        let color = args.length > 1 ? args[1] : "inherit";
                        if (typeof msg === 'object') msg = JSON.stringify(msg);
                        // Affichage
                        if (typeof msg === 'string' && msg.trim().startsWith('<')) { resultat += msg; } 
                        else { resultat += `<div style="color:${color}; font-weight:bold; margin-bottom:2px;">${msg !== undefined ? msg : ''}</div>`; }
                        executed = true;
                    } 
                    // 2. Fonctions Standard (stdLib)
                    else if (stdLib.hasOwnProperty(funcName)) {
                        try { output = await stdLib[funcName](...args); executed = true; } catch (e) { }
                    } 
                    // 3. --- AJOUT CRITIQUE : Fonctions Personnalisées (Vos APIs) ---
                    else if (context.customLib && context.customLib[funcName]) {
                        try { 
                            // On appelle votre vraie fonction (meteo, perikopa...)
                            output = await context.customLib[funcName](...args); 
                            executed = true; 
                        } catch (e) { 
                            console.error("Erreur API " + funcName, e);
                            output = `<span style="color:red">[Erreur API: ${funcName}]</span>`;
                        }
                    }

                    else if (functionRegistry[funcName]) {
                        const funcDef = functionRegistry[funcName]; let newScope = {};
                        if (funcDef.params) funcDef.params.forEach((pName, idx) => { newScope[pName] = args[idx] !== undefined ? args[idx] : ""; });
                        let subCtx = { text: funcDef.body, variables: globalVars, localScope: newScope, langue, functionRegistry, isRecursion: true, mathCache };
                        await executerMiniLangage(subCtx); resultat += subCtx.text; executed = true;
                    }
                    if (executed) {
                        if (output !== undefined) { if (typeof output === 'object') resultat += JSON.stringify(output); else resultat += output; }
                        i = newIndex; if (code[i] === '\n') i++; handled = true; continue;
                    }
                }
            }

            if (code.startsWith("$>if", i)) {
                let dC = code.indexOf("(", i); let fC = trouverFinBloc(code, dC, "()");
                if (dC > -1 && fC > -1) {
                    let dB = code.indexOf("{", fC); let fB = trouverFinBloc(code, dB, "{}");
                    if (dB > -1 && fB > -1) {
                        let cond = interpolate(code.substring(dC + 1, fC)); let nI = fB + 1; let reste = code.substring(nI); let bV = code.substring(dB + 1, fB); let bF = "";
                        const matchElse = reste.match(/^(\s*(\/\/.*)*\s*)\$>else\s*\{/);
                        if (matchElse) {
                            let startElse = nI + reste.indexOf("$>else"); let dE = code.indexOf("{", startElse); let fE = trouverFinBloc(code, dE, "{}");
                            if (fE > -1) { bF = code.substring(dE + 1, fE); nI = fE + 1; }
                        }
                        if (evalMath(cond)) resultat += await interpreter(bV); else if (bF !== "") resultat += await interpreter(bF);
                        i = nI; if(code[i] === '\n') i++; handled = true; continue;
                    }
                }
            }

            let matchLoop = code.substring(i).match(/^\$>(repeat|for)\((.*?)\)\s*\{/);
            if (matchLoop) {
                let type = matchLoop[1]; let param = matchLoop[2]; let dB = i + matchLoop[0].indexOf('{'); let fB = trouverFinBloc(code, dB, "{}");
                if (fB > -1) {
                    let tpl = code.substring(dB + 1, fB); let loopOut = "";
                    if (type === "repeat") {
                        let c = parseInt(evalSimple(param)) || 0; if (c > MAX_LOOP_ITER) c = MAX_LOOP_ITER;
                        for (let n = 1; n <= c; n++) {
                            let subScope = Object.create(localVars || globalVars); subScope.index = n;
                            let subCtx = { text: tpl.replace(/\$index/g, n), variables: globalVars, localScope: subScope, langue, functionRegistry, isRecursion: true, mathCache };
                            await executerMiniLangage(subCtx); loopOut += subCtx.text;
                        }
                    } else if (type === "for") {
                        let p = param.split(','); let vN = p[0].trim(); let sN = p[1] ? p[1].trim() : "";
                        let rawData = sN.startsWith('$') ? getVar(sN.replace(/^\$+/, '')) : evalSimple(sN);
                        let items = Array.isArray(rawData) ? rawData : [];
                        for (let iValue of items) {
                            let subScope = Object.create(localVars || globalVars); subScope[vN] = iValue;
                            let subCtx = { text: tpl, variables: globalVars, localScope: subScope, langue, functionRegistry, isRecursion: true, mathCache };
                            await executerMiniLangage(subCtx); loopOut += subCtx.text;
                        }
                    }
                    if (loopOut.trim() !== "") resultat += loopOut; i = fB + 1; if(code[i] === '\n') i++; handled = true; continue;
                }
            }
            
            let matchWhile = code.substring(i).match(/^\$>while\s*\((.*?)\)\s*\{/);
            if (matchWhile) {
                let condRaw = matchWhile[1]; let dB = i + matchWhile[0].indexOf('{'); let fB = trouverFinBloc(code, dB, "{}");
                if (fB > -1) {
                    let tpl = code.substring(dB + 1, fB); let loopOut = ""; let it = 0;
                    while (it < MAX_LOOP_ITER) {
                         if(!evalMath(interpolate(condRaw))) break;
                         let subScope = Object.create(localVars || globalVars);
                         let subCtx = { text: tpl, variables: globalVars, localScope: subScope, langue, functionRegistry, isRecursion: true, mathCache };
                         await executerMiniLangage(subCtx); loopOut += subCtx.text; it++;
                    }
                    resultat += loopOut; i = fB + 1; if(code[i] === '\n') i++; handled = true; continue;
                }
            }

            if (!handled) { if (code.startsWith("$>", i)) { while (i < code.length && code[i] !== '\n') i++; } else { resultat += code[i]; i++; } }
        }
        return resultat;
    }

    let final = await interpreter(text);
    if (!context.isRecursion) { if (debug) trace('INFO', '--- Fin du rendu ---'); context.text = final.replace(/(<br\s*\/?>){2,}/gi, '<br>'); } else { context.text = final; }
}

const TSStorage = {
    dbName: "TenyScriptDB", storeName: "modules", db: null, memoryCache: {},
    async init() { if (this.db) return this.db; return new Promise((resolve, reject) => { const request = indexedDB.open(this.dbName, 1); request.onupgradeneeded = (e) => { const db = e.target.result; if (!db.objectStoreNames.contains(this.storeName)) { db.createObjectStore(this.storeName); } }; request.onsuccess = (e) => { this.db = e.target.result; resolve(this.db); }; request.onerror = (e) => reject("IndexedDB Error"); }); },
    async compress(str) { const stream = new Blob([str]).stream().pipeThrough(new CompressionStream("deflate")); return await new Response(stream).blob(); },
    async decompress(blob) { const stream = blob.stream().pipeThrough(new DecompressionStream("deflate")); return await new Response(stream).text(); },
    async exportModule(key, code) { this.memoryCache[key] = code; try { const db = await this.init(); const compressed = await this.compress(code); return new Promise((resolve, reject) => { const tx = db.transaction(this.storeName, "readwrite"); const store = tx.objectStore(this.storeName); store.put(compressed, key); tx.oncomplete = () => resolve(true); tx.onerror = (e) => reject(e); }); } catch (e) { return false; } },
    async importModule(key) { if (!key) return null; if (this.memoryCache.hasOwnProperty(key)) return this.memoryCache[key]; try { const db = await this.init(); return new Promise((resolve) => { const tx = db.transaction(this.storeName, "readonly"); const store = tx.objectStore(this.storeName); const req = store.get(key); req.onsuccess = async () => { if (req.result) { const code = await this.decompress(req.result); this.memoryCache[key] = code; resolve(code); } else { resolve(null); } }; req.onerror = () => resolve(null); }); } catch (e) { return null; } },
    async listModules() { const db = await this.init(); return new Promise((resolve) => { const tx = db.transaction(this.storeName, "readonly"); const store = tx.objectStore(this.storeName); const req = store.getAllKeys(); req.onsuccess = () => resolve(req.result); }); },
    async deleteModule(key) { if (this.memoryCache[key]) delete this.memoryCache[key]; const db = await this.init(); return new Promise((resolve) => { const tx = db.transaction(this.storeName, "readwrite"); const store = tx.objectStore(this.storeName); store.delete(key); tx.oncomplete = () => resolve(true); }); },
    async clearAll() { this.memoryCache = {}; const db = await this.init(); return new Promise((resolve) => { const tx = db.transaction(this.storeName, "readwrite"); const store = tx.objectStore(this.storeName); store.clear(); tx.oncomplete = () => resolve(true); }); }
};

window.executerMiniLangage = executerMiniLangage;
