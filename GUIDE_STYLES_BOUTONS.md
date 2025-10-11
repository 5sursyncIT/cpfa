# Guide Visuel - Styles des Boutons

## Anatomie d'une carte du catalogue

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │                             │   │  Image
│  │         Image               │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Titre de la ressource              │
│                                     │
│  Lorem ipsum dolor sit amet...      │  Extrait
│                                     │
│  📚 Auteur   📋 Cote   📅 2023      │  Meta
│                                     │
│  ┌─────────────────────────────┐   │
│  │    En savoir plus →         │   │  Bouton 1
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │    📖 Réserver              │   │  Bouton 2
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 1. Variantes de style

### Variante: Plein (filled)

```
┌─────────────────────────────────┐
│ ████████████████████████████████ │  <- Fond coloré
│      En savoir plus →           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ████████████████████████████████ │
│      📖 Réserver                │
└─────────────────────────────────┘
```

**Apparence**:
- Fond: Couleur unie (bleu pour "En savoir plus", vert pour "Réserver")
- Texte: Blanc
- Bordure: Aucune (ou couleur du fond)

### Variante: Contour (outline)

```
┌─────────────────────────────────┐
│ ╔═══════════════════════════════╗ │  <- Bordure colorée
│ ║   En savoir plus →            ║ │
│ ╚═══════════════════════════════╝ │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ╔═══════════════════════════════╗ │
│ ║   📖 Réserver                 ║ │
│ ╚═══════════════════════════════╝ │
└─────────────────────────────────┘
```

**Apparence**:
- Fond: Transparent
- Texte: Couleur (bleu ou vert)
- Bordure: 2px couleur correspondante

**Au survol**:
- Fond: Se remplit de la couleur
- Texte: Devient blanc

## 2. Formes de boutons

### Forme: Par défaut

```
┌─────────────────────────────┐
│  En savoir plus →           │  <- Coins arrondis (8px)
└─────────────────────────────┘
```

### Forme: Arrondi

```
╭─────────────────────────────╮
│  En savoir plus →           │  <- Coins très arrondis (50px)
╰─────────────────────────────╯
```

### Forme: Carré

```
┌─────────────────────────────┐
│  En savoir plus →           │  <- Coins peu arrondis (4px)
└─────────────────────────────┘
```

## 3. Alignements

### Pleine largeur (stretch)

```
Carte du catalogue
┌──────────────────────────────────┐
│ Titre                            │
│ Description...                   │
│                                  │
│ ┌──────────────────────────────┐ │
│ │  En savoir plus →            │ │ <- 100% largeur
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │  📖 Réserver                 │ │ <- 100% largeur
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Aligné à gauche

```
Carte du catalogue
┌──────────────────────────────────┐
│ Titre                            │
│ Description...                   │
│                                  │
│ ┌─────────────────┐              │
│ │ En savoir plus →│              │ <- Aligné gauche
│ └─────────────────┘              │
│ ┌──────────────┐                 │
│ │ 📖 Réserver  │                 │ <- Aligné gauche
│ └──────────────┘                 │
└──────────────────────────────────┘
```

### Centré

```
Carte du catalogue
┌──────────────────────────────────┐
│ Titre                            │
│ Description...                   │
│                                  │
│       ┌─────────────────┐        │
│       │ En savoir plus →│        │ <- Centré
│       └─────────────────┘        │
│        ┌──────────────┐          │
│        │ 📖 Réserver  │          │ <- Centré
│        └──────────────┘          │
└──────────────────────────────────┘
```

### Aligné à droite

```
Carte du catalogue
┌──────────────────────────────────┐
│ Titre                            │
│ Description...                   │
│                                  │
│              ┌─────────────────┐ │
│              │ En savoir plus →│ │ <- Aligné droite
│              └─────────────────┘ │
│                 ┌──────────────┐ │
│                 │ 📖 Réserver  │ │ <- Aligné droite
│                 └──────────────┘ │
└──────────────────────────────────┘
```

## 4. Espacement entre boutons

### Espacement: 0px (collés)

```
┌─────────────────────────────┐
│  En savoir plus →           │
└─────────────────────────────┘
┌─────────────────────────────┐  <- Pas d'espace
│  📖 Réserver                │
└─────────────────────────────┘
```

### Espacement: 12px (par défaut)

```
┌─────────────────────────────┐
│  En savoir plus →           │
└─────────────────────────────┘
                                  <- 12px d'espace
