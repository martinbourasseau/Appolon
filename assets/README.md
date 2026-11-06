# Images d'Apollon

| Dossier | Contenu |
|---|---|
| `source/<lot>/` | Originaux reçus, numérotés, jamais modifiés |
| `scripts/prepare.py` | Détourage (fond blanc ou damier), trous enfermés, rognage des liserés, conversion WebP |
| `prepared/` | Versions préparées, en attente de placement |
| `../public/scenes/<scène>/` | Versions intégrées au site |

Chaque image est déclarée dans `src/content/assets.ts` (scène, rôle, palette, statut, origine, droits).
**Les images de palette « nuit » ne peuvent être affectées qu'à la scène III « L'ingénierie » (zone bleue)** :
toute autre affectation fait échouer `npm run typecheck`.

Exemples :
```bash
python3 -I assets/scripts/prepare.py source/lot/09-lion.jpg prepared/lion.webp checker --erode 1 --largest --holes 150
python3 -I assets/scripts/prepare.py source/lot/05-pivoines.jpg prepared/pivoines.webp white --erode 3 --largest --holes 400
```
