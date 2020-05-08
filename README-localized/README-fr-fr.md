---
page_type: sample
products:
- ms-graph
languages:
- nodejs
- javascript
- html
extensions:
  contentType: samples
  technologies:
  - Microsoft Graph
  - Microsoft identity platform
  services:
  - Microsoft identity platform 
  - Security
  createdDate: 6/7/2018 1:14:00 PM
---
# Exemple de connexion à l’API de sécurité Microsoft Graph pour Node.js

## Table des matières

* [Introduction](#introduction)
* [Conditions préalables](#prerequisites)
* [Inscription de l’application](#register-the-application)
* [Création et exécution de l’exemple](#build-and-run-the-sample)
* [Questions et commentaires](#questions-and-comments)
* [Contribution](#contributing)
* [Ressources supplémentaires](#additional-resources)

## Introduction

Cet exemple montre comment connecter une application Node.js à un compte professionnel ou scolaire (Azure Active Directory) ou à un compte personnel (Microsoft) à l'aide de l'API Microsoft Graph et du [kit de développement logiciel (SDK, Software Development Kit) JavaScript Graph](https://github.com/microsoftgraph/msgraph-sdk-javascript) pour récupérer des alertes de sécurité et mettre à jour une alerte.

![Capture d’écran de l’exemple de connexion Microsoft Graph pour Node.js](readme-images/Webapp.PNG)

## Conditions préalables

Pour utiliser l’exemple de connexion Microsoft Graph pour Node.js, vous avez besoin des éléments suivants :

* [Node.js](https://nodejs.org/) version 7.6.0 ou ultérieure

* Un [compte Microsoft](https://www.outlook.com/) ou un [compte professionnel ou scolaire](http://dev.office.com/devprogram).

* [](https://ngrok.com/download)Ngrok](https://ngrok.com/download) pour les notifications webhook.

## Inscription de l’application

Pour configurer les exemples, vous devez inscrire une nouvelle application dans le [Portail d’inscription des applications](https://go.microsoft.com/fwlink/?linkid=2083908) Microsoft.

Suivez les étapes suivantes pour inscrire une nouvelle application :

1. Connectez-vous au [portail d’inscription des applications Azure](https://go.microsoft.com/fwlink/?linkid=2083908) en utilisant votre compte personnel, professionnel ou scolaire.

2. Sélectionnez **Nouvelle inscription**. Entrez *http://localhost:3000/token* comme URI de redirection.

3. Entrez un nom pour l’application, puis sélectionnez **S’inscrire**.
    > **Remarque :** Si vous souhaitez que votre application soit mutualisée, sélectionnez `Comptes dans n’importe quel répertoire d’organisation` dans la section **types de comptes pris en charge**.

4. Vous verrez ensuite la page de présentation de votre application. Copiez et enregistrez le champ **ID de l’application**. Vous en aurez besoin plus tard pour terminer le processus de configuration.

5. Sous **Certificats & secrets**, sélectionnez **Nouveau client secret** et ajoutez une description rapide. Un nouveau secret s’affiche dans la colonne **valeur**. Copiez ce mot de passe. Vous en aurez besoin plus tard pour terminer le processus de configuration.

6. Sous **autorisations API**, sélectionnez **ajouter une autorisation** > **Microsoft Graph**.

7. Sous **autorisations déléguées**, ajoutez les autorisations/étendues requises pour l’exemple. Cet exemple a besoin des autorisations **User.Read.All**, **SecurityEvents.ReadWrite.All**et **SecurityActions.ReadWrite.All**.
    >**Remarque** : Voir la [référence des autorisations Microsoft Graph](https://developer.microsoft.com/en-us/graph/docs/concepts/permissions_reference) pour obtenir plus d’informations sur le modèle d’autorisation de Graph.

## Accorder le consentement de l’administrateur pour afficher les données de sécurité

### Attribuer une étendue (autorisation)

1. Fournissez à votre administrateur l’**ID de l’application** et l’**URI de redirection** que vous avez utilisés au cours des étapes précédentes.L’administrateur du locataire Azure Active Directory de l’organisation est requis pour accorder le consentement (autorisations) à l’application.
2. En tant qu’administrateur du locataire pour votre organisation, ouvrez une fenêtre dans un navigateur
et coller l’URL suivante dans la barre d’adresse (après avoir ajouter des valeurs pour APPLICATION\_ID et REDIRECT\_URL) : https://login.microsoftonline.com/common/adminconsent?client\_id=APPLICATION\_ID&state=12345&redirect\_uri=REDIRECT\_URL.
3. Une fois l’authentification effectuée, l’administrateur du locataire verra une fenêtre de dialogue comme celle-ci (suivant les autorisations demandées par l’application) :

     ![Fenêtre de dialogue du consentement de l’étendue](readme-images/Scope.PNG)

3. En cliquant sur « accepter » dans cette fenêtre de dialogue, l’administrateur du locataire donne son accord pour que tous les utilisateurs de l’organisation utilise cette application.
Remarque : Comme il n’y a aucune application en cours d’exécution sur l’URL de redirection, vous allez recevoir un message d’erreur. Ceci est normal. Le consentement de l’administrateur du locataire a été accordé au moment où cette page d’erreur s’affiche.

    ![Fenêtre de dialogue du consentement de l’étendue](readme-images/GrantError.png)

### Autoriser les utilisateurs de votre organisation à accéder à l’API de sécurité Microsoft Graph (attribuer le rôle Azure nécessaire)

Pour accéder aux données de sécurité via l’API de sécurité Microsoft Graph, l’application cliente doit disposer des autorisations requises et, en mode délégué, l’utilisateur connecté à l’application doit également être autorisé à appeler l’API de sécurité Microsoft Graph.</br>
Cette section décrit comment l’administrateur du locataire peut autoriser des utilisateurs spécifiques dans l’organisation.

1. En tant qu’administrateur du locataire, connectez-vous au [portail Azure](https://portal.azure.com).

2. Accédez au panneau Azure Active Directory.

3. Sélectionnez **Utilisateurs**.

4. Sélectionnez un compte d'utilisateur que vous souhaitez autoriser à accéder à l'API de sécurité Microsoft Graph.

5. Sélectionnez **rôle d’annuaire**.

6. Sélectionnez le bouton radio **administrateur limité**, puis activez la case à cocher, à côté du rôle de l’**administrateur de sécurité**

     ![fenêtre de dialogue du consentement de rôle](readme-images/SecurityRole.png)

7. Cliquez sur le bouton **Enregistrer** en haut de l’écran.

Répétez cette action pour chaque utilisateur de l'organisation autorisé à utiliser des applications qui appellent l'API de sécurité Microsoft Graph. Pour le moment, cette autorisation ne peut pas être accordée aux groupes de sécurité.

> **Remarque :** Pour plus d’informations sur le flux d’autorisation, consultez l’article [Autorisation et API de sécurité Microsoft Graph](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization) 

## Configuration de webhook

1. Téléchargez [ngrok](https://ngrok.com/download).
2. Suivez les instructions d’installation sur le site internet ngrok.
3. Exécutez ngrok, si vous utilisez Windows. Exécutez « ngrok.exe http 3000 » pour démarrer ngrok et ouvrir un tunnel vers votre port localhost 3000.
4. Ensuite, mettez à jour le fichier `config.js` avec votre URL ngrok.

    ![Ngrok](readme-images/Ngrok.PNG)

## Création et exécution de l’exemple

1. Téléchargez ou clonez l’exemple de connexion Microsoft Graph pour Node.js.

2. A l’aide votre IDE préféré, ouvrez **config.js**.

3. Remplacez les valeurs des espaces réservés **clientId** et **clientSecret** par l’ID et le mot de passe de l’application que vous avez copiés au moment de l’inscription de l’application. Remplacez **notificationUrl** par votre URL de transfert ngrok.

4. Dans une invite de commandes, exécutez la commande suivante dans le répertoire racine. Cette procédure installe les dépendances du projet.

  ```npm install```

 > **Remarque :**
 Une erreur peut se produire au cours de ce processus si Python 2.7 n’est pas installé sur votre ordinateur. Si l’erreur se produit, l’application Web continuera de fonctionner.

5. Entrez la commande suivante pour démarrer le serveur de développement.

  ```node app.js```

6. Accédez à `http://localhost:3000/` dans votre navigateur web.

7. Cliquez sur le bouton **Se connecter avec Microsoft**.

8. Connectez-vous à votre compte personnel, professionnel ou scolaire et accordez les autorisations demandées.

9. Sélectionnez les alertes à afficher en définissant des critères de filtrage, puis cliquez sur le bouton **obtenir des alertes**.
Une fois l’opération terminée, les alertes qui correspondent à vos critères de filtrage apparaissent sur la page. La requête SDK et la requête REST utilisées pour effectuer l’appel s’affichent également. Le fait de cliquer sur le lien de la requête REST ouvre un nouvel onglet avec l’**afficheur Graph** rempli avec votre requête.
    >**Remarque :** L’application récupère les alertes de sécurité de votre locataire qui correspondent aux critères de filtrage. S’il n’existe aucune alerte de sécurité qui correspond aux fournisseurs répertoriés, « aucune alerte correspondante » s’affiche dans la section de réponse. Pour générer des exemples d’alertes à partir du centre de sécurité Azure, consultez l’article [validation des alertes dans le centre de sécurité](https://docs.microsoft.com/en-us/azure/security-center/security-center-alert-validation)

10. Dans la liste des alertes correspondantes, cliquez sur le **titre** de l’alerte spécifique que vous souhaitez afficher. Les détails complets de l’alerte (JSON) s’affichent dans l’onglet **Détails de l’alerte** sur le côté droit de la page web. Si l’alerte contient le **nom d’utilisateur principal** ou les propriétés du **nom de domaine complet**, l’application effectuera un appel supplémentaire à l’annuaire Azure Actove via l’API Microsoft Graph pour récupérer des détails supplémentaires sur le compte d’utilisateur et l’appareil. Cliquez sur l’onglet **utilisateur & détails de l’appareil** pour afficher des données supplémentaires sur l’utilisateur et l’appareil, le cas échéant.
11. Pour mettre à jour une alerte, entrez l’ID de l’alerte, sélectionnez/entrez des valeurs pour les propriétés modifiables, puis cliquez sur le bouton **Mettre à jour l’alerte**. Les **détails de l’alerte d’origine** et les **détails des alertes mises à jour** sont affichés dans l’onglet **Gestion des alertes** sur le côté droit de la page web.
12. Pour créer un abonnement webhook, sélectionnez au moins une propriété dans une liste déroulante, ou entrez un nom de domaine complet ou un nom d’utilisateur principal. Cliquez ensuite sur « s'abonner » pour créer un abonnement webhook. Cliquez ensuite sur « notifier » pour ouvrir une autre page qui affiche les notifications webhook. Si une propriété correspondant à votre ressource d'abonnement au webhook est mise à jour, une notification sera envoyée à l'application et affichée sur la page des notifications.
    >**Remarque :** Si vous exécutez l’exemple sur votre ordinateur local, vous devez utiliser [ngrok](#Webhook-setup) pour créer et recevoir correctement des notifications.

## Questions et commentaires

N’hésitez pas à nous faire part de vos commentaires sur l’exemple de connexion à l’API de sécurité Microsoft Graph pour node.js à l’aide du SDK JavaScript Graph. Vous pouvez faire part de vos questions et suggestions dans la rubrique [Problèmes](https://github.com/microsoftgraph/nodejs-connect-sample/issues) de ce référentiel.

Les questions générales sur le développement de Microsoft Graph doivent être publiées sur [TechCommunity Microsoft](https://aka.ms/securitygraphcommunity) ou [Stack Overflow](http://stackoverflow.com/questions/tagged/microsoft-graph-security).  Sur **Stack Overflow**, veillez à poser vos questions ou à rédiger vos commentaires en utilisant le tag \[microsoft-graph-security].

## Contribution ##

Ces exemples sont open source et publiés sous la[Licence MIT](https://github.com/microsoftgraph/nodejs-security-sample/blob/master/LICENSE). Les signalement des problèmes (y compris les demandes de fonctionnalité et/ou les questions relatives à cet exemple) et les [demandes de tirage](https://github.com/microsoftgraph/nodejs-security-sample/pulls) sont les bienvenus. Si vous souhaitez voir un autre exemple de l’API de sécurité de Microsoft Graph, nous sommes intéressés par ces commentaires également. veuillez consigner un [problème](https://github.com/microsoftgraph/nodejs-security-sample/issues) et faites-le nous savoir.

Ce projet a adopté le [code de conduite Open Source de Microsoft](https://opensource.microsoft.com/codeofconduct/). Pour en savoir plus, reportez-vous à la [FAQ relative au code de conduite](https://opensource.microsoft.com/codeofconduct/faq/) ou contactez [opencode@microsoft.com](mailto:opencode@microsoft.com) pour toute question ou tout commentaire.
  
## Ressources supplémentaires

- [Documentation de l’API de sécurité Microsoft Graph](https://aka.ms/securitygraphdocs)
- [Autorisation et API de sécurité dans Microsoft Graph](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization)
- [Autres exemples de connexion avec Microsoft Graph](https://github.com/MicrosoftGraph?utf8=%E2%9C%93&query=-Connect)
- [Microsoft Graph](http://graph.microsoft.io)

## Copyright
Copyright (c) 2018 Microsoft. Tous droits réservés.
