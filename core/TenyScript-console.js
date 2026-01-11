function injectDebugConsole() {
    const ID = 'tenyscript-debug-console';
    let container = document.getElementById(ID);

    if (!container) {
        container = document.createElement('div');
        container.id = ID;
        container.style.cssText = `
            position: fixed; bottom: 10px; right: 10px; width: 500px; height: 400px;
            background: #1e1e1e; color: #d4d4d4; font-family: 'Segoe UI', 'Consolas', monospace; font-size: 12px;
            z-index: 99999; border: 1px solid #444; border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column;
            overflow: hidden; opacity: 0.98; transition: height 0.2s;
        `;

        // --- BARRE DE TITRE ---
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px 12px; background: #2d2d2d; cursor: grab; user-select: none;
            border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;
        `;
        header.innerHTML = `
            <div style="font-weight: bold; color: #569cd6; display: flex; align-items: center; gap: 8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>
                TenyScript Debugger
            </div>
            <div style="display: flex; gap: 10px;">
                <span title="Nettoyer" style="cursor:pointer;" onclick="window.clearTSDebug()">🧹</span>
                <span title="Réduire/Agrandir" style="cursor:pointer;" onclick="window.toggleTSSize()">↔️</span>
                <span title="Fermer" style="cursor:pointer;" onclick="this.closest('#${ID}').remove()">✖</span>
            </div>
        `;
        container.appendChild(header);

        // --- BARRE DE FILTRES ---
        const filterBar = document.createElement('div');
        filterBar.style.cssText = `padding: 5px; background: #252526; border-bottom: 1px solid #333; display: flex; gap: 5px;`;
        const filters = ['ALL', 'VAR', 'INFO', 'WARN', 'ERROR'];
        filters.forEach(f => {
            const btn = document.createElement('button');
            btn.innerText = f;
            btn.style.cssText = `background: #333; border: 1px solid #444; color: #aaa; font-size: 10px; padding: 2px 8px; border-radius: 4px; cursor: pointer;`;
            btn.onclick = () => window.filterTSDebug(f, btn);
            if(f === 'ALL') btn.style.borderColor = '#569cd6';
            filterBar.appendChild(btn);
        });
        container.appendChild(filterBar);

        // --- CORPS (LOGS) ---
        const body = document.createElement('div');
        body.className = 'ts-debug-body';
        body.style.cssText = `flex: 1; overflow-y: auto; padding: 10px; scroll-behavior: smooth;`;
        container.appendChild(body);

        document.body.appendChild(container);

        // --- DRAG LOGIC ---
        let isDragging = false;
        let offsetX, offsetY;
        header.onmousedown = (e) => {
            if(e.target.tagName === 'SPAN') return;
            isDragging = true;
            offsetX = e.clientX - container.offsetLeft;
            offsetY = e.clientY - container.offsetTop;
        };
        document.onmousemove = (e) => {
            if (!isDragging) return;
            container.style.left = (e.clientX - offsetX) + 'px';
            container.style.top = (e.clientY - offsetY) + 'px';
            container.style.bottom = 'auto'; container.style.right = 'auto';
        };
        document.onmouseup = () => isDragging = false;
    }

    // --- FONCTIONS GLOBALES DE LA CONSOLE ---
    window.clearTSDebug = () => document.querySelector('.ts-debug-body').innerHTML = '';
    
    window.toggleTSSize = () => {
        const c = document.getElementById(ID);
        c.style.height = c.style.height === '400px' ? '45px' : '400px';
    };

    window.filterTSDebug = (type, btn) => {
        const logs = document.querySelectorAll('.ts-log-entry');
        btn.parentElement.querySelectorAll('button').forEach(b => b.style.borderColor = '#444');
        btn.style.borderColor = '#569cd6';
        logs.forEach(l => {
            l.style.display = (type === 'ALL' || l.dataset.type === type) ? 'flex' : 'none';
        });
    };

    const body = container.querySelector('.ts-debug-body');
    
    return (type, message, line = null) => {
        const div = document.createElement('div');
        div.className = 'ts-log-entry';
        div.dataset.type = type;
        
        let color = '#ccc', icon = '🔹', bg = 'transparent';
        switch(type) {
            case 'VAR': color = '#9cdcfe'; icon = '📦'; break;
            case 'INFO': color = '#b5cea8'; icon = '💡'; break;
            case 'WARN': color = '#d7ba7d'; icon = '⚠️'; bg = 'rgba(215, 186, 125, 0.05)'; break;
            case 'ERROR': color = '#f48771'; icon = '❌'; bg = 'rgba(244, 135, 113, 0.1)'; break;
        }

        div.style.cssText = `
            margin-bottom: 2px; padding: 4px 8px; color: ${color}; background: ${bg};
            border-radius: 4px; display: flex; align-items: start; gap: 8px;
            font-family: 'Consolas', monospace; border-left: 3px solid ${color};
        `;
        
        const lineTag = line ? `<span style="color:#858585; font-size:10px; min-width:30px;">[L:${line}]</span>` : '<span style="min-width:30px;"></span>';
        const time = new Date().toLocaleTimeString('fr-FR', { hour12: false }).split(' ')[0];

        // Formatage intelligent du message si c'est un objet
        let formattedMsg = message;
        if (typeof message === 'object') {
            formattedMsg = `<pre style="margin:0; font-size:10px; color:#ce9178;">${JSON.stringify(message, null, 2)}</pre>`;
        }

        div.innerHTML = `
            <span style="color:#666; font-size:10px;">${time}</span>
            ${lineTag}
            <span style="flex:1;">${icon} ${formattedMsg}</span>
        `;
        
        body.appendChild(div);
        body.scrollTop = body.scrollHeight; 
    };
}

window.injectDebugConsole = injectDebugConsole;
