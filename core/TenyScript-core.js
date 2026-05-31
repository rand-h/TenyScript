// =========================================================
// 🚀 AUTO-LOADER DES DÉPENDANCES DU CORE (Zero-Config)
// =========================================================
(function() {
    const scriptActuel = document.currentScript;
    let dossierBase = "/";
    if (scriptActuel && scriptActuel.src) dossierBase = scriptActuel.src.substring(0, scriptActuel.src.lastIndexOf('/') + 1);

    const dependances = ["TenyScript-style.js", "TenyScript-console.js"];
    dependances.forEach(fichier => {
        const urlComplete = dossierBase + fichier;
        if (!document.querySelector(`script[src="${urlComplete}"]`)) {
            const script = document.createElement('script');
            script.src = urlComplete; script.async = false; 
            document.head.appendChild(script);
            console.log(`📦 Dépendance Core chargée : ${fichier}`);
        }
    });
})();

(function() {
    window.TenyModules = {};
    window.ts_define = (nomModule, codeTeny) => { window.TenyModules[nomModule] = codeTeny; };
    window.$ = function(funcName) { return window.TenyGlobalRegistry[funcName]; };

    window.TenyChartSystem = {
        instances: {}, // Sauvegarde des graphiques pour les mettre à jour
        loadAndDraw: function(id, labels, data, title) {
            const ctx = document.getElementById(id); if (!ctx) return; 
            if (typeof Chart === 'undefined') {
                if (!window.chartLoading) {
                    window.chartLoading = true; const script = document.createElement('script');
                    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
                    script.onload = () => { window.chartLoading = false; }; document.head.appendChild(script);
                }
                setTimeout(() => this.loadAndDraw(id, labels, data, title), 100); return;
            }
            if (window.chartLoading) { setTimeout(() => this.loadAndDraw(id, labels, data, title), 100); return; }
            
            // ✨ MAGIE : On détruit l'ancien graphique s'il existe pour une mise à jour fluide !
            if(this.instances[id]) { this.instances[id].destroy(); }
            
            this.instances[id] = new Chart(ctx.getContext('2d'), { 
                type: 'line', 
                data: { labels: labels, datasets: [{ label: title, data: data, borderColor: '#00e676', backgroundColor: 'rgba(0, 230, 118, 0.1)', borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#000', pointBorderColor: '#00e676' }] }, 
                options: { responsive: true, maintainAspectRatio: false, animation: { duration: 300 } } // Animation fluide !
            });
        }
    };

    function nettoyerCommentaires(code) {
        if (!code) return "";
        let result = ""; let inString = false; let quoteChar = null;
        for (let i = 0; i < code.length; i++) {
            let c = code[i];
            if (!inString && (c === '"' || c === "'" || c === '`')) { inString = true; quoteChar = c; result += c; continue; }
            if (inString && c === quoteChar && code[i - 1] !== '\\') { inString = false; quoteChar = null; result += c; continue; }
            if (!inString && c === '/' && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; result += '\n'; continue; }
            result += c;
        }
        return result;
    }

    function processAttr(attrString) {
        let raw = attrString.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        return raw.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function trouverFinBloc(str, debut, type = '{}', ignoreStrings = false) {
        if (!str) return -1; let niveau = 0; const ouvrant = type[0]; const fermant = type[1];
        let inString = false; let quoteChar = null;
        for (let i = debut; i < str.length; i++) {
            let c = str[i];
            if (c === '\n' && quoteChar !== '`') { inString = false; quoteChar = null; }
            if (!ignoreStrings) {
                if (!inString && (c === '"' || c === "'" || c === '`')) { inString = true; quoteChar = c; continue; }
                if (inString && c === quoteChar && str[i - 1] !== '\\') { inString = false; quoteChar = null; continue; }
            }
            if (!inString) {
                if (c === ouvrant) niveau++;
                else if (c === fermant) { niveau--; if (niveau === 0) return i; }
            }
        }
        return -1;
    }

    function processTenyTags(text) {
        if (!text) return ""; let result = ""; let i = 0; let safety = 0;
        const reserved = ['if', 'else', 'for', 'repeat', 'while', 'def', 'class', 'method', 'new', 'var', 'math', 'js_script', 'js_module', 'css_style', 'call', 'set', 'import', 'export', 'log', 'return'];
        const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link'];

        while (i < text.length && safety < 50000) {
            safety++; let start = text.indexOf("$>", i);
            if (start === -1) { result += text.substring(i); break; }
            result += text.substring(i, start); i = start;

            let match = text.substring(i).match(/^\$>([a-zA-Z0-9_-]+)\s*\(/);
            if (!match || reserved.includes(match[1])) { result += "$>"; i += 2; continue; }

            let tagName = match[1]; let afterParen = i + match[0].length; let current = afterParen;
            while (current < text.length && /\s/.test(text[current])) current++;

            let attrs = ""; let contentStart = -1; let firstChar = text[current];

            if (firstChar === '"' || firstChar === "'" || firstChar === '`') {
                let quote = firstChar; current++; let attrStart = current;
                while (current < text.length) { if (text[current] === quote && text[current-1] !== '\\') break; current++; }
                attrs = text.substring(attrStart, current); current++; 
                attrs = attrs.replace(/\$>([a-zA-Z0-9_-]+)\s*\(/g, 'window.TenyGlobalRegistry.$1(');
                attrs = attrs.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\`/g, "`");
                while (current < text.length && /\s/.test(text[current])) current++;
                if (text[current] === ',') current++; 
            }

            while (current < text.length && /\s/.test(text[current])) current++;
            
            if (text[current] === ')' && selfClosingTags.includes(tagName.toLowerCase())) {
                result += `<${tagName} ${attrs}>`; i = current + 1; continue;
            }

            if (text[current] === '{') contentStart = current;

            if (contentStart > -1) {
                let contentEnd = trouverFinBloc(text, contentStart, "{}", true);
                if (contentEnd > -1) {
                    let rawContent = text.substring(contentStart + 1, contentEnd);
                    let endParen = text.indexOf(")", contentEnd);
                    if (endParen > -1) {
                        let cleanContent = processTenyTags(rawContent);
                        if (selfClosingTags.includes(tagName.toLowerCase())) { result += `<${tagName} ${attrs}>`; } 
                        else { result += `<${tagName} ${attrs}>${cleanContent}</${tagName}>`; }
                        i = endParen + 1; continue;
                    }
                }
            }
            result += "$>"; i += 2;
        }
        return result;
    }

    async function executerMiniLangage(context, debugOverride = false) {
        if (typeof injecterStylesTenyScript == "function") { injecterStylesTenyScript(); };
        if (!context.isRecursion && context.text) window.TenyLastSource = context.text;

        const debug = (localStorage.getItem('debug_TS') === 'true') || debugOverride;
        let logger = null;
        if (debug && !context.isRecursion) { logger = injectDebugConsole(); logger('INFO', '--- EXÉCUTION (TenyScript Turbo Engine) ---'); } 
        else if (context.debugLogger) { logger = context.debugLogger; }
        
        const trace = (type, msg, line = null) => { if (logger) logger(type, msg, line); };
        context.debugLogger = logger;

        window.TenyConsole = (msg) => { if (logger) trace('VAR', msg, "?"); else console.log(msg); };

        const startTime = performance.now();
        let rawText = context.text || "";
        rawText = rawText.replace(/\/\*[\s\S]*?\*\//g, '');
        rawText = rawText.replace(/([^:]|^)\/\/.*$/gm, '$1');
        let text = processTenyTags(rawText); 

        const langue = context.langue || 'fr';

        if (!window.TenyGlobalRegistry) window.TenyGlobalRegistry = {};
        const functionRegistry = context.functionRegistry || window.TenyGlobalRegistry;
        if (!context.isRecursion) window.TenyGlobalRegistry = functionRegistry;

        if (!window.TenyGlobalVars) window.TenyGlobalVars = {};
        const globalVars = context.variables || window.TenyGlobalVars;
        if (!context.isRecursion) window.TenyGlobalVars = globalVars;
        
        const localVars = context.localScope || (context.isRecursion ? Object.create(globalVars) : null);
        const mathCache = context.mathCache || new Map();
        context.mathCache = mathCache;

        // 🔥 MOTEUR DÉBRIDÉ POUR CALCULS INTENSIFS
        let opsCounter = 0; const MAX_OPS = 5000000; const MAX_TIME_MS = 30000; const MAX_RECURSION_DEPTH = 20; const MAX_LOOP_ITER = 5000;

        context.recursionDepth = context.recursionDepth || 0;
        if (context.isRecursion) context.recursionDepth++;
        if (context.recursionDepth > MAX_RECURSION_DEPTH) { trace('ERROR', "<b>Stack Overflow</b>", "?"); return; }

        const getLineNumber = (index) => { if (index < 0 || !text) return 1; return text.substring(0, index).split('\n').length; };
        const getLineContext = (index) => {
            if (index < 0 || !text) return "";
            const lines = text.split('\n'); const lineNum = text.substring(0, index).split('\n').length - 1;
            return lines[lineNum] ? lines[lineNum].trim().substring(0, 50) + "..." : "";
        };

        const renderError = (msg, index = -1, suggestion = "") => {
            const line = index > -1 ? getLineNumber(index) : "?";
            const codeSnippet = index > -1 ? getLineContext(index) : "";
            let consoleMsg = `<b>Erreur TenyScript [Ligne ${line}]</b><br>${msg}`;
            if (codeSnippet) consoleMsg += `<br><span style="color:#ce9178; background:#222; padding:2px 4px; border-radius:3px; font-family:monospace; display:inline-block; margin-top:4px;">L ${line} | ${codeSnippet}</span>`;
            if (suggestion) consoleMsg += `<br><span style="color:#4ec9b0; margin-top:4px; display:inline-block;">💡 Suggestion : ${suggestion}</span>`;
            trace('ERROR', consoleMsg, line);
            return `<div class='f-ide-error' style='color:#ff4444; border:1px solid #ff4444; padding:8px; margin:5px; background:rgba(255,0,0,0.1); border-radius:5px;'>🚫 Erreur [Ligne ${line}] : ${msg}</div>`;
        };

        const getVar = (name) => {
            if (name.includes('.')) {
                let parts = name.split('.'); let obj = getVar(parts[0]);
                for(let i=1; i<parts.length; i++) { if(obj !== undefined && obj !== null) obj = obj[parts[i]]; else return undefined; }
                return obj;
            }
            if (localVars && name in localVars) return localVars[name];
            if (globalVars && name in globalVars) return globalVars[name];
            return undefined;
        };
        
        const setVar = (name, val) => {
            if (name.includes('.')) {
                let parts = name.split('.'); let prop = parts.pop(); let obj = getVar(parts.join('.'));
                if (obj !== undefined && obj !== null) { obj[prop] = val; return; }
            }
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

        const resolveTemplates = async (str) => {
            if (!str || typeof str !== 'string') return str || "";
            if (!str.includes('${')) return str;
            let parts = []; let curr = 0; let safety = 0;
            while (curr < str.length && safety < 1000) {
                safety++; let start = str.indexOf('${', curr);
                if (start === -1) { parts.push(str.substring(curr)); break; }
                parts.push(str.substring(curr, start));
                let end = trouverFinBloc(str, start + 1, '{}', false);
                if (end !== -1) {
                    let innerCode = str.substring(start + 2, end);
                    let subCtx = { text: innerCode, variables: globalVars, localScope: localVars, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger };
                    await executerMiniLangage(subCtx); parts.push(subCtx.text); curr = end + 1;
                } else { parts.push('${'); curr = start + 2; }
            }
            return parts.join('');
        };

        const interpolate = async (str) => {
            str = await resolveTemplates(str);
            if (str.includes('$')) {
                str = str.replace(/\$([a-zA-Z0-9_.]+)/g, (match, varName) => {
                    const val = getVar(varName);
                    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
                    return val !== undefined ? val : match;
                });
            }
            return str;
        };

        const evalSimple = async (expr) => {
            if (expr === undefined || expr === null) return ""; 
            if (typeof expr === 'object') return expr;
            if (typeof expr === 'boolean' || typeof expr === 'number') return expr;
            
            expr = expr.toString().trim();
            if (expr === "") return "";
            
            if (expr === 'true') return true;
            if (expr === 'false') return false;
            if (expr === 'null') return null;
            
            if (/^\$[a-zA-Z0-9_.]+$/.test(expr)) { const val = getVar(expr.substring(1)); return val !== undefined ? val : expr; }
            if (!isNaN(expr)) return Number(expr);
            if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('`') && expr.endsWith('`'))) { return await interpolate(expr.slice(1, -1)); }
            if ((expr.startsWith('[') && expr.endsWith(']')) || (expr.startsWith('{') && expr.endsWith('}'))) { try { return JSON.parse(expr); } catch (e) { } }
            return await interpolate(expr);
        };

        const evalMath = async (expr, originIndex = -1) => {
            if (!expr) return 0; if (mathCache.has(expr)) return mathCache.get(expr);
            let resolvedExpr = await resolveTemplates(expr.toString());
            let clean = resolvedExpr.trim().replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\r?\n|\r/g, ' '); 
            
            let readyToEval = clean.replace(/\$([a-zA-Z0-9_.]+)/g, (m, v) => {
                const val = getVar(v);
                if (val === undefined) return 0; 
                if (typeof val === 'number' || typeof val === 'boolean') return val;
                if (typeof val === 'string') return '"' + val.replace(/"/g, '\\"') + '"';
                if (typeof val === 'object') return JSON.stringify(val); return val;
            });
            
            readyToEval = readyToEval.replace(/\band\b/gi, '&&').replace(/\bor\b/gi, '||').replace(/\bnot\b/gi, '!');
            readyToEval = readyToEval.replace(/\b(PI|SQRT|POW|SIN|COS|TAN|FLOOR|CEIL|ROUND|ABS|RANDOM|SIGN)\b/gi, (m) => {
                const upper = m.toUpperCase();
                if (upper === 'PI') return 'Math.PI'; if (upper === 'E') return 'Math.E'; return 'Math.' + upper.toLowerCase(); 
            });
            readyToEval = readyToEval.replace(/Math\.random\s*\(\s*([^,)]+)\s*,\s*([^,)]+)\s*\)/gi, (m, min, max) => `(Math.floor(Math.random() * ((${max}) - (${min}) + 1)) + (${min}))`);
            
            try { const res = new Function(`return (${readyToEval})`)(); return res; } 
            catch (e) { renderError(`Opération impossible : ${e.message}`, originIndex, "Vérifiez vos variables et parenthèses dans $>math."); return resolvedExpr; }
        };

        async function parseArguments(content) {
            if (!content) return []; 
            if (!/['"`()[\]{}+*/-]/.test(content)) {
                let parts = content.split(','); let res = [];
                for (let p of parts) res.push(await evalSimple(p.trim()));
                return res;
            }
            
            let args = []; let cur = ""; let inQ = false; let quoteChar = null; let pLevel = 0; let bLevel = 0; let cLevel = 0;
            for (let i = 0; i < content.length; i++) {
                let c = content[i];
                if ((c === '"' || c === "'" || c === '`') && !inQ) { inQ = true; quoteChar = c; }
                else if (c === quoteChar && inQ && content[i-1] !== '\\') { inQ = false; quoteChar = null; }
                if (!inQ) {
                    if (c === '(') pLevel++; else if (c === ')') pLevel--;
                    if (c === '[') bLevel++; else if (c === ']') bLevel--;
                    if (c === '{') cLevel++; else if (c === '}') cLevel--;
                }
                if (c === ',' && !inQ && pLevel === 0 && bLevel === 0 && cLevel === 0) { args.push(cur.trim()); cur = ""; } else { cur += c; }
            }
            if (cur.trim()) args.push(cur.trim());
            
            let finalArgs = [];
            for (let a of args) {
                let t = a.trim();
                if (t.startsWith('<')) finalArgs.push(await evalSimple(a));
                else if (/[+\-*/]/.test(t) && !t.startsWith('"') && !t.startsWith("'") && !t.startsWith('`')) {
                    let res = await evalMath(t); 
                    if (res !== undefined && typeof res === 'number' && !isNaN(res)) finalArgs.push(res);
                    else finalArgs.push(await evalSimple(a));
                }
                else finalArgs.push(await evalSimple(a));
            }
            return finalArgs;
        }

        const stdLib = {
            date: () => new Date().toLocaleDateString(), upper: (str) => str?.toString().toUpperCase() || "", lower: (str) => str?.toString().toLowerCase() || "",
            len: (arg) => { if (Array.isArray(arg)) return arg.length; if (typeof arg === 'object' && arg !== null) return Object.keys(arg).length; return arg ? arg.toString().length : 0; },
            random: (min, max) => Math.floor(Math.random() * (Number(max) - Number(min) + 1)) + Number(min), wait: async (ms) => new Promise(r => setTimeout(r, Number(ms))),
            json_stringify: (obj) => JSON.stringify(obj, null, 2), json_parse: (str) => { try { return JSON.parse(str); } catch (e) { return {}; } },
            get: (obj, path) => {
                if (typeof obj === 'string') try { obj = JSON.parse(obj); } catch (e) { }
                if (!obj) return undefined; const keys = path.toString().split('.'); let current = obj;
                for (let k of keys) { if (current === undefined || current === null) return undefined; current = current[k]; } return current;
            },
            sanitize: (str) => { if (typeof str !== 'string') return str; return str.replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[m])); },
            set: (obj, path, val) => {
                let isStr = typeof obj === 'string'; if (isStr) try { obj = JSON.parse(obj); } catch (e) { }
                if (typeof obj !== 'object' || obj === null) return obj; const keys = path.toString().split('.'); const lastKey = keys.pop(); let current = obj;
                for (let k of keys) { if (!current[k]) current[k] = {}; current = current[k]; } current[lastKey] = val; return obj;
            },
            push: (container, arg1) => { if (Array.isArray(container)) { container.push(arg1); } return ""; },
            dom_style: (sel, prop, val) => { const el = document.querySelector(sel); if(el) el.style[prop] = val; return ""; },
            dom_update: (sel, html) => { const el = document.querySelector(sel); if(el) { el.innerHTML = html; } return ""; },
            dom_get_elements: (sel) => Array.from(document.querySelectorAll(sel)),
            dom_get_attr: (el, attr) => el ? el.getAttribute(attr) : null,
            dom_replace_text: (search, replace) => {
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false); let node;
                while(node = walker.nextNode()) { if (node.nodeValue.includes(search)) node.nodeValue = node.nodeValue.replace(new RegExp(search, 'g'), replace); } return "";
            },
            http_get: async (url) => { try { const r = await fetch(url); return await r.json(); } catch(e) { return {error:true, msg:e.message}; } },
            http_post: async (url, data) => { try { const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); return await r.json(); } catch(e) { return {error:true, msg:e.message}; } },
            chart_line: (id, labels, data, title = "Graphique") => {
                if (!data) return ""; 
                const lArr = Array.isArray(labels) ? labels : labels.toString().split(','); const dArr = Array.isArray(data) ? data : data.toString().split(',').map(Number);
                const lSafe = JSON.stringify(lArr).replace(/"/g, "&quot;"); const dSafe = JSON.stringify(dArr).replace(/"/g, "&quot;");
                const tSafe = title.toString().replace(/'/g, "\\'"); 
                return `<div style="background:#111; padding:10px; border-radius:8px; border:1px solid #333; margin:10px 0;"><div style="height:250px; position:relative;"><canvas id="${id}"></canvas><img src="x" style="display:none;" onerror="window.TenyChartSystem.loadAndDraw('${id}', ${lSafe}, ${dSafe}, '${tSafe}')"></div></div>`;
            },
            chart_update: (id, labels, data, title = "Graphique") => {
                const lArr = Array.isArray(labels) ? labels : labels.toString().split(','); 
                const dArr = Array.isArray(data) ? data : data.toString().split(',').map(Number);
                window.TenyChartSystem.loadAndDraw(id, lArr, dArr, title);
                return ""; // Ne renvoie pas de HTML, met juste à jour
            },
            reload: () => { location.reload(); return ""; },
            list_modules: async () => { try { const m = await TSStorage.listModules(); if(!m || m.length === 0) return "Aucun module."; return `<div class='f-ide-system-msg'>📦 <b>Modules:</b><br>${m.filter(x=>x!=='ide_session_state').map(x=>`• ${x}`).join('<br>')}</div>`; } catch(e) { return "Erreur module list"; } },
            import: async (fileName) => {
                const baseName = fileName.replace(/\.(teny|js)$/, "");
                const runInternal = async (source, origine) => {
                    if (!source) return ""; const tempCtx = { text: source, variables: globalVars, functionRegistry, customLib: context.customLib, isRecursion: false, mathCache, debugLogger: logger };
                    await executerMiniLangage(tempCtx); return `<div style="color:#888; font-size:0.8em; margin-top:5px;">[Import] Chargé depuis : ${origine}</div>` + tempCtx.text;
                };
                if (window.TenyModules && window.TenyModules[baseName]) return await runInternal(window.TenyModules[baseName], "Mémoire");
                try { let codeDB = await TSStorage.importModule(baseName + ".teny"); if (!codeDB) codeDB = await TSStorage.importModule(baseName); if (codeDB) return await runInternal(codeDB, "BDD"); } catch (e) { }
                try { const rTeny = await fetch(baseName + ".teny"); if (rTeny.ok) return await runInternal(await rTeny.text(), "Serveur"); } catch(e) {}
                return `<div class="f-ide-error">🚫 Import impossible : '${baseName}' introuvable.</div>`;
            },
            css_url: (url) => { if(!url) return ""; const l = document.createElement("link"); l.rel="stylesheet"; l.href=url; document.head.appendChild(l); return ""; },
            js_url: async (url) => { if(!url) return ""; return new Promise(r => { const s = document.createElement("script"); s.src=url; s.onload=r; document.head.appendChild(s); }); },
            split: (str, sep) => (str || "").toString().split(sep || " "), join: (arr, sep) => Array.isArray(arr) ? arr.join(sep || "") : arr, replace: (str, search, repl) => (str || "").toString().replace(new RegExp(search, 'g'), repl), trim: (str) => (str || "").toString().trim(),
            pop: (arr) => Array.isArray(arr) ? arr.pop() : null, shift: (arr) => Array.isArray(arr) ? arr.shift() : null, sort: (arr) => Array.isArray(arr) ? arr.sort() : arr, reverse: (arr) => Array.isArray(arr) ? arr.reverse() : arr, contains: (arr, val) => Array.isArray(arr) ? arr.includes(val) : (arr || "").toString().includes(val),
            save_data: (key, val) => { const v = typeof val === 'object' ? JSON.stringify(val) : val; localStorage.setItem("ts_user_" + key, v); return ""; }, load_data: (key) => { const v = localStorage.getItem("ts_user_" + key); try { return JSON.parse(v); } catch(e) { return v; } }, clear_data: (key) => { localStorage.removeItem("ts_user_" + key); return ""; },
            input: (id, placeholder = "", val = "") => `<input type="text" id="${id}" value="${val}" placeholder="${placeholder}" style="background:#333; border:1px solid #555; color:#eee; padding:5px 10px; border-radius:4px; outline:none; width:100%;">`,
            dom_val: (id) => { const el = document.getElementById(id.replace('#', '')); return el ? el.value : ""; },
            dom_set_val: (id, val) => { const el = document.getElementById(id.replace('#', '')); if (el) el.value = val !== undefined ? val : ""; return ""; }
        };

        if (!context.isRecursion && text) {
            let clean = ""; let idx = 0;
            while (idx < text.length) {
                
                if (text.substring(idx).match(/^\$>class\s+/)) {
                    let dN = idx + 7; let dP = text.indexOf("(", dN);
                    if (dP > -1) {
                        let name = text.substring(dN, dP).trim(); let fP = text.indexOf(")", dP); let dB = text.indexOf("{", fP); let fB = trouverFinBloc(text, dB, "{}");
                        if (dB > -1 && fB > -1) { 
                            let rawParams = text.substring(dP + 1, fP).split(',').map(s => s.trim()).filter(s => s); 
                            let parsedParams = rawParams.map(p => {
                                let parts = p.split('='); let key = parts[0].trim(); let val = parts.slice(1).join('=').trim();
                                if (val) val = val.replace(/^['"`]|['"`]$/g, ''); 
                                return { name: key, def: val || null };
                            });
                            let body = text.substring(dB + 1, fB); 
                            if (!window.TenyGlobalClasses) window.TenyGlobalClasses = {};
                            window.TenyGlobalClasses[name] = { parsedParams, body };
                            idx = fB + 1; continue; 
                        }
                    }
                }

                if (text.substring(idx).match(/^\$>def\s+/)) {
                    let dN = idx + 5; let dP = text.indexOf("(", dN);
                    if (dP > -1) {
                        let name = text.substring(dN, dP).trim(); let fP = text.indexOf(")", dP); let dB = text.indexOf("{", fP); let fB = trouverFinBloc(text, dB, "{}");
                        if (dB > -1 && fB > -1) { 
                            let rawParams = text.substring(dP + 1, fP).split(',').map(s => s.trim()).filter(s => s); 
                            let parsedParams = rawParams.map(p => {
                                let parts = p.split('='); let key = parts[0].trim(); let val = parts.slice(1).join('=').trim();
                                if (val) val = val.replace(/^['"`]|['"`]$/g, ''); 
                                return { name: key, def: val || null };
                            });

                            let body = text.substring(dB + 1, fB); 
                            
                            const bridgeFunc = async function(...args) {
                                let newScope = {}; const currentDef = functionRegistry[name];
                                if (currentDef && currentDef.parsedParams) {
                                    currentDef.parsedParams.forEach((p, i) => {
                                        let value = args[i]; if (value === undefined || value === "") value = (p.def !== null) ? p.def : "";
                                        newScope[p.name] = value;
                                    });
                                }
                                let subCtx = { text: body, variables: window.TenyGlobalVars, localScope: newScope, langue: context.langue || 'fr', functionRegistry: window.TenyGlobalRegistry, customLib: context.customLib, isRecursion: true, mathCache: context.mathCache || new Map(), debugLogger: context.debugLogger };
                                await window.executerMiniLangage(subCtx); 
                                
                                // --- GESTION DU RETURN POUR LES $>def ---
                                if (subCtx.returnValue !== undefined) return subCtx.returnValue;
                                return subCtx.text;
                            };
                            
                            bridgeFunc.parsedParams = parsedParams; bridgeFunc.params = parsedParams.map(p => p.name); bridgeFunc.body = body;
                            functionRegistry[name] = bridgeFunc; window[name] = bridgeFunc;
                            if (!window.TenyGlobalRegistry) window.TenyGlobalRegistry = {};
                            window.TenyGlobalRegistry[name] = bridgeFunc;

                            idx = fB + 1; continue; 
                        }
                    }
                }
                clean += text[idx]; idx++;
            }
            text = clean;
        }

        async function interpreter(code, doInterpolation = true) {
            if (!code) return ""; 
            let resultat = ""; let i = 0;
            while (i < code.length) {
                opsCounter++; if (opsCounter > MAX_OPS) return resultat + renderError(`Limite d'opérations atteinte`, i, "Vérifiez vos boucles infinies.");
                if (performance.now() - startTime > MAX_TIME_MS) return resultat + renderError(`Temps d'exécution dépassé`, i);

                let nextTag = -1; let inString = false; let strChar = null;
                for (let k = i; k < code.length; k++) {
                    if (code[k] === '\n' && strChar !== '`') { inString = false; strChar = null; }
                    if (!inString && code[k] === '/' && code[k+1] === '/') { while (k < code.length && code[k] !== '\n') k++; continue; }
                    if ((code[k] === '"' || code[k] === "'" || code[k] === '`') && (k === 0 || code[k-1] !== '\\')) {
                        if (!inString) { inString = true; strChar = code[k]; } else if (strChar === code[k]) { inString = false; strChar = null; }
                    }
                    if (!inString && code.startsWith("$>", k)) { nextTag = k; break; }
                }

                if (nextTag === -1) { let rest = code.substring(i); resultat += doInterpolation ? await interpolate(rest) : rest; break; }
                let textBefore = code.substring(i, nextTag); resultat += doInterpolation ? await interpolate(textBefore) : textBefore;
                i = nextTag; let handled = false;

                if (code.substring(i).match(/^\$>new\s+/)) {
                    let dP = code.indexOf("(", i); 
                    if (dP > -1) {
                        let fP = trouverFinBloc(code, dP, "()");
                        if (fP > -1) {
                            let decl = code.substring(i, dP).trim();
                            let matchDecl = decl.match(/^\$>new\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_]+)$/);
                            
                            if (matchDecl) {
                                let varName = matchDecl[1]; let className = matchDecl[2];
                                let argsString = code.substring(dP + 1, fP);
                                let resolvedArgsString = await interpreter(argsString, false); 
                                let args = await parseArguments(resolvedArgsString) || [];
                                
                                const classDef = window.TenyGlobalClasses && window.TenyGlobalClasses[className];
                                if (!classDef) { 
                                    resultat += renderError(`Classe introuvable : ${className}`, i); 
                                } else {
                                    let instance = { __className: className };
                                    Object.defineProperty(instance, 'this', { value: instance, enumerable: false });
                                    
                                    if (classDef.parsedParams) {
                                        classDef.parsedParams.forEach((p, idx) => {
                                            let value = args[idx]; if (value === undefined || value === "") value = (p.def !== null) ? p.def : "";
                                            instance[p.name] = value;
                                        });
                                    }
                                    
                                    let classBody = classDef.body; let cleanBody = ""; let cIdx = 0;
                                    while(cIdx < classBody.length) {
                                        let mMatch = classBody.substring(cIdx).match(/^\$>(def|method)\s+/);
                                        if(mMatch) {
                                            let dN = cIdx + mMatch[0].length; let mdP = classBody.indexOf("(", dN);
                                            if(mdP > -1) {
                                                let mName = classBody.substring(dN, mdP).trim(); let mfP = classBody.indexOf(")", mdP); let mdB = classBody.indexOf("{", mfP); let mfB = trouverFinBloc(classBody, mdB, "{}");
                                                if(mdB > -1 && mfB > -1) {
                                                    let mParamsRaw = classBody.substring(mdP+1, mfP).split(',').map(s=>s.trim()).filter(s=>s);
                                                    let mBody = classBody.substring(mdB+1, mfB);
                                                    instance[mName] = async function(...mArgs) {
                                                        let methodScope = Object.create(instance);
                                                        mParamsRaw.forEach((p, idx) => { methodScope[p] = mArgs[idx] !== undefined ? mArgs[idx] : ""; });
                                                        let mCtx = { text: mBody, variables: globalVars, localScope: methodScope, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger };
                                                        await executerMiniLangage(mCtx); 
                                                        
                                                        // --- GESTION DU RETURN POUR LES MÉTHODES ---
                                                        if (mCtx.returnValue !== undefined) return mCtx.returnValue;
                                                        return mCtx.text; 
                                                    };
                                                    cIdx = mfB + 1; continue;
                                                }
                                            }
                                        }
                                        cleanBody += classBody[cIdx]; cIdx++;
                                    }
                                    
                                    let subCtx = { text: cleanBody, variables: globalVars, localScope: instance, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger };
                                    await executerMiniLangage(subCtx);
                                    setVar(varName, instance);
                                }
                                i = fP + 1; if(code[i] === '\n') i++; handled = true; continue;
                            }
                        }
                    }
                }

                // --- NOUVEAU: GESTION DU RETURN NATIF ---
                if (code.startsWith("$>return(", i)) {
                    let finReturn = trouverFinBloc(code, i + 8, "()");
                    if (finReturn > -1) { 
                        let content = code.substring(i + 9, finReturn); 
                        let resolvedContent = await interpreter(content); 
                        let args = await parseArguments(resolvedContent) || [];
                        context.returnValue = args.length > 0 ? args[0] : "";
                        break; // Arrête la boucle d'interprétation pour sortir de la fonction
                    } else {
                        resultat += renderError("Parenthèse manquante dans $>return", i, "Ajoutez ')' à la fin."); i += 9; handled = true; continue;
                    }
                }

                if (code.startsWith("$>math(", i)) {
                    let finMath = trouverFinBloc(code, i + 6, "()");
                    if (finMath > -1) { 
                        let content = code.substring(i + 7, finMath); 
                        let resolvedContent = await interpreter(content); 
                        resultat += await evalMath(resolvedContent, i); i = finMath + 1; handled = true; continue; 
                    } else {
                        resultat += renderError("Parenthèse manquante dans $>math", i, "Ajoutez ')' à la fin."); i += 7; handled = true; continue;
                    }
                }

                if (code.substring(i).match(/^\$>var\s+/)) {
                    let finInstruction = i + 4; let pLevel = 0; let bLevel = 0; let cLevel = 0; let foundEqual = false; let inQ = false; let qChar = null;
                    while (finInstruction < code.length) { 
                        let c = code[finInstruction]; 
                        if (!inQ && (c === '"' || c === "'" || c === '`')) { inQ = true; qChar = c; }
                        else if (inQ && c === qChar && code[finInstruction-1] !== '\\') { inQ = false; qChar = null; }
                        if (!inQ) {
                            if (c === '=' && pLevel === 0 && bLevel === 0 && cLevel === 0) foundEqual = true; 
                            if (c === '(') pLevel++; else if (c === ')') pLevel--; 
                            if (c === '[') bLevel++; else if (c === ']') bLevel--; 
                            if (c === '{') cLevel++; else if (c === '}') cLevel--; 
                        }
                        if ((c === '\n' || finInstruction === code.length - 1) && !inQ && pLevel <= 0 && bLevel <= 0 && cLevel <= 0 && foundEqual) {
                            if (c !== '\n') finInstruction++; break; 
                        }
                        finInstruction++; 
                    }
                    
                    let ligne = code.substring(i, finInstruction); let match = ligne.match(/\$>var\s*=?\s*([a-zA-Z0-9_.]+)\s*=\s*([\s\S]*)/);
                    if (match) {
                        let name = match[1].trim(); let rawVal = match[2].trim();
                        if (rawVal.startsWith("$>")) { 
                            let tempCtx = { text: rawVal, variables: globalVars, localScope: localVars, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger }; 
                            await executerMiniLangage(tempCtx); let res = tempCtx.text.trim(); 
                            // Propagation du return depuis le $>var si appel à une fonction
                            if (tempCtx.returnValue !== undefined) {
                                res = tempCtx.returnValue;
                            } else {
                                if (!isNaN(res) && res !== "") res = Number(res); else try { res = JSON.parse(res); } catch {} 
                            }
                            setVar(name, res); 
                        } else if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'")) || (rawVal.startsWith('`') && rawVal.endsWith('`'))) {
                            setVar(name, await evalSimple(rawVal));
                        } else if (/[+\-*/]/.test(rawVal) && !rawVal.startsWith('[') && !rawVal.startsWith('{')) { 
                            setVar(name, await evalMath(rawVal, i)); 
                        } else { setVar(name, await evalSimple(rawVal)); }
                    } else { renderError("Syntaxe $>var invalide", i, "Format attendu : $>var nom = valeur"); }
                    i = finInstruction; if(code[i] === '\n') i++; handled = true; continue;
                }

                let matchAuto = code.substring(i).match(/^\$>([a-zA-Z0-9_.]+)/);
                if (!handled && matchAuto) {
                    let funcName = matchAuto[1];
                    if (!['var', 'if', 'else', 'for', 'repeat', 'while', 'def', 'class', 'method', 'new', 'math', 'js_script', 'js_module', 'css_style', 'return'].includes(funcName)) {  
                        let nextIdx = i + matchAuto[0].length; let hasParens = (code[nextIdx] === '('); let args = []; let newIndex = i; let executed = false; let output = undefined;
                        const htmlTags = ['div', 'span', 'p', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'ul', 'li', 'input', 'img', 'strong', 'b', 'i', 'em', 'nav', 'main', 'header', 'footer', 'hr', 'br'];

                        if (hasParens) {
                            let finArgs = trouverFinBloc(code, nextIdx, "()");
                            if (finArgs > -1) { 
                                let content = code.substring(nextIdx + 1, finArgs); let resolvedArgsString = await interpreter(content, false); 
                                args = await parseArguments(resolvedArgsString) || []; newIndex = finArgs + 1; 
                            } else {
                                if (htmlTags.includes(funcName.toLowerCase())) resultat += renderError(`Balise mal formée`, i);
                                else resultat += renderError(`Syntaxe invalide`, i);
                                i = nextIdx + 1; handled = true; continue;
                            }
                        } else { newIndex = nextIdx; }

                        let isMethodCall = false; let objInstance = null; let methodName = null;
                        if (funcName.includes('.')) {
                            let parts = funcName.split('.'); methodName = parts.pop(); objInstance = getVar(parts.join('.'));
                            if (objInstance && typeof objInstance[methodName] === 'function') isMethodCall = true;
                        }

                        if (isMethodCall) {
                            try { output = await objInstance[methodName](...args); executed = true; } 
                            catch(e) { resultat += renderError(`Erreur de Méthode : ${e.message}`, i); executed = true; }
                        }
                        else if (funcName === 'print') {
                            let msg = args.length > 0 ? args[0] : ""; let color = args.length > 1 ? args[1] : "inherit"; if (typeof msg === 'object') msg = JSON.stringify(msg);
                            if (typeof msg === 'string' && msg.trim().startsWith('<')) { resultat += msg; } else { resultat += `<div style="color:${color}; font-weight:bold; margin-bottom:2px;">${msg !== undefined ? msg : ''}</div>`; }
                            executed = true;
                        } 
                        else if (funcName === 'log') {
                            let msg = args.length > 0 ? args[0] : ""; if (typeof msg === 'object') msg = JSON.stringify(msg);
                            trace('VAR', await interpolate(msg), getLineNumber(i)); executed = true;
                        }
                        else if (stdLib.hasOwnProperty(funcName)) { try { output = await stdLib[funcName](...args); executed = true; } catch (e) {} } 
                        else if (context.customLib && context.customLib[funcName]) { try { output = await context.customLib[funcName](...args); executed = true; } catch (e) {} }
                        
                        else if (functionRegistry[funcName]) {
                            const funcDef = functionRegistry[funcName]; let newScope = {};
                            if (funcDef.parsedParams) {
                                funcDef.parsedParams.forEach((p, idx) => {
                                    let value = args[idx]; if (value === undefined || value === "") value = (p.def !== null) ? p.def : "";
                                    newScope[p.name] = value;
                                });
                            } else if (funcDef.params) { funcDef.params.forEach((pName, idx) => { newScope[pName] = args[idx] !== undefined ? args[idx] : ""; }); }
                            
                            let subCtx = { text: funcDef.body, variables: globalVars, localScope: newScope, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger };
                            await executerMiniLangage(subCtx); 
                            
                            // --- C'EST ICI QU'ON RÉCUPÈRE LE RETURN DE LA FONCTION ---
                            if (subCtx.returnValue !== undefined) {
                                output = subCtx.returnValue;
                            } else {
                                resultat += subCtx.text; 
                            }
                            executed = true;
                        } else {
                            if (htmlTags.includes(funcName.toLowerCase())) resultat += renderError(`Balise HTML mal formée`, i);
                            else resultat += renderError(`Commande ou Méthode inconnue : $&gt;${funcName}`, i);
                            executed = true;
                        }

                        if (executed) {
                            if (output !== undefined) { if (typeof output === 'object') resultat += JSON.stringify(output); else resultat += output; }
                            i = newIndex; if (code[i] === '\n') i++; handled = true; continue;
                        }
                    }
                }

                // --- JS SCRIPT ---
                if (code.startsWith("$>js_script", i)) {
                    let dB = code.indexOf("{", i); let fB = trouverFinBloc(code, dB, "{}"); 
                    if (fB === -1) { resultat += renderError("Accolade manquante dans $>js_script", i); i += 11; handled = true; continue; }
                    if (dB > -1 && fB > -1) {
                        let scriptCode = await interpolate(code.substring(dB + 1, fB));
                        try { 
                            const executeScript = new Function(scriptCode); let jsResult = executeScript(); 
                            if (jsResult !== undefined) { if (typeof jsResult === 'object') resultat += JSON.stringify(jsResult); else resultat += jsResult; }
                        } catch (e) { resultat += renderError(`Erreur JS : ${e.message}`, i); }
                        i = fB + 1; if(code[i] === '\n') i++; handled = true; continue;
                    }
                }

                // --- JS MODULE ---
                if (code.startsWith("$>js_module", i)) {
                    let dB = code.indexOf("{", i); let fB = trouverFinBloc(code, dB, "{}"); 
                    if (fB === -1) { resultat += renderError("Accolade manquante dans $>js_module", i); i += 11; handled = true; continue; }
                    if (dB > -1 && fB > -1) {
                        let moduleCode = await interpolate(code.substring(dB + 1, fB));
                        try { const scriptMod = document.createElement("script"); scriptMod.type = "module"; scriptMod.textContent = moduleCode; document.head.appendChild(scriptMod); } 
                        catch (e) { resultat += renderError(`Erreur JS Module : ${e.message}`, i); }
                        i = fB + 1; if(code[i] === '\n') i++; handled = true; continue;
                    }
                }

                // --- CSS STYLE ---
                if (code.startsWith("$>css_style", i)) {
                    let dB = code.indexOf("{", i); let fB = trouverFinBloc(code, dB, "{}");
                    if (fB === -1) { resultat += renderError("Accolade manquante dans $>css_style", i); i += 11; handled = true; continue; }
                    if (dB > -1 && fB > -1) {
                        let cssContent = await interpolate(code.substring(dB + 1, fB)); 
                        const style = document.createElement("style"); style.textContent = cssContent; document.head.appendChild(style);
                        i = fB + 1; if(code[i] === '\n') i++; handled = true; continue;
                    }
                }

                if (code.startsWith("$>if", i)) {
                    let dC = code.indexOf("(", i); let fC = trouverFinBloc(code, dC, "()");
                    if (fC === -1) { resultat += renderError("Parenthèse manquante dans $>if", i); i += 4; handled = true; continue; }
                    if (dC > -1 && fC > -1) {
                        let dB = code.indexOf("{", fC); let fB = trouverFinBloc(code, dB, "{}");
                        if (fB === -1) { resultat += renderError("Accolade manquante pour $>if", i); i = fC + 1; handled = true; continue; }
                        if (dB > -1 && fB > -1) {
                            let cond = code.substring(dC + 1, fC); let nI = fB + 1;
                            let reste = code.substring(nI); let bV = code.substring(dB + 1, fB); let bF = "";
                            const matchElse = reste.match(/^(\s*(\/\/.*)*\s*)\$>else\s*\{/);
                            if (matchElse) { 
                                let startElse = nI + reste.indexOf("$>else"); let dE = code.indexOf("{", startElse); let fE = trouverFinBloc(code, dE, "{}"); 
                                if (fE === -1) { resultat += renderError("Accolade manquante pour $>else", startElse); i = startElse + 6; handled = true; continue; }
                                if (fE > -1) { bF = code.substring(dE + 1, fE); nI = fE + 1; } 
                            }
                            if (await evalMath(cond, i)) {
                                let ifCtx = { text: bV, variables: globalVars, localScope: localVars, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger };
                                await executerMiniLangage(ifCtx);
                                if(ifCtx.returnValue !== undefined) { context.returnValue = ifCtx.returnValue; break; }
                                resultat += ifCtx.text;
                            } else if (bF !== "") {
                                let elseCtx = { text: bF, variables: globalVars, localScope: localVars, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger };
                                await executerMiniLangage(elseCtx);
                                if(elseCtx.returnValue !== undefined) { context.returnValue = elseCtx.returnValue; break; }
                                resultat += elseCtx.text;
                            }
                            i = nI; if(code[i] === '\n') i++; handled = true; continue;
                        }
                    }
                }

                let isLoop = false; let typeLoop = "";
                if (code.startsWith("$>repeat", i)) { isLoop = true; typeLoop = "repeat"; } else if (code.startsWith("$>for", i)) { isLoop = true; typeLoop = "for"; }
                
                if (!handled && isLoop) {
                    let textReste = code.substring(i); let dP = textReste.indexOf("("); let fP = dP > -1 ? textReste.indexOf(")", dP) : -1; 
                    if (fP === -1) { resultat += renderError(`Parenthèses manquantes pour $>${typeLoop}`, i); i += 8; handled = true; continue; }
                    let dB = fP > -1 ? textReste.indexOf("{", fP) : -1;
                    if (dP > -1 && fP > -1 && dB > -1) {
                        let param = textReste.substring(dP + 1, fP); let trueDB = i + dB; let fB = trouverFinBloc(code, trueDB, "{}");
                        if (fB === -1) { resultat += renderError(`Accolade manquante pour $>${typeLoop}`, i); i = trueDB + 1; handled = true; continue; }
                        if (fB > -1) {
                            let tpl = code.substring(trueDB + 1, fB); let loopOut = "";
                            if (typeLoop === "repeat") {
                                let c = parseInt(await evalSimple(param)) || 0; if (c > MAX_LOOP_ITER) c = MAX_LOOP_ITER;
                                for (let n = 1; n <= c; n++) { 
                                    let subScope = Object.create(localVars || globalVars); subScope.index = n; 
                                    let subCtx = { text: tpl.replace(/\$index/g, n), variables: globalVars, localScope: subScope, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger }; 
                                    await executerMiniLangage(subCtx); 
                                    if(subCtx.returnValue !== undefined) { context.returnValue = subCtx.returnValue; break; }
                                    loopOut += subCtx.text; 
                                }
                            } else if (typeLoop === "for") {
                                let p = param.split(','); let vN = p[0] ? p[0].trim() : ""; let sN = p[1] ? p[1].trim() : ""; let rawData = undefined;
                                if (sN) { let varName = sN.replace(/^\$+/, ''); rawData = getVar(varName); if (rawData === undefined) rawData = await evalSimple(sN); }
                                let items = Array.isArray(rawData) ? rawData : [];
                                if (items.length > 0) {
                                    for (let iValue of items) { 
                                        let subScope = Object.create(localVars || globalVars); subScope[vN] = iValue; 
                                        let subCtx = { text: tpl, variables: globalVars, localScope: subScope, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger }; 
                                        await executerMiniLangage(subCtx); 
                                        if(subCtx.returnValue !== undefined) { context.returnValue = subCtx.returnValue; break; }
                                        loopOut += subCtx.text; 
                                    }
                                }
                            }
                            if (context.returnValue !== undefined) break;
                            if (loopOut.trim() !== "") resultat += loopOut; i = fB + 1; if(code[i] === '\n') i++; handled = true; continue;
                        }
                    }
                }
                
                let matchWhile = code.substring(i).match(/^\$>while\s*\((.*?)\)\s*\{/);
                if (matchWhile) {
                    let condRaw = matchWhile[1]; let dB = i + matchWhile[0].indexOf('{'); let fB = trouverFinBloc(code, dB, "{}");
                    if (fB === -1) { resultat += renderError("Accolade manquante pour $>while", i); i = dB + 1; handled = true; continue; }
                    if (fB > -1) {
                        let tpl = code.substring(dB + 1, fB); let loopOut = ""; let it = 0;
                        while (it < MAX_LOOP_ITER) { 
                            if(!(await evalMath(condRaw, i))) break; 
                            let subScope = Object.create(localVars || globalVars); 
                            let subCtx = { text: tpl, variables: globalVars, localScope: subScope, langue, functionRegistry, customLib: context.customLib, isRecursion: true, mathCache, debugLogger: logger }; 
                            await executerMiniLangage(subCtx); 
                            if(subCtx.returnValue !== undefined) { context.returnValue = subCtx.returnValue; break; }
                            loopOut += subCtx.text; it++; 
                        }
                        if (context.returnValue !== undefined) break;
                        resultat += loopOut; i = fB + 1; if(code[i] === '\n') i++; handled = true; continue;
                    }
                }

                if (!handled) { if (code.startsWith("$>", i)) { while (i < code.length && code[i] !== '\n') i++; } else { resultat += code[i]; i++; } }
            }
            return resultat;
        }

        let final = await interpreter(text);
        
        if (!context.isRecursion) { 
            if (debug) trace('INFO', '--- Fin du rendu ---'); 
            let cleanHTML = final.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>\n');
            cleanHTML = cleanHTML.replace(/(?:\r?\n\s*){2,}/g, '\n');
            context.text = cleanHTML; 
        } else { 
            context.text = final; 
        }
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

    window.ts_goTo = async function(page, targetSelector = "#contenu_page") {
        const box = document.querySelector(targetSelector);
        if (!box) return console.error(`❌ ERREUR: La cible ${targetSelector} n'existe pas !`);
        box.innerHTML = `<h3 style='color:#888; text-align:center; padding:50px;'>Chargement de ${page}... ⏳</h3>`;
        let fileName = page.endsWith(".teny") ? page : page + ".teny";
        let code = null;
        try { if (window.TSStorage) code = await window.TSStorage.importModule(fileName); } catch(e) {}
        if (!code) { try { let req = await fetch(fileName); if (req.ok) code = await req.text(); } catch(e) {} }
        if (!code) { box.innerHTML = `<div style='color:#ff5555; text-align:center; padding:50px;'>❌ Fichier introuvable : <b>${fileName}</b></div>`; return; }
        let ctx = { text: code, variables: window.TenyGlobalVars, functionRegistry: window.TenyGlobalRegistry };
        await window.executerMiniLangage(ctx); box.innerHTML = ctx.text;
    };

    if (typeof stdLib !== 'undefined') { stdLib.navigate = async (page, targetSelector) => { await window.TenyNaviguer(page, targetSelector || "#contenu_page"); return ""; }; }

    async function initTenySystem() {
        console.log("🚀 TenyOS: Démarrage de l'Auto-Loader...");
        const codes = document.querySelectorAll('ts-code');
        for (let block of codes) {
            let code = block.textContent; let isDebug = block.getAttribute('debug') === 'true'; 
            let div = document.createElement('div'); block.parentNode.insertBefore(div, block);
            let ctx = { text: code, variables: window.TenyGlobalVars, functionRegistry: window.TenyGlobalRegistry };
            await executerMiniLangage(ctx, isDebug); div.innerHTML = ctx.text || ""; block.remove(); 
        }

        const bodies = document.querySelectorAll('ts-body');
        for (let block of bodies) {
            let file = block.getAttribute('file'); let isDebug = block.getAttribute('debug') === 'true'; 
            let code = await TSStorage.importModule(file);
            if (!code) { try { const response = await fetch(file); if (response.ok) code = await response.text(); } catch(e) {} }
            if (code) {
                let ctx = { text: code, variables: window.TenyGlobalVars, functionRegistry: window.TenyGlobalRegistry };
                await executerMiniLangage(ctx, isDebug);
                if (ctx.text && ctx.text.trim().length > 0) { block.innerHTML = ctx.text; }
            } else { block.innerHTML = `<div style="color:red">Erreur: Impossible de lire ${file}</div>`; }
        }
    }
    window.addEventListener("DOMContentLoaded", initTenySystem);
})();