┌─────────────────────────────┐
│  📖 Réserver                │
└─────────────────────────────┘
```

### Espacement: 24px (espacé)

```
┌─────────────────────────────┐
│  En savoir plus →           │
└─────────────────────────────┘


                                  <- 24px d'espace
┌─────────────────────────────┐
│  📖 Réserver                │
└─────────────────────────────┘
```

## 5. États du bouton "Réserver"

### État: Disponible

```
┌─────────────────────────────┐
│ ████████████████████████████ │  <- Vert (#28a745)
│      📖 Réserver            │  <- Blanc
└─────────────────────────────┘

Hover:
┌─────────────────────────────┐
│ ████████████████████████████ │  <- Vert foncé (#218838)
│      📖 Réserver            │  <- Monte légèrement
└─────────────────────────────┘
      ▲ Ombre portée
```

### État: Non disponible

```
┌─────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  <- Gris clair (#f5f5f5)
│   ⏱️  Non disponible         │  <- Gris (#999)
└─────────────────────────────┘
      (Curseur: not-allowed)
```

### État: Exclu du prêt

```
┌─────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  <- Jaune clair (#fff3cd)
│ Consultation sur place       │  <- Brun (#856404)
│ uniquement                   │
└─────────────────────────────┘
```

### État: En cours de traitement

```
┌─────────────────────────────┐
│ ████████████████████████████ │  <- Vert (opacity: 0.7)
│      ⏳ Réserver            │  <- Animation pulse
└─────────────────────────────┘
      (Curseur: wait)
```

### État: Succès

```
┌─────────────────────────────┐
│ ████████████████████████████ │  <- Vert (flash animation)
│      ✅ Réservé             │
└─────────────────────────────┘
```

## 6. Exemples de combinaisons

### Combinaison 1: Style Moderne

**Configuration**:
- Variante: Contour
- Forme: Arrondi
- Alignement: Centre
- Espacement: 16px

**Rendu**:
```
┌──────────────────────────────────┐
│ Introduction à WordPress         │
│ Pierre Durand | 006.76 WP | 2022 │
│                                  │
│     ╭───────────────────────╮    │
│     │  En savoir plus →    │    │
│     ╰───────────────────────╯    │
│                                  │
│     ╭───────────────────────╮    │
│     │  📖 Réserver         │    │
│     ╰───────────────────────╯    │
└──────────────────────────────────┘
```

### Combinaison 2: Style Classique

**Configuration**:
- Variante: Plein
- Forme: Par défaut
- Alignement: Pleine largeur
- Espacement: 12px

**Rendu**:
```
┌──────────────────────────────────┐
│ Python pour débutants            │
│ Luc Robert | 005.133 PY | 2023   │
│                                  │
│ ┌──────────────────────────────┐ │
│ │  En savoir plus →            │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │  📖 Réserver                 │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### Combinaison 3: Style Minimaliste

**Configuration**:
- Variante: Contour
- Forme: Carré
- Alignement: Droite
- Espacement: 8px

**Rendu**:
```
┌──────────────────────────────────┐
│ Guide Linux Ubuntu               │
│ Anne Petit | 005.43 LIN | 2023   │
│                                  │
│              ┌──────────────────┐│
│              │ En savoir plus → ││
│              └──────────────────┘│
│              ┌─────────────┐     │
│              │ 📖 Réserver │     │
│              └─────────────┘     │
└──────────────────────────────────┘
```

## 7. Palette de couleurs

### Bouton "En savoir plus"

```
Couleur principale: #2c5aa0 (Bleu)
┌────┐
│████│ Normal
└────┘

Couleur survol: #28a745 (Vert)
┌────┐
│████│ Hover
└────┘
```

### Bouton "Réserver" - Disponible

```
Couleur principale: #28a745 (Vert)
┌────┐
│████│ Normal
└────┘

Couleur survol: #218838 (Vert foncé)
┌────┐
│████│ Hover
└────┘
```

### Bouton "Réserver" - Non disponible

```
Fond: #f5f5f5 (Gris très clair)
Bordure: #e0e0e0 (Gris clair)
Texte: #999999 (Gris)
┌────┐
│░░░░│ Disabled
└────┘
```

### Message d'exclusion

```
Fond: #fff3cd (Jaune clair)
Bordure: #ffc107 (Jaune)
Texte: #856404 (Brun)
┌────┐
│░░░░│ Warning
└────┘
```

## 8. Animation et transitions

### Animation au survol

```
État initial → État survol (0.3s ease)

Position: 0px      →  Position: -2px (monte)
Ombre: Légère      →  Ombre: Prononcée
Couleur: Primaire  →  Couleur: Accent
```

### Animation de traitement

```
Icône: 📖
    ↓ (Animation pulse 1s infinite)
Icône: ⏳ (pulsation)
```

### Animation de succès

```
Temps: 0s    0.25s   0.5s
       ▼      ▼       ▼
Opacité: 100%  →  70%  →  100%
```

## 9. Responsive (Mobile)

### Desktop (> 480px)

```
┌────────────────────────────────┐
│  Titre long de la ressource    │
│                                │
│  ┌──────────────────────────┐  │
│  │  En savoir plus →        │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │  📖 Réserver             │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### Mobile (< 480px)

```
┌──────────────────┐
│  Titre long de   │
│  la ressource    │
│                  │
│ ┌──────────────┐ │
│ │ En savoir    │ │ <- 100% largeur
│ │ plus →       │ │
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ 📖 Réserver  │ │ <- 100% largeur
│ └──────────────┘ │
└──────────────────┘
```

## 10. Code de référence rapide

### HTML minimum

```html
<div class="cpfa-item-actions">
    <a href="#" class="cpfa-item-link">
        En savoir plus →
    </a>
    <button class="cpfa-reserve-button cpfa-reserve-available">
        <span class="cpfa-reserve-icon">📖</span>
        Réserver
    </button>
</div>
```

### Classes de modification

```html
<!-- Style contour -->
<div class="cpfa-catalogue-widget cpfa-button-style-outline">

<!-- Forme arrondie -->
<div class="cpfa-catalogue-widget cpfa-button-style-rounded">

<!-- Alignement centre -->
<div class="cpfa-catalogue-widget cpfa-button-align-center">

<!-- Combinaison -->
<div class="cpfa-catalogue-widget
            cpfa-button-style-outline
            cpfa-button-style-rounded
            cpfa-button-align-center">
```

### CSS personnalisé (optionnel)

```css
/* Modifier l'espacement globalement */
.cpfa-item-actions {
    gap: 20px !important;
}

/* Modifier les couleurs */
.cpfa-item-link {
    background: #custom-color !important;
}

/* Modifier la taille */
.cpfa-item-link,
.cpfa-reserve-button {
    padding: 1rem 2rem !important;
    font-size: 1.1rem !important;
}
```

## 11. Checklist de personnalisation

Lors de la configuration d'un widget catalogue, vérifier:

- [ ] La variante correspond au design du site (plein ou contour)
- [ ] La forme des boutons est cohérente avec les autres éléments
- [ ] L'alignement est approprié pour la disposition
- [ ] L'espacement entre les boutons est visuellement agréable
- [ ] Les couleurs sont accessibles (contraste suffisant)
- [ ] Le comportement sur mobile est correct
- [ ] Les états hover/focus sont visibles
- [ ] Les animations ne sont pas trop distrayantes

## 12. Résolution de problèmes

### Problème: Boutons toujours collés

**Solution**: Vérifier que la classe `.cpfa-item-actions` est présente et contient la propriété `gap`.

### Problème: Boutons pas alignés

**Solution**: Vérifier la classe d'alignement sur le conteneur principal (`cpfa-button-align-*`).

### Problème: Style contour ne fonctionne pas

**Solution**: Vérifier que la classe `cpfa-button-style-outline` est appliquée au conteneur `.cpfa-catalogue-widget`.

### Problème: Espace personnalisé ne s'applique pas

**Solution**: Vérifier que le sélecteur Elementor `{{WRAPPER}} .cpfa-item-actions` est correctement configuré.
