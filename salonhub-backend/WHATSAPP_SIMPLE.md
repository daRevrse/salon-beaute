# 📱 WhatsApp Integration - Mode Simple

## Comment ça fonctionne ?

SalonHub utilise désormais les **liens WhatsApp (wa.me)** pour envoyer des messages. C'est simple, gratuit et ne nécessite aucune configuration !

## ✨ Avantages

- ✅ **Gratuit** : Aucun coût d'API
- ✅ **Aucune configuration** : Fonctionne immédiatement
- ✅ **Universel** : Compatible desktop et mobile
- ✅ **Sécurisé** : Pas besoin de stocker des clés API

## 🎯 Fonctionnement

### 1. Depuis la page Clients

Lorsque vous envoyez un message à un client via WhatsApp :
1. Cliquez sur "Contacter" puis sélectionnez "WhatsApp/SMS"
2. Rédigez votre message
3. Cliquez sur "Envoyer"
4. **WhatsApp s'ouvre automatiquement** avec :
   - Le numéro du client pré-rempli
   - Votre message pré-rempli
5. Il vous suffit de cliquer sur "Envoyer" dans WhatsApp

### 2. Pour les confirmations de rendez-vous

Quand vous confirmez un rendez-vous :
- Un email est envoyé au client (si email renseigné)
- Un lien WhatsApp est généré (si téléphone renseigné)
- Vous pouvez cliquer sur le lien pour envoyer la confirmation via WhatsApp

## 🔗 Format des liens

Les liens générés suivent ce format :
```
https://wa.me/33612345678?text=Bonjour%20Marie,%0A%0AVotre%20rendez-vous...
```

- `33612345678` : Numéro au format international (sans le +)
- Le message est encodé en URL
- Les sauts de ligne sont représentés par `%0A`

## 📱 Compatibilité

- **Desktop** : Ouvre WhatsApp Web
- **Mobile** : Ouvre l'application WhatsApp
- **Tablette** : Ouvre WhatsApp Web ou l'application selon l'installation

## 🚀 Prochaines étapes (optionnel)

Si vous souhaitez un envoi **entièrement automatique** sans interaction manuelle, vous pouvez configurer une API :
- Twilio WhatsApp API
- Meta WhatsApp Business API

Consultez `WHATSAPP_SETUP.md` pour plus d'informations sur la configuration avancée.

---

## 💡 Exemples d'utilisation

### Message de confirmation
```
Bonjour Marie,

Votre rendez-vous a été confirmé ✓

📅 Service: Coupe + Coloration
📆 Date: 15/11/2024
🕐 Heure: 14:30
📍 Salon: Beauty Salon

À bientôt !
```

### Message de rappel
```
Bonjour Marie,

⏰ Rappel de votre rendez-vous demain

📅 Service: Coupe + Coloration
📆 Date: 15/11/2024
🕐 Heure: 14:30
📍 Salon: Beauty Salon

À très bientôt !
```

### Message personnalisé
```
Bonjour Marie Dupont,

Nous avons le plaisir de vous informer d'une nouvelle promotion sur nos services de coloration !

Cordialement,
Votre salon
```

---

## ❓ FAQ

**Q: Le client doit-il avoir WhatsApp installé ?**
R: Oui, le client doit avoir WhatsApp sur son téléphone ou pouvoir accéder à WhatsApp Web.

**Q: Le message est-il envoyé automatiquement ?**
R: Non, WhatsApp s'ouvre avec le message pré-rempli, mais vous devez cliquer sur "Envoyer" pour confirmer l'envoi. C'est une mesure de sécurité.

**Q: Puis-je envoyer des images ou des fichiers ?**
R: Avec le mode lien, seul le texte est pré-rempli. Une fois WhatsApp ouvert, vous pouvez ajouter des images/fichiers manuellement.

**Q: Les messages sont-ils sauvegardés dans SalonHub ?**
R: Oui, l'envoi est enregistré dans l'historique des notifications du client.

**Q: Que se passe-t-il si le numéro est incorrect ?**
R: WhatsApp affichera une erreur indiquant que le numéro n'existe pas ou n'est pas inscrit sur WhatsApp.
