import re
import glob
import os

html_files = glob.glob('c:/Users/Administrateur/salon-beaute/landing-page/*.html')
css_file = 'c:/Users/Administrateur/salon-beaute/landing-page/styles.css'
js_file = 'c:/Users/Administrateur/salon-beaute/landing-page/script.js'

icon_map = {
    'fab fa-linkedin-in': 'linkedin',
    'fab fa-facebook-f': 'facebook',
    'fab fa-instagram': 'instagram',
    'fas fa-arrow-left': 'arrow-left',
    'fas fa-arrow-right': 'arrow-right',
    'fas fa-chevron-down': 'chevron-down',
    'fas fa-chevron-right': 'chevron-right',
    'fas fa-star-half-alt': 'star-half',
    'fas fa-star': 'star',
    'fas fa-check': 'check',
    'fas fa-times': 'x',
    'fas fa-paper-plane': 'send',
    'fas fa-envelope': 'mail',
    'fas fa-phone': 'phone',
    'fas fa-map-marker-alt': 'map-pin',
    'fas fa-calendar-check': 'calendar-check',
    'fas fa-chart-line': 'line-chart',
    'fas fa-clock': 'clock',
    'fas fa-users': 'users',
    'fas fa-bell': 'bell',
    'fas fa-share-alt': 'share-2',
    'fas fa-bullhorn': 'megaphone',
    'fas fa-table': 'table',
    'fas fa-user-plus': 'user-plus',
    'fas fa-sliders-h': 'sliders-horizontal',
    'fas fa-rocket': 'rocket',
    'fas fa-scissors': 'scissors',
    'fas fa-utensils': 'utensils',
    'fas fa-graduation-cap': 'graduation-cap',
    'fas fa-heartbeat': 'heart-pulse',
    'fas fa-mobile-alt': 'smartphone',
    'fas fa-comment-dots': 'message-square-more',
    'fas fa-cut': 'scissors',
    'fas fa-spa': 'flower-2',
    'fas fa-user-md': 'stethoscope',
    'fas fa-hand-sparkles': 'sparkles',
    'fas fa-star': 'star',
    'fas fa-star-half-alt': 'star-half'
}

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(
        r'<link rel="stylesheet" href="https://cdnjs\.cloudflare\.com/ajax/libs/font-awesome/[0-9\.]+/css/all\.min\.css">',
        '<script src="https://unpkg.com/lucide@latest"></script>',
        content
    )

    for fa_class, lucide_name in icon_map.items():
        content = content.replace(f'<i class="{fa_class}"></i>', f'<i data-lucide="{lucide_name}"></i>')
        content = content.replace(f'<i class="{fa_class} c-yes"></i>', f'<i data-lucide="{lucide_name}" class="c-yes"></i>')
        content = content.replace(f'<i class="{fa_class} c-no"></i>', f'<i data-lucide="{lucide_name}" class="c-no"></i>')
    
    # In some places we might just have <i class="fas fa-check">...
    # to be safe, replace all remainders
    for fa_class, lucide_name in icon_map.items():
        content = re.sub(f'<i class="{fa_class}"([^>]*)></i>', f'<i data-lucide="{lucide_name}"\\1></i>', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Update CSS
if os.path.exists(css_file):
    with open(css_file, 'r', encoding='utf-8') as f:
        css = f.read()
    css = re.sub(r'(\.[a-zA-Z0-9_-]+(?:__icon|stars?|nav|social|contact).*?) i\s*\{', r'\1 i, \1 svg {', css)
    css = css.replace('.compare__title i', '.compare__title i, .compare__title svg')
    css = css.replace('.feature-card__icon i', '.feature-card__icon i, .feature-card__icon svg')
    with open(css_file, 'w', encoding='utf-8') as f:
        f.write(css)

# Update JS
if os.path.exists(js_file):
    with open(js_file, 'r', encoding='utf-8') as f:
        js = f.read()
    if 'lucide.createIcons();' not in js:
        js = "document.addEventListener('DOMContentLoaded', () => { lucide.createIcons(); });\n" + js
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(js)

print("Replacement complete")
