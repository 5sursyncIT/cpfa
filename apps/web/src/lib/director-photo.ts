// Portrait du Directeur — source unique pour /a-propos et /mot-du-directeur
// (§1.2 du Directeur). Import statique plutôt qu'URL brute : Next génère les
// variantes responsive et le placeholder flou, et une erreur de chemin casse
// le build au lieu de passer en production en image manquante.
//
// Remplacer la photo = remplacer le fichier ci-dessous ; les deux pages suivent.
import directorPhoto from '../../public/images/directeur_photo.jpeg';

export { directorPhoto };
export const DIRECTOR_NAME = 'El Hadji Cheikhou Oumar SECK';
