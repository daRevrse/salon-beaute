import io
import os

base_dir = "c:/Users/Administrateur/salon-beaute/landing-page/"
template_file = os.path.join(base_dir, "index.html")

with open(template_file, 'r', encoding='utf-8') as f:
    template = f.read()

sectors = {
    'salon-de-beaute.html': {
        'title': 'SalonHub pour Salons de Beauté & Coiffure',
        'desc': 'La plateforme tout-en-un pour salons de beauté, coiffeurs et spas.',
        'hero_title': 'Votre salon de beauté,<br>\n                    <span class="gradient-text">sublimé.</span>',
        'hero_desc': 'Simplifiez la gestion de vos rendez-vous, de vos clients et de votre personnel pour vous concentrer sur ce que vous faites de mieux : embellir vos clients.',
        'bento_1_title': 'Agenda Intelligent',
        'bento_1_desc': 'Évitez les doubles réservations et optimisez votre planning. Gère automatiquement la disponibilité.',
    },
    'restaurant.html': {
        'title': 'SalonHub pour Restaurants & Cafés',
        'desc': 'Gérez les réservations de votre restaurant et optimisez votre service.',
        'hero_title': 'Votre restaurant,<br>\n                    <span class="gradient-text">optimisé.</span>',
        'hero_desc': 'Offrez à vos clients une expérience de réservation simple et fluide. Gérez votre salle avec une efficacité redoutable sans commission.',
        'bento_1_title': 'Gestion des Tables',
        'bento_1_desc': 'Plan de salle interactif, rotation optimisée, et attribution automatique.',
    },
    'centre-de-formation.html': {
        'title': 'SalonHub pour Centres de Formation',
        'desc': 'Gérez vos sessions de formation et vos apprenants facilement.',
        'hero_title': 'Vos formations,<br>\n                    <span class="gradient-text">simplifiées.</span>',
        'hero_desc': 'Automatisez les inscriptions, le suivi des présences et la facturation pour vous concentrer sur la transmission du savoir.',
        'bento_1_title': 'Gestion des Sessions',
        'bento_1_desc': 'Planifiez vos cours, gérez les jauges de participants et le matériel nécessaire.',
    },
    'cabinet-medical.html': {
        'title': 'SalonHub pour Cabinets Médicaux',
        'desc': 'Simplifiez la prise de rendez-vous pour vos patients et la gestion de votre cabinet.',
        'hero_title': 'Votre cabinet,<br>\n                    <span class="gradient-text">serein.</span>',
        'hero_desc': 'Modernisez la prise de rendez-vous et soulagez votre secrétariat. Offrez à vos patients une expérience digitale respectant la confidentialité.',
        'bento_1_title': 'Secrétariat Allégé',
        'bento_1_desc': 'Réduisez de 70% le temps passé au téléphone pour la prise de rendez-vous.',
    }
}

for filename, data in sectors.items():
    content = template
    # Replace title and description
    content = content.replace('<title>SalonHub — Gerez votre activite simplement</title>', f'<title>{data["title"]}</title>')
    content = content.replace('SalonHub — la plateforme de gestion tout-en-un pour salons de beaute, restaurants, centres de formation et cabinets medicaux.', data['desc'])
    
    # Replace Hero Title and Desc
    content = content.replace('Votre activite,<br>\n                    <span class="gradient-text">sous controle.</span>', data['hero_title'])
    content = content.replace('Rendez-vous, clients, paiements et analyses — la plateforme tout-en-un\n                    qui libere votre temps et booste votre chiffre d\'affaires.', data['hero_desc'])
    
    # Replace first bento card as a touch of customization
    content = content.replace('<h3>Reservation en ligne</h3>\n                    <p>Vos clients prennent rendez-vous 24h/24 depuis votre page personnalisee. Fini les appels manques.</p>', f'<h3>{data["bento_1_title"]}</h3>\n                    <p>{data["bento_1_desc"]}</p>')
    
    out_path = os.path.join(base_dir, filename)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Template generation complete.")
