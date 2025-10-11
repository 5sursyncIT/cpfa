# Améliorations CSS - Boutons du Catalogue

## Problème résolu

Les boutons "En savoir plus" et "Réserver" étaient collés l'un à l'autre sans espacement adéquat, créant une mauvaise expérience utilisateur.

## Solutions implémentées

### 1. Structure HTML améliorée

**Fichier**: `cpfa-core-manager/includes/elementor/widgets/class-catalogue-widget.php`

#### Ajout du conteneur `.cpfa-item-actions`

Les boutons sont maintenant enveloppés dans un conteneur dédié qui gère l'espacement et l'alignement:

```html
<div class="cpfa-item-actions">
    <a href="..." class="cpfa-item-link">En savoir plus →</a>
    <button class="cpfa-reserve-button cpfa-reserve-available">
        <span class="cpfa-reserve-icon">📖</span>
        Réserver
    </button>
</div>
```

### 2. Améliorations CSS

**Fichier**: `cpfa-core-manager/assets/css/elementor-widgets.css`

#### a) Espacement automatique avec Flexbox Gap

```css
.cpfa-item-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* Espacement entre tous les éléments */
}

.cpfa-item-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* Espacement entre boutons */
    margin-top: auto; /* Pousse les boutons en bas de la carte */
    padding-top: 1rem; /* Séparation du contenu */
}
```

#### b) Boutons pleine largeur et centrés

```css
.cpfa-item-link,
.cpfa-reserve-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 0.5rem; /* Espacement entre icône et texte */
}
```

#### c) Styles visuels améliorés

**Bouton "En savoir plus"**:
```css
.cpfa-item-link {
    background: var(--cpfa-primary); /* Bleu */
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: var(--cpfa-border-radius);
}
```

**Bouton "Réserver" disponible**:
```css
.cpfa-reserve-button.cpfa-reserve-available {
    background: var(--cpfa-accent); /* Vert */
    color: white;
    border: 2px solid var(--cpfa-accent);
}
```

**Bouton "Réserver" non disponible**:
```css
.cpfa-reserve-button.cpfa-reserve-unavailable {
    background: #f5f5f5; /* Gris clair */
    color: #999;
    border: 2px solid #e0e0e0;
    cursor: not-allowed;
}
```

**Message d'exclusion**:
```css
.cpfa-reserve-excluded {
    background: #fff3cd; /* Jaune clair */
    color: #856404;
    border: 2px solid #ffc107;
}
```

### 3. Options de personnalisation Elementor

**Fichier**: `cpfa-core-manager/includes/elementor/widgets/class-catalogue-widget.php` (lignes 308-382)

#### Section "Style des boutons" (Onglet Style)

##### a) Variante du bouton
- **Plein** (défaut) - Boutons avec fond de couleur
- **Contour** - Boutons avec bordure uniquement

```css
.cpfa-button-style-outline .cpfa-item-link {
    background: transparent;
    color: var(--cpfa-primary);
    border: 2px solid var(--cpfa-primary);
}
```

##### b) Forme du bouton
- **Par défaut** - Coins arrondis (8px)
- **Arrondi** - Coins très arrondis (50px)
- **Carré** - Coins peu arrondis (4px)

```css
.cpfa-button-style-rounded .cpfa-item-link,
.cpfa-button-style-rounded .cpfa-reserve-button {
    border-radius: 50px;
}

.cpfa-button-style-square .cpfa-item-link,
.cpfa-button-style-square .cpfa-reserve-button {
    border-radius: 4px;
}
```

##### c) Alignement des boutons
- **Pleine largeur** (défaut) - Boutons occupent 100% de la largeur
- **Gauche** - Boutons alignés à gauche
- **Centre** - Boutons centrés
- **Droite** - Boutons alignés à droite

```css
.cpfa-button-align-left .cpfa-item-actions {
    align-items: flex-start;
}

.cpfa-button-align-center .cpfa-item-actions {
    align-items: center;
}

.cpfa-button-align-right .cpfa-item-actions {
    align-items: flex-end;
}
```

##### d) Espacement personnalisable

Contrôle de type **SLIDER** permettant d'ajuster l'espacement entre les boutons de 0 à 30px:

```php
'selectors' => array(
    '{{WRAPPER}} .cpfa-item-actions' => 'gap: {{SIZE}}{{UNIT}};',
)
```

### 4. Responsive Design

Sur mobile (< 480px), les boutons s'adaptent automatiquement:

```css
@media (max-width: 480px) {
    .cpfa-reserve-button,
    .cpfa-item-link {
        width: 100%;
        justify-content: center;
    }

    .cpfa-item-actions {
        align-items: stretch;
    }
}
```

## Classes CSS disponibles

### Classes principales

