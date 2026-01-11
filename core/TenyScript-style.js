function injecterStylesTenyScript() {
    // Évite de créer le style plusieurs fois si la fonction est rappelée
    if (document.getElementById('tenyscript-styles')) return;

    const css = `
/* --- 1. ERREURS CRITIQUES (.f-ide-error) --- */
.f-ide-error {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    
    /* MODIF : Texte clair sur fond sombre pour la visibilité */
    color: #ff8a80;
    background: rgba(45, 0, 0, 0.9);
    
    backdrop-filter: blur(4px);
    border-left: 4px solid #ff5252;
    padding: 10px 16px;
    border-radius: 8px;
    margin: 8px 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* --- 2. MESSAGES SYSTÈME (.f-ide-system-msg) --- */
.f-ide-system-msg {
    display: block;
    font-family: 'Consolas', 'Menlo', monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    
    /* MODIF : Style "Terminal" sombre */
    color: #00e5ff; 
    background-color: rgba(30, 30, 30, 0.9);
    
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: 4px solid #00bcd4;
    
    padding: 10px 14px;
    margin: 8px 0;
    border-radius: 6px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    width: fit-content;
    max-width: 100%;
    transition: transform 0.2s ease;
}

.f-ide-system-msg:hover {
    transform: translateX(4px);
    background-color: rgba(40, 40, 40, 1);
}

/* --- 3. NOTES INTERNES (.f-ide-note-interne) --- */
.f-ide-note-interne {
    display: block;
    font-family: 'Segoe UI', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: #aaaaaa; /* Gris clair sur fond sombre */
    opacity: 0.9;
    padding: 4px 0;
    margin: 2px 0;
    letter-spacing: 0.5px;
}

/* --- 4. ALERTES DE SUCCÈS (.f-ide-alerte) --- */
.f-ide-alerte {
    display: block;
    font-family: 'Segoe UI', sans-serif;
    font-size: 0.9rem;
    
    /* MODIF : Vert néon sur fond sombre */
    color: #b9f6ca;
    background: linear-gradient(135deg, rgba(20, 40, 25, 0.95) 0%, rgba(10, 20, 10, 0.95) 100%);
    
    backdrop-filter: blur(4px);
    border-left: 4px solid #28a745;
    padding: 12px 16px;
    margin: 10px 0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* --- 5. CONTENEUR DE BOUCLES --- */
.f-ide-block-for {
    display: contents;
}
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'tenyscript-styles';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    
    console.log("🎨 Styles TenyScript mis à jour (Thème Contrasté).");
}

window.injecterStylesTenyScript = injecterStylesTenyScript;
