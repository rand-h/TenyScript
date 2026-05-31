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