| Classe | Description |
|--------|-------------|
| `.cpfa-item-actions` | Conteneur des boutons d'action |
| `.cpfa-item-link` | Bouton "En savoir plus" |
| `.cpfa-reserve-button` | Bouton de réservation |
| `.cpfa-reserve-available` | Bouton réserver disponible |
| `.cpfa-reserve-unavailable` | Bouton réserver non disponible |
| `.cpfa-reserve-excluded` | Message d'exclusion |

### Classes de modification

| Classe | Effet |
|--------|-------|
| `.cpfa-button-style-outline` | Style contour |
| `.cpfa-button-style-rounded` | Coins très arrondis |
| `.cpfa-button-style-square` | Coins peu arrondis |
| `.cpfa-button-align-left` | Alignement à gauche |
| `.cpfa-button-align-center` | Alignement au centre |
| `.cpfa-button-align-right` | Alignement à droite |
| `.cpfa-button-align-stretch` | Pleine largeur |

### Classes d'état

| Classe | Description |
|--------|-------------|
| `.processing` | Bouton en cours de traitement |
| `.success` | Animation de succès |

## Variables CSS utilisées

```css
:root {
    --cpfa-primary: #2c5aa0;     /* Bleu principal */
    --cpfa-secondary: #f8f9fa;   /* Gris clair */
    --cpfa-accent: #28a745;      /* Vert accent */
    --cpfa-danger: #dc3545;      /* Rouge */
    --cpfa-warning: #ffc107;     /* Jaune */
    --cpfa-border-radius: 8px;   /* Arrondi par défaut */
    --cpfa-box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    --cpfa-transition: all 0.3s ease;
}
```

## Guide d'utilisation Elementor

### Étape 1: Modifier le widget Catalogue

1. Ouvrir une page avec Elementor
2. Ajouter ou sélectionner le widget "Catalogue CPFA"
3. Aller dans l'onglet **Style**
4. Chercher la section **"Style des boutons"**

### Étape 2: Personnaliser l'apparence

**Variante**:
- Choisir "Plein" pour des boutons colorés
- Choisir "Contour" pour des boutons transparents avec bordure

**Forme**:
- "Par défaut" pour l'arrondi standard
- "Arrondi" pour des boutons pilule
- "Carré" pour des coins vifs

**Alignement**:
- "Pleine largeur" pour des boutons qui prennent toute la largeur
- "Gauche", "Centre", ou "Droite" pour des boutons de taille automatique

**Espacement**:
- Ajuster le slider pour contrôler l'espace entre les boutons

### Étape 3: Prévisualiser et publier

Les modifications sont visibles en temps réel dans l'aperçu Elementor.

## Exemples de configurations

### Configuration 1: Moderne et minimaliste
- Variante: **Contour**
- Forme: **Arrondi**
- Alignement: **Centre**
- Espacement: **16px**

### Configuration 2: Classique et professionnel
- Variante: **Plein**
- Forme: **Par défaut**
- Alignement: **Pleine largeur**
- Espacement: **12px**

### Configuration 3: Compact et discret
- Variante: **Contour**
- Forme: **Carré**
- Alignement: **Droite**
- Espacement: **8px**

## Compatibilité

✅ Compatible avec tous les navigateurs modernes
✅ Support du mode sombre (prefers-color-scheme)
✅ Responsive sur tous les appareils
✅ Accessible (focus, hover, disabled states)
✅ Support RTL (direction: rtl)

## Performance

- **Aucun JavaScript** requis pour le style
- Utilisation de **CSS Flexbox** (performance optimale)
- **Propriété gap** pour l'espacement (pas de margins complexes)
- **Transitions CSS** fluides (GPU accelerated)

## Accessibilité

- Contrastes de couleurs conformes **WCAG 2.1 AA**
- États focus visibles
- Boutons désactivés clairement identifiables
- Textes alternatifs via `aria-label` si nécessaire

## Améliorations futures possibles

1. **Animations avancées**
   - Effets de survol personnalisés
   - Transitions de couleur

2. **Variantes supplémentaires**
   - Style "Ghost" (semi-transparent)
   - Style "Gradient"
   - Icônes personnalisables

3. **Tailles de boutons**
   - Petit, Moyen, Grand
   - Padding personnalisable

4. **Couleurs personnalisées**
   - Contrôles de couleur Elementor
   - Support des dégradés

5. **Disposition horizontale**
   - Option pour afficher les boutons côte à côte
   - Gestion de l'overflow sur mobile

## Support

Pour toute question ou suggestion d'amélioration, consulter:
- Documentation Elementor: https://elementor.com/help/
- Documentation WordPress: https://developer.wordpress.org/
- CPFA Documentation: Voir BOUTON_RESERVATION.md
