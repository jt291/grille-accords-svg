#  Aide

L'application permet de gérer des cartes de fidélité. L'écran d'accueil montre la liste des noms figurant sur les cartes.

## Trois onglets : Cartes, Aide, Corbeille

Les "onglets" sont placés en bas de l'écran et sont toujours visibles.

## Ecran "Cartes"

Cet écran montre la liste des noms, avec 4 possibilités d'action :

- Taper sur un nom fait apparaître la carte à ce nom, avec les points de fidélité.
- Un champ "Recherche" permet de restreindre l'affichage aux cartes contenant ce qu'on a tapé dans le champ. La recherche ne fait pas de différence entre majuscules et minuscules, ni entre lettres accentuées et lettres sans accents. Si on tape "e", on voit tous les noms contenant "e", "é", "è", "E", "É", "È" etc.
- Un bouton "+" en haut à droite. Il permet de créer une nouvelle carte.
- Suppression : si on balaye une ligne de droite à gauche ("swipe"), on fait apparaître un bouton rouge "supprimer". Si on tape sur ce bouton, le nom disparaît de la liste des noms et la carte est mise dans la corbeille, où on peut éventuellement la récupérer plus tard, dans l'onglet Corbeille.

Remarque : la liste est classée en ordre alphabétique suivant les conventions du classement français.

## Ecran "Carte"

Cet écran montre la carte sélectionnée, avec le nom du client et son nombre de points de fidélité (de 0 à 5), avec 2 possibilités d'action :

- Renommer : bouton en haut à droite. Cela permet de changer le nom du client, par exemple en cas de faute d'orthographe ou pour distinguer plusieurs clients qui portent le même nom. Le système interdit d'avoir plusieurs fois le même nom.
- Ajouter un point : il suffit de taper sur le rond contenant le nombre de points. Quand le nombre de points passe à 5, il y a un comportement particulier : on mémorise que le client a droit à un cadeau et on remet les points à 0. Le cadeau est représenté sous forme d'une icône avec un bouton "-" qu'on peurra utiliser plus tard pour supprimer le cadeau lorsqu'on offrira effectivement le cadeau au client.

De plus on peut naviguer pour revenir à la liste des cartes ("< Cartes" en haut à gauche).

## Ecran "Nouvelle carte"

Cet écran apparaît quand on a demandé la création d'une nouvelle carte dans la liste des cartes ("+").

On tape un nom dans le champ de saisie. La première lettre est automatiquement mise en majuscules. Une fois que le nom est saisi on a 2 possibilités d'action :

- Accepter la saisie ("OK" en haut à droite). Cela crée une nouvelle carte. Si on voit apparaître l'avertissement "Ce nom existe déjà", il faut modifier le nom pour qu'il soit différent du nom qui existe déjà et qu'il permette de bien identifier le client.
- Annuler (en haut à droite) : cela abandonne l'intention de créer une nouvelle carte.

## Ecran "Renommage"

Cet écran apparaît quand on a demandé "Renommer" dans la carte d'un client.

On tape un nom dans le champ de saisie. La première lettre est automatiquement mise en majuscules. Une fois que le nom est saisi on a 2 possibilités d'action :

- Accepter la saisie ("OK" en haut à droite). Cela remplace le nom sur la carte. Si on voit apparaître l'avertissement "Ce nom existe déjà", il faut modifier le nom pour qu'il soit différent du nom qui existe déjà et qu'il permette bien identifier le client.
- Annuler (en haut à droite) : cela abandonne l'intention de renommer la carte.

## Ecran "Corbeille"

Cet écran montre la liste des cartes qui ont été supprimées, ordonnées suivant la date de suppression, la plus récente d'abord.

Pour chaque carte, on a 2 possibilités d'action :

- "Récupérer", c'est-à-dire remettre la carte dans la liste des cartes, et la supprimer de la corbeille.
- Supprimer définitivement la carte de la corbeille par un mouvement de balayage vers la droite, ce qui fait apparaître un bouton rouge "Supprimer". Dans ce cas la carte n'est pas récupérée, elle est définitivement oubliée.

Il n'est pas possible de récupérer une carte dont le nom figure dans la liste actuelle des cartes, pour éviter les doublons. Pour résoudre ce problème, aller dans la liste des cartes et renommer la carte en question.
