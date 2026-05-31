
# TenyScript & TenyStudio

> **Le langage de script hybride pour l'automatisation liturgique et les applications web dynamiques.**

<p align="center">
  <img src="https://tenyscript.web.app/icons/logo-with-text.svg" alt="TenyScript Logo" width="300">
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  </a>
  <a href="https://semver.org">
    <img src="https://img.shields.io/badge/version-1.1.0-blue.svg" alt="Version">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/platform-Web-orange.svg" alt="Platform">
  </a>
</p>

---

## Présentation

**TenyScript** est un langage interprété léger, asynchrone et orienté composant. Conçu pour fusionner harmonieusement du contenu textuel (HTML/Markdown) avec de la logique de programmation, il a été initialement créé pour propulser l'écosystème **Mofonaina** (application chrétienne malgache), facilitant la génération dynamique de liturgies (*Fandaharana*), de cantiques et de contenus interactifs.

Le projet inclut **TenyStudio**, un IDE complet fonctionnant entièrement dans le navigateur, permettant de coder, tester et visualiser du TenyScript en temps réel.

---

## Fonctionnalités Clés

### Le Moteur TenyScript
* **Syntaxe Hybride :** Écrivez du texte librement et injectez de la logique avec le préfixe `$>`.
* **Zero Compilation :** Interprété à la volée en JavaScript côté client.
* **Architecture Asynchrone :** Boucles et délais non-bloquants (Zéro Lag).
* **DOM Natif :** Génération et manipulation sécurisée de balises HTML (Virtual DOM).
* **Module Liturgique :** Fonctions dédiées (`$>perikopa`, `$>hira`, `$>verset`) pour les besoins de l'Église.
* **Sécurité :** Exécution sandboxée (dans les limites du navigateur).

### TenyStudio (IDE)
* **Éditeur Monaco :** Coloration syntaxique, auto-complétion et mini-map (comme VS Code).
* **Système de Fichiers Virtuel :** Chargez des projets locaux ou des démos serveur (`./export`) sans configuration.
* **Live Preview :** Visualisation instantanée du rendu HTML/DOM.
* **Console Intégrée :** Debugging, logs d'erreurs et inspection de variables.
* **Persistance :** Sauvegarde automatique de la session via IndexedDB.

---

## Installation & Démarrage

Essayer l'IDE en ligne : [https://tenyscript.web.app](https://tenyscript.web.app/TenyStudio.html)

---

## Syntaxe Rapide

TenyScript utilise `$>pour_les_commandes`. Tout le reste est traité comme du texte/HTML.

### Variables & Affichage
```teny
// Déclaration
$>var nom = "TenyScript"
$>var version = 1.1

// Affichage
Bienvenue sur $>span("style='color: gold'", { $nom }) v.$version !

```

---

## 📖 MANUEL DE RÉFÉRENCE TENYSCRIPT (v1.1)

Ce manuel couvre la syntaxe native, asynchrone et procédurale de la version 1.1.

### 1. Syntaxe de Base

Le langage distingue le **texte brut** (affiché tel quel dans la page) des **macros/commandes** (exécutées par le moteur).

* **Préfixe de commande** : Toute instruction doit commencer par `$>`.
* **Texte simple** : Tout ce qui ne commence pas par `$>` s'affiche directement.
* **Commentaires** : Utilisez `//` pour écrire des notes invisibles dans le code.
* **Blocs Natifs** : Les balises de style ou de contenu utilisent les accolades `{ ... }`.

**Exemple :**

```teny
// Ceci est une note invisible pour le développeur
Ceci est un texte qui sera affiché directement.

$>h1("class='titre-principal'", { Ceci est un titre généré par le code })

```

### 2. Variables et Calculs

TenyScript supporte les chaînes de caractères (Strings), les nombres (Numbers) et les tableaux (Arrays).

**Déclaration et Assignation (`$>var`)**

```teny
$>var nom = "Rakoto"
$>var annee = 2026
$>var liste_hira = [10, 20, 30]

```

**Évaluation Mathématique et Logique (`$>math`)**
Pour modifier une valeur numérique ou faire un calcul, on écrase la variable en utilisant la macro `$>math`.

```teny
$>var annee = $>math($annee + 1)
$>var solde = $>math(5000 + 2000)

```

### 3. Manipulation des Tableaux (Arrays)

TenyScript v1.1 intègre un moteur de manipulation de listes.

| Commande | Description | Exemple |
| --- | --- | --- |
| `$>get(arr, index)` | Lit la valeur à un index précis. | `$>var val = $>get($liste, 0)` |
| `$>set(arr, index, val)` | Modifie la valeur à un index précis. | `$>var _ = $>set($liste, 2, "Test")` |
| `$>push(arr, val)` | Ajoute une valeur à la fin du tableau. | `$>push($liste, 99)` |
| `$>shift(arr)` | Retire et retourne le premier élément. | `$>var premier = $>shift($liste)` |
| `$>len(arr)` | Retourne le nombre d'éléments du tableau. | `$>var taille = $>len($liste)` |
| `$>contains(arr, val)` | Vérifie si une valeur existe dans le tableau. | `$>var ok = $>contains($liste, 50)` |

### 4. Contrôle de Flux (Logique)

**Conditions (`$>if` / `$>else`)**
Supporte les opérateurs : `==`, `!=`, `<`, `>`, `<=`, `>=`, `and`, `or`.

```teny
$>var score = 100
$>if($score >= 50 and $score < 200) {
    Bravo, vous avez passé le premier cap !
} $>else {
    Condition non remplie.
}

```

**Boucle Asynchrone (`$>while`)**
Permet d'itérer sans jamais bloquer l'interface si elle est couplée à un `wait()`.

