/**
 * SalonHub - Recherche publique de salons
 * Recherche libre dans les établissements partenaires
 */

// API URL - adapter selon l'environnement
// const API_BASE_URL = window.location.hostname === 'localhost'
//   ? 'http://localhost:5000'
//   : 'https://api.salonhub.flowkraftagency.com';

const API_BASE_URL = "https://api.salonhub.flowkraftagency.com";

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const resultsContainer = document.getElementById("search-results");
let selectedType = "";
let debounceTimer;

// Mapping type -> nom lisible
const TYPE_NAMES = {
  beauty: "Salon de Beauté",
  restaurant: "Restaurant",
  training: "Centre de Formation",
  medical: "Cabinet Médical",
};

// Mapping type -> icône
const TYPE_ICONS = {
  beauty: "fa-scissors",
  restaurant: "fa-utensils",
  training: "fa-chalkboard-teacher",
  medical: "fa-heartbeat",
};

// Debounced search on input
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(performSearch, 400);
});

// Search on button click
searchBtn.addEventListener("click", performSearch);

// Search on Enter key
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    clearTimeout(debounceTimer);
    performSearch();
  }
});

// Filter chips
document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-chip")
      .forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    selectedType = chip.dataset.type;
    performSearch();
  });
});

async function performSearch() {
  const q = searchInput.value.trim();

  if (q.length < 2) {
    resultsContainer.innerHTML = `
      <p class="search-hint">
        <i class="fas fa-search" style="font-size: 2rem; display: block; margin-bottom: 12px; opacity: 0.3;"></i>
        Entrez au moins 2 caractères pour lancer la recherche
      </p>`;
    return;
  }

  // Show loading
  resultsContainer.innerHTML = `
    <div class="search-loading">
      <i class="fas fa-spinner"></i>
      <p>Recherche en cours...</p>
    </div>`;

  try {
    let url = `${API_BASE_URL}/api/public/search?q=${encodeURIComponent(q)}`;
    if (selectedType) url += `&type=${selectedType}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log("Search results:", data);

    if (data.success && data.data && data.data.length > 0) {
      const resultsHTML = data.data
        .map((tenant) => {
          const typeName =
            TYPE_NAMES[tenant.business_type] || tenant.business_type;
          const typeIcon = TYPE_ICONS[tenant.business_type] || "fa-building";
          const bookingUrl = `https://app.salonhub.flowkraftagency.com/book/${tenant.slug}`;

          return `
          <a href="${bookingUrl}" class="result-card" target="_blank" rel="noopener noreferrer">
            <img
              src="${API_BASE_URL}${tenant.logo_url || "logo_fk_black.png"}"
              alt="${tenant.name}"
              class="result-logo"
              onerror="this.src='logo_fk_black.png'"
            >
            <div class="result-info">
              <h3>${escapeHtml(tenant.name)}</h3>
              <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(tenant.city || "Non renseigné")}</p>
              ${tenant.slogan ? `<p style="font-style: italic; color: #9ca3af;">${escapeHtml(tenant.slogan)}</p>` : ""}
            </div>
            <span class="result-type" data-type="${tenant.business_type}">
              <i class="fas ${typeIcon}"></i> ${typeName}
            </span>
          </a>`;
        })
        .join("");

      resultsContainer.innerHTML = `
        <p style="color: #6b7280; margin-bottom: 20px; font-size: 0.9rem;">
          ${data.pagination.total} résultat${data.pagination.total > 1 ? "s" : ""} pour "<strong>${escapeHtml(q)}</strong>"
        </p>
        <div class="results-grid">${resultsHTML}</div>`;
    } else {
      resultsContainer.innerHTML = `
        <p class="no-results">
          <i class="fas fa-search" style="font-size: 2rem; display: block; margin-bottom: 12px; opacity: 0.3;"></i>
          Aucun résultat trouvé pour "<strong>${escapeHtml(q)}</strong>"
          <br><small style="color: #9ca3af;">Essayez avec d'autres termes ou un autre secteur</small>
        </p>`;
    }
  } catch (error) {
    console.error("Erreur recherche:", error);
    resultsContainer.innerHTML = `
      <p class="search-error">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; display: block; margin-bottom: 12px; color: #f59e0b;"></i>
        Erreur de connexion au serveur.
        <br><small style="color: #9ca3af;">Veuillez réessayer dans quelques instants.</small>
      </p>`;
  }
}

// Utility: escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