```teny
$>var i = 0
$>while($i < 5) {
    Génération $i... <br>
    $>var i = $>math($i + 1)
}

```

### 5. Fonctions et Asynchronisme

**Définir et Appeler une Fonction (`$>def`)**

```teny
$>def AfficherMessage(texte) {
    $>div("class='alerte'", { $texte })
}

$>AfficherMessage("Bienvenue dans Mofonaina")

```

**Retourner une valeur (`$>return`)**

```teny
$>def CalculerDouble(x) {
    $>var res = $>math($x * 2)
    $>return($res)
}
$>var mon_double = $>CalculerDouble(5)

```

**L'Opérateur Temporel (`$>wait`)**
Met l'exécution de la fonction en pause pendant X millisecondes sans bloquer le navigateur.

```teny
$>dom_update("#status", "Chargement en cours...")
$>wait(2000) // Pause de 2 secondes
$>dom_update("#status", "Chargement terminé !")

```

### 6. Moteur de Rendu : HTML Natif et Styles

Dans la v1.1, l'intégration HTML est native via des balises de rendu.

**Balises HTML Natives**
Syntaxe : `$>tag("attributs", { contenu })`

```teny
$>div("id='box_1' class='container' style='color: gold;'", {
    $>h1("", { Titre Principal })
    Bienvenue $>span("style='font-weight:bold;'", { $nom }) sur le système.
})

```

**Style Global (`$>css_style`)**
Injecte du CSS pur dans la page.

```teny
$>css_style() {
    body { background: #111; color: #fff; }
    .alerte { color: #ff0055; font-weight: bold; }
}

```

**Modification Dynamique du DOM**

* `$>dom_update("Sélecteur", "Nouvelle valeur")` : Modifie le contenu intérieur.
* `$>dom_style("Sélecteur", "Propriété CSS", "Valeur")` : Modifie un style CSS précis.

### 7. Le Pont JavaScript (Extension)

Pour étendre les capacités de TenyScript, vous pouvez orchestrer du JavaScript natif.

* `window.TenyGlobalVars` : Lit/écrit les variables définies par `$>var`.
* `window.TenyGlobalRegistry` : Appelle les fonctions définies par `$>def`.

```teny
$>js_script() {
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' && window.TenyGlobalRegistry.Valider) {
            window.TenyGlobalRegistry.Valider(); // ou directement $>Valider();
        }
    });
    return "";
}

```

### 8. Commandes Spéciales "Mofonaina"

**📖 Bible et Lectionnaire**

| Commande | Description | Exemple |
| --- | --- | --- |
| `$>perikopa()` | Affiche le lectionnaire complet du jour. | `$>perikopa()` |
| `$>mofonaina()` | Affiche le pain de vie (Mofonaina) du jour. | `$>mofonaina()` |
| `$>hamaky("Ref")` | Affiche un accordéon interactif lisant le texte. | `$>hamaky("Jaona 3:16")` |
| `$>verset_accueil("filtre")` | Affiche un verset d'ouverture (ex: `joie`, `amour`). | `$>verset_accueil("salue")` |

**🎶 Cantiques (Fihirana)**

| Commande | Description | Exemple |
| --- | --- | --- |
| `$>hihira("Ref", "V")` | Affiche les paroles d'un cantique (`all` ou `1-3`). | `$>hihira("FFPM 10", "1-2")` |
| `$>hira_rand("Recueil")` | Pioche un cantique (FFPM, FF, Tsanta, Antema). | `$>hira_rand("FFPM")` |
| `$>hira_serie("Rec", N)` | Affiche une liste de `N` cantiques aléatoires. | `$>hira_serie("FF", 4)` |
| `$>fanekempinoana(N)` | Affiche le Credo (Versions 1, 2, 3 ou 4). | `$>fanekempinoana(1)` |

**🛠️ Utilitaires**

| Commande | Description |
| --- | --- |
| `$>meteo()` | Injecte le Widget Météo local via GPS. |
| `$>lohahevitra()` | Affiche le thème du mois/année de l'Église. |
| `$>date("Format")` | Retourne la date formatée (`MG` ou `FR`). |
| `$>amen()` | Génère un bloc "Amen." stylisé de fin de culte. |

### 9. Exemple : Composant Interactif Complet

```teny
// 1. Variables globales
$>var CLICS = 0
$>var NOM_UTILISATEUR = "Mpitandrina"

// 2. CSS du composant
$>css_style() {
    .app-box { background: #f4f4f9; color: #333; padding: 20px; border-radius: 8px; font-family: sans-serif; text-align: center; }
    .btn-action { background: #007bff; color: #fff; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px; }
}

// 3. Logique Asynchrone
$>def TraiterClic() {
    $>var CLICS = $>math($CLICS + 1)
    $>dom_update("#compteur_val", $CLICS)
    
    $>dom_update("#message_statut", "Sauvegarde en cours...")
    $>wait(1000) 
    $>dom_update("#message_statut", "Prêt.")
}

// 4. Interface (UI)
$>div("class='app-box'", {
    $>h2("style='margin-top:0;'", { Bienvenue, $NOM_UTILISATEUR })
    
    $>div("style='font-size: 1.2em;'", { 
        Nombre d'actions : $>span("id='compteur_val' style='font-weight: bold; color: #007bff;'", { 0 }) 
    })
    
    $>button("class='btn-action' onclick='window.TenyGlobalRegistry.TraiterClic()'", { 
        AJOUTER +1 
    })
    
    $>div("id='message_statut' style='margin-top: 15px; font-size: 0.9em; color: #888;'", { Prêt. })
})

```

