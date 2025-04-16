document.addEventListener("DOMContentLoaded", async () => {
  // ==========================================================================
  // CONSTANTES ET CONFIGURATION
  // ==========================================================================
  const CHAKRA_NAMES = ["root", "sacral", "solar-plexus", "heart", "throat", "third-eye", "crown", "secondary"];
  const IMAGE_MAX_WIDTH = 800;
  const IMAGE_MAX_HEIGHT = 800;
  const IMAGE_JPEG_QUALITY = 0.7;
  const ADMIN_ICON_URL = "images/admin.png";
  const GUEST_ICON_URL = "images/guest.png";
  const ADMIN_SESSION_KEY = "isAdminSession";
  const ADMIN_SESSION_TIMESTAMP_KEY = "adminSessionTimestamp";
  const ADMIN_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in ms

  // Note: Keep CHAKRA_DETAILS updated if necessary
  const CHAKRA_DETAILS = {
    "svg-root": { nom: "Racine (Muladhara)", couleur: "Rouge", element: "Terre", description: "Ancrage, sécurité, survie. Connecté à nos besoins fondamentaux." },
    "svg-sacral": { nom: "Sacré (Swadhisthana)", couleur: "Orange", element: "Eau", description: "Créativité, émotions, sexualité. Centre de notre plaisir et de notre passion." },
    "svg-solar-plexus": { nom: "Plexus Solaire (Manipura)", couleur: "Jaune", element: "Feu", description: "Confiance en soi, pouvoir personnel, volonté. Siège de notre identité et de notre force intérieure." },
    "svg-heart": { nom: "Cœur (Anahata)", couleur: "Vert", element: "Air", description: "Amour, compassion, relations. Pont entre les chakras inférieurs et supérieurs." },
    "svg-throat": { nom: "Gorge (Vishuddha)", couleur: "Bleu clair", element: "Éther/Espace", description: "Communication, expression de soi, vérité. Capacité à exprimer nos pensées et sentiments." },
    "svg-third-eye": { nom: "Troisième Œil (Ajna)", couleur: "Indigo", element: "Lumière", description: "Intuition, clairvoyance, sagesse. Centre de notre perception au-delà du monde matériel." },
    "svg-crown": { nom: "Couronne (Sahasrara)", couleur: "Violet / Blanc", element: "Conscience", description: "Spiritualité, connexion au divin, illumination. Porte vers la conscience universelle." },
    "svg-secondary": { nom: "Mains et Pieds", couleur: "Noir", element: "Éther/Terre", description: "Connexion à la Terre, Action, Manifestation. Ancrage profond, capacité d'action, manifestation aisée." }
  };

  // --- Données pour la génération dynamique des cercles SVG ---
  const chakraCirclesData = [
    { id: "svg-crown", name: "Couronne (Sahasrara)", cy: 235 },
    { id: "svg-third-eye", name: "Troisième Œil (Ajna)", cy: 373 },
    { id: "svg-throat", name: "Gorge (Vishuddha)", cy: 510 },
    { id: "svg-heart", name: "Cœur (Anahata)", cy: 665 },
    { id: "svg-solar-plexus", name: "Plexus Solaire (Manipura)", cy: 819 },
    { id: "svg-sacral", name: "Sacré (Swadhisthana)", cy: 977 },
    { id: "svg-root", name: "Racine (Muladhara)", cy: 1135 },
    { id: "svg-secondary", name: "Mains et Pieds", cy: 1290 }
  ];

  const commonCircleAttrs = {
      cx: "500",
      r: "40",
      class: "chakra-svg-stone"
  };
  const svgNS = "http://www.w3.org/2000/svg";
  // ------------------------------------------------------------

  // ==========================================================================
  // GÉNÉRATION DYNAMIQUE DES CERCLES SVG
  // ==========================================================================
  function createSVGCircles() {
    chakraCirclesData.forEach(chakra => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttributeNS(null, "id", chakra.id);
      circle.setAttributeNS(null, "class", commonCircleAttrs.class);
      circle.setAttributeNS(null, "data-chakra-name", chakra.name);
      circle.setAttributeNS(null, "cx", commonCircleAttrs.cx);
      circle.setAttributeNS(null, "cy", chakra.cy.toString());
      circle.setAttributeNS(null, "r", commonCircleAttrs.r);
      svgElement.appendChild(circle);
    });
    console.log("Cercles SVG des chakras créés dynamiquement.");
  }

  // ==========================================================================
  // SÉLECTION DES ÉLÉMENTS DU DOM
  // ==========================================================================
  const svgElement = document.getElementById("chakra-svg"); // Ajout pour la génération et la délégation
  const infoPanel = document.getElementById("info-panel");
  const panelChakraName = document.getElementById("panel-chakra-name");
  const closePanelButton = document.getElementById("close-panel");
  const tabs = document.querySelectorAll(".tab-link");
  const tabContents = document.querySelectorAll(".tab-content");
  const generalInfoTabContent = document.getElementById("tab-general");
  const addStoneTabBtn = document.querySelector('.tab-link[data-tab="tab-add-stone"]'); // Tab button
  const stoneList = document.getElementById("stone-list");
  const addStoneForm = document.getElementById("add-stone-form");
  const stoneNameInput = document.getElementById("stone-name");
  const stoneVirtuesInput = document.getElementById("stone-virtues");
  const stonePurificationInput = document.getElementById("stone-purification");
  const stoneRechargeInput = document.getElementById("stone-recharge");
  const jewelryCheckboxesContainer = document.getElementById('jewelry-type-group');
  const submitButton = addStoneForm.querySelector('button[type="submit"]');
  const imageInput = document.getElementById('stoneImageInput');
  const imageDropZone = document.getElementById('imageDropZone');
  const imagePreview = document.getElementById('imagePreview');
  const removeImageBtn = document.getElementById('removeImageBtn');
  const dropZonePrompt = document.querySelector('.drop-zone-prompt');
  const confirmationModal = document.getElementById("confirmation-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  // Admin Login DOM Elements
  const adminLoginIcon = document.getElementById("admin-login-icon");
  const adminLoginImg = document.getElementById("admin-login-img");
  const adminLoginModal = document.getElementById("admin-login-modal");
  const closeLoginModalBtn = document.getElementById("close-login-modal");
  const adminPasswordInput = document.getElementById("admin-password-input");
  const adminLoginBtn = document.getElementById("admin-login-btn");
  const adminLoginError = document.getElementById("admin-login-error");
  const adminLogoutModal = document.getElementById("admin-logout-modal");
  const closeLogoutModalBtn = document.getElementById("close-logout-modal");
  const adminLogoutBtn = document.getElementById("admin-logout-btn");

  // ==========================================================================
  // ÉTAT DE L'APPLICATION
  // ==========================================================================
  let currentChakraId = null;
  let allStonesData = {}; // Rempli par l'API
  let stoneToDeleteId = null;
  let chakraOfStoneToDelete = null;
  let isEditing = false;
  let editingStoneId = null; // MongoDB String ID
  let currentImageBase64 = null;
  let isAdmin = false;
  let adminSessionTimeout = null;
  const initialStoneListMessageHTML = `<li><em>${escapeHTML("Aucune pierre ajoutée pour ce chakra.")}</em></li>`;

  // ==========================================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================================

  /** Échappe les caractères HTML potentiellement dangereux */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Supprime toutes les classes de couleur de chakra d'un élément. */
  function removeChakraColorClasses(element) {
    element.classList.remove(...CHAKRA_NAMES.map(name => `chakra-active-color-${name}`));
  }

  /** Affiche un message temporaire (toast) - Basique, peut être stylisé via CSS */
  function showToast(message, type = "info") { // type peut être 'info', 'success', 'error'
    console.log(`[${type.toUpperCase()}] Toast: ${message}`);
    // Basic alert pour l'instant, vous pouvez implémenter une vraie UI de toast
    alert(`[${type.toUpperCase()}] ${message}`);
  }

  // ==========================================================================
  // FONCTIONS D'INTERACTION AVEC L'API BACKEND
  // ==========================================================================

  /** Charge toutes les pierres depuis le backend */
  async function loadInitialStones() {
    console.log("Chargement des données initiales depuis le backend...");
    try {
      const response = await fetch("/.netlify/functions/stones"); // GET par défaut
      if (!response.ok) {
        throw new Error(`Erreur HTTP! status: ${response.status}`);
      }
      const loadedData = await response.json();
      console.log("Données brutes chargées:", loadedData);

      // Pas de migration nécessaire ici - les données sont supposées être au bon format.
      for (const chakraId in loadedData) {
          if (Array.isArray(loadedData[chakraId])) {
              loadedData[chakraId].forEach(stone => {
                  if (stone && stone.id !== undefined && typeof stone.id !== 'string') {
                      stone.id = String(stone.id);
                  }
              });
          }
      }

      allStonesData = loadedData; // Mettre à jour l'état global

      // Si un panneau est déjà ouvert, rafraîchir sa liste
      if (currentChakraId) {
        displayStonesForChakra(currentChakraId);
      }
    } catch (error) {
      console.error("Erreur lors du chargement initial des pierres:", error);
      showToast("Impossible de charger les données des pierres. Vérifiez votre connexion ou réessayez plus tard.", "error");
      allStonesData = {}; // Assurer un état vide en cas d'erreur
    }
  }

  /** Ajoute ou met à jour une pierre via l'API backend. */
  async function addOrUpdateStoneBackend(chakraId, stoneData) {
    const isEditingOperation = !!stoneData.id;
    const stoneIdForURL = stoneData.id;
    const url = isEditingOperation ? `./.netlify/functions/stones/${stoneIdForURL}` : `./.netlify/functions/stones`;
    const method = isEditingOperation ? 'PUT' : 'POST';

    const payload = { ...stoneData, chakraId: chakraId };
    if (isEditingOperation) {
      delete payload.id;
    }

    console.log(`Envoi ${method} vers ${url} avec payload:`, payload);

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Erreur Backend (${response.status}):`, errorBody);
        throw new Error(`Erreur HTTP! status: ${response.status}, body: ${errorBody}`);
      }

      if (response.status === 204) {
          console.log("Opération PUT réussie (204 No Content).");
          return { ...stoneData }; // Retourne les données envoyées (avec l'ID)
      }

      const savedStone = await response.json();
      console.log("Pierre sauvegardée via backend:", savedStone);
       if (savedStone && savedStone.id !== undefined) {
           savedStone.id = String(savedStone.id);
       }
      return savedStone;

    } catch (error) {
      console.error(`Erreur lors de ${isEditingOperation ? 'la modification' : "l'ajout"} via backend:`, error);
      showToast(`Une erreur est survenue lors de ${isEditingOperation ? 'la modification' : "l'ajout"} de la pierre.`, "error");
      return null;
    }
  }

  /** Supprime une pierre via l'API backend. */
  async function deleteStoneBackend(stoneId) {
    console.log(`Tentative de suppression de la pierre ID: ${stoneId}`);
    try {
      const response = await fetch(`./.netlify/functions/stones/${stoneId}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 404) {
           if (response.status === 404) {
                console.warn("Pierre non trouvée pour suppression (ID:", stoneId, "), peut-être déjà supprimée.");
           }
        console.log("Suppression réussie (ou pierre déjà supprimée) pour ID:", stoneId);
        return true;
      } else {
         const errorBody = await response.text();
         console.error(`Erreur Backend (${response.status}):`, errorBody);
         throw new Error(`Erreur HTTP! status: ${response.status}, body: ${errorBody}`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression via backend:", error);
      showToast("Une erreur est survenue lors de la suppression de la pierre.", "error");
      return false;
    }
  }

  // ==========================================================================
  // GESTION DU PANNEAU D'INFORMATION
  // ==========================================================================

  function showPanel(chakraId) {
    currentChakraId = chakraId;
    const chakraData = CHAKRA_DETAILS[chakraId];
    const chakraNameSuffix = chakraId.replace('svg-', '');

    panelChakraName.textContent = chakraData ? chakraData.nom : "Infos Chakra";
    removeChakraColorClasses(infoPanel);
    if (CHAKRA_NAMES.includes(chakraNameSuffix)) {
      infoPanel.classList.add(`chakra-active-color-${chakraNameSuffix}`);
    }

    if (chakraData) {
      generalInfoTabContent.innerHTML = `
        <h3>${escapeHTML(chakraData.nom)}</h3>
        <p><strong>Couleur:</strong> ${escapeHTML(chakraData.couleur)}</p>
        <p><strong>Élément:</strong> ${escapeHTML(chakraData.element)}</p>
        <p><strong>Description:</strong> ${escapeHTML(chakraData.description)}</p>
      `;
    } else {
      generalInfoTabContent.innerHTML = `<p>Informations non disponibles pour ce chakra.</p>`;
    }

    displayStonesForChakra(chakraId);
    activateTab(document.querySelector('.tab-link[data-tab="tab-general"]'));
    infoPanel.classList.add("visible");
    updateAdminUI();
  }

  function hidePanel() {
    infoPanel.classList.remove("visible");
    removeChakraColorClasses(infoPanel);
    currentChakraId = null;
    if (isEditing) {
        resetForm();
    }
  }

  function activateTab(selectedTab) {
    if (!selectedTab) return;

    if (selectedTab === addStoneTabBtn && !isAdmin) {
      showToast("Accès réservé aux administrateurs.", "warning");
      return;
    }

    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    selectedTab.classList.add("active");
    const targetTabContentId = selectedTab.getAttribute("data-tab");
    const targetTabContent = document.getElementById(targetTabContentId);
    if (targetTabContent) {
      targetTabContent.classList.add("active");
    }

    if (targetTabContentId === 'tab-add-stone' && !isEditing) {
        resetForm();
    }
  }

  // ==========================================================================
  // GESTION DES PIERRES (Affichage)
  // ==========================================================================

  function generateStoneListItemHTML(stoneData) {
      const stoneIdString = String(stoneData.id);
      const jewelryDisplay = Array.isArray(stoneData.jewelryTypes) && stoneData.jewelryTypes.length > 0
        ? stoneData.jewelryTypes.map(item =>
            `${escapeHTML(item.type)}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`
          ).join(', ')
        : 'Non spécifié';
      const purificationDisplay = stoneData.purification ? escapeHTML(stoneData.purification) : 'Non spécifié';
      const rechargeDisplay = stoneData.recharge ? escapeHTML(stoneData.recharge) : 'Non spécifié';
      const imageHTML = stoneData.image && typeof stoneData.image === 'string' && stoneData.image.startsWith('data:image')
          ? `<img src="${stoneData.image}" alt="${escapeHTML(stoneData.name)}" class="stone-list-image">`
          : '';
      const buttonStyle = isAdmin ? '' : 'style="display:none;"';

      return `
        <div class="stone-info">
          ${imageHTML}
          <div class="stone-text">
            <strong>${escapeHTML(stoneData.name)}</strong>
            <em>Vertus:</em> ${escapeHTML(stoneData.virtues)}<br>
            <em>Purification:</em> ${purificationDisplay}<br>
            <em>Rechargement:</em> ${rechargeDisplay}<br>
            <em>Type(s) de bijou(x):</em> ${jewelryDisplay}
          </div>
        </div>
        <div class="stone-buttons">
          <button class="edit-stone-btn" data-stone-id="${stoneIdString}" aria-label="Modifier ${escapeHTML(stoneData.name)}" ${buttonStyle}>✎</button>
          <button class="delete-stone-btn" data-stone-id="${stoneIdString}" aria-label="Supprimer ${escapeHTML(stoneData.name)}" ${buttonStyle}>×</button>
        </div>
      `;
  }

  function displayStonesForChakra(chakraId) {
    const stonesForCurrentChakra = (allStonesData[chakraId] || [])
        .filter(stone => stone && typeof stone === 'object' && stone.id !== undefined && stone.id !== null);

    stoneList.innerHTML = "";

    if (stonesForCurrentChakra.length === 0) {
      stoneList.innerHTML = initialStoneListMessageHTML;
    } else {
      stonesForCurrentChakra.forEach(stone => {
          const listItem = document.createElement("li");
          listItem.setAttribute('data-stone-id', String(stone.id));
          listItem.innerHTML = generateStoneListItemHTML(stone);
          stoneList.appendChild(listItem);
      });
    }
  }

  function addStoneToDisplayList(stoneData) {
    if (!stoneData || stoneData.id === undefined || stoneData.id === null) {
        console.error("Impossible d'ajouter à la liste : données de pierre invalides", stoneData);
        return;
    }

    const initialMessageElement = stoneList.querySelector('li em');
    if (initialMessageElement && initialMessageElement.textContent.includes('Aucune pierre ajoutée')) {
        stoneList.innerHTML = '';
    }

    const listItem = document.createElement("li");
    listItem.setAttribute('data-stone-id', String(stoneData.id));
    listItem.innerHTML = generateStoneListItemHTML(stoneData);
    stoneList.appendChild(listItem);
    updateAdminUI();
  }

  function updateStoneInDisplayList(stoneData) {
      if (!stoneData || stoneData.id === undefined || stoneData.id === null) {
          console.error("Impossible de mettre à jour la liste : données de pierre invalides", stoneData);
          return;
      }
      const stoneIdString = String(stoneData.id);
      const listItem = stoneList.querySelector(`li[data-stone-id="${stoneIdString}"]`);
      if (listItem) {
          listItem.innerHTML = generateStoneListItemHTML(stoneData);
          updateAdminUI();
      } else {
          console.warn("Élément de liste non trouvé pour mise à jour, ID:", stoneIdString);
      }
  }

  // ==========================================================================
  // GESTION DU FORMULAIRE
  // ==========================================================================

  function populateEditForm(stoneData) {
    stoneNameInput.value = stoneData.name;
    stoneVirtuesInput.value = stoneData.virtues;
    stonePurificationInput.value = stoneData.purification || '';
    stoneRechargeInput.value = stoneData.recharge || '';

    resetJewelryCheckboxesAndQuantities();

    stoneData.jewelryTypes?.forEach(item => {
      if (item && typeof item.type === 'string') {
        const checkbox = jewelryCheckboxesContainer.querySelector(`input[name="jewelry-type"][value="${item.type}"]`);
        if (checkbox) {
            checkbox.checked = true;
            const normalizedType = item.type.replace(/\s|\/|'/g, '_');
            const quantityInput = document.querySelector(`input[name="quantity_${normalizedType}"]`);
            if (quantityInput) {
                quantityInput.disabled = false;
                quantityInput.value = item.quantity > 1 ? item.quantity : '';
                quantityInput.placeholder = '1';
            }
        } else {
            console.warn(`Checkbox non trouvée pour le type: ${item.type}`);
        }
      } else {
        console.warn('Item de type de bijou malformé ignoré lors de la modification:', item);
      }
    });

    if (stoneData.image && typeof stoneData.image === 'string' && stoneData.image.startsWith('data:image')) {
      imagePreview.src = stoneData.image;
      imagePreview.style.display = 'block';
      imageDropZone.classList.add('has-image');
      removeImageBtn.style.display = 'inline-block';
      currentImageBase64 = stoneData.image;
    } else {
      resetImagePreview();
    }

    submitButton.textContent = 'Modifier la pierre';
    isEditing = true;
    editingStoneId = String(stoneData.id);

    activateTab(addStoneTabBtn);
    stoneNameInput.focus();
  }

  function resetJewelryCheckboxesAndQuantities() {
      jewelryCheckboxesContainer.querySelectorAll('input[name="jewelry-type"]').forEach(checkbox => {
          checkbox.checked = false;
          const normalizedType = checkbox.value.replace(/\s|\/|'/g, '_');
          const quantityInput = document.querySelector(`input[name="quantity_${normalizedType}"]`);
          if (quantityInput) {
            quantityInput.value = '';
            quantityInput.placeholder = '';
            quantityInput.disabled = true;
          }
      });
  }

  function resetForm() {
    addStoneForm.reset();
    resetJewelryCheckboxesAndQuantities();
    resetImagePreview();
    submitButton.textContent = 'Ajouter la pierre';
    isEditing = false;
    editingStoneId = null;
    currentImageBase64 = null;
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    if (!isAdmin) {
        showToast("Action réservée aux administrateurs.", "error");
        return;
    }
    if (!currentChakraId) {
      showToast("Veuillez d'abord sélectionner un chakra.", "warning");
      return;
    }

    const stoneName = stoneNameInput.value.trim();
    const stoneVirtues = stoneVirtuesInput.value.trim();

    const jewelryTypesWithQuantities = Array.from(
        jewelryCheckboxesContainer.querySelectorAll('input[name="jewelry-type"]:checked')
    ).map(checkbox => {
      const type = checkbox.value;
      const normalizedType = type.replace(/\s|\/|'/g, '_');
      const quantityInput = document.querySelector(`input[name="quantity_${normalizedType}"]`);
      let quantity = 1;
      if (quantityInput) {
        const parsedValue = parseInt(quantityInput.value, 10);
        if (!isNaN(parsedValue) && parsedValue >= 1) {
          quantity = parsedValue;
        }
      }
       return { type: type, quantity: quantity };
     });

    const stoneDataForBackend = {
        name: stoneName,
        virtues: stoneVirtues,
        purification: stonePurificationInput.value.trim() || null,
        recharge: stoneRechargeInput.value.trim() || null,
        jewelryTypes: jewelryTypesWithQuantities,
        image: currentImageBase64,
        ...(isEditing && { id: editingStoneId })
    };

    submitButton.disabled = true;
    submitButton.textContent = isEditing ? 'Modification...' : 'Ajout...';

    const savedStone = await addOrUpdateStoneBackend(currentChakraId, stoneDataForBackend);

    submitButton.disabled = false;

    if (savedStone && savedStone.id) {
      if (!allStonesData[currentChakraId]) {
        allStonesData[currentChakraId] = [];
      }
      const stoneIndex = allStonesData[currentChakraId].findIndex(s => String(s.id) === String(savedStone.id));

      if (stoneIndex !== -1) { // Modification
        allStonesData[currentChakraId][stoneIndex] = savedStone;
        console.log("État local mis à jour (modification):", allStonesData);
        updateStoneInDisplayList(savedStone);
      } else { // Ajout
        allStonesData[currentChakraId].push(savedStone);
        console.log("État local mis à jour (ajout):", allStonesData);
        addStoneToDisplayList(savedStone);
      }

      resetForm();
      activateTab(document.querySelector('.tab-link[data-tab="tab-my-stones"]'));

    } else {
      console.error("La sauvegarde via le backend a échoué ou n'a pas retourné de données valides.");
      submitButton.textContent = isEditing ? 'Modifier la pierre' : 'Ajouter la pierre';
    }
  }

  // ==========================================================================
  // GESTION DE L'UPLOAD D'IMAGE
  // ==========================================================================
  function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast("Veuillez sélectionner un fichier image.", "warning");
        resetImagePreview();
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let width = img.width;
        let height = img.height;
        const ratio = width / height;

        if (width > IMAGE_MAX_WIDTH || height > IMAGE_MAX_HEIGHT) {
             if (width > height) {
                 width = IMAGE_MAX_WIDTH;
                 height = width / ratio;
             } else {
                 height = IMAGE_MAX_HEIGHT;
                 width = height * ratio;
             }
             width = Math.round(width);
             height = Math.round(height);
             console.log(`Image redimensionnée à ${width}x${height}`);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const resizedBase64 = canvas.toDataURL('image/jpeg', IMAGE_JPEG_QUALITY);

        imagePreview.src = resizedBase64;
        imagePreview.style.display = 'block';
        imageDropZone.classList.add('has-image');
        removeImageBtn.style.display = 'inline-block';
        currentImageBase64 = resizedBase64;
      }
      img.onerror = function() {
        console.error("Erreur de chargement de l'image pour redimensionnement.");
        showToast("Le fichier sélectionné ne semble pas être une image valide.", "error");
        resetImagePreview();
      }
      img.src = e.target.result;
    }
    reader.onerror = function() {
      console.error("Erreur de lecture du fichier.");
      showToast("Erreur lors de la lecture du fichier.", "error");
      resetImagePreview();
    }
    reader.readAsDataURL(file);
  }

  function resetImagePreview() {
    imageInput.value = null;
    imagePreview.src = '#';
    imagePreview.style.display = 'none';
    imageDropZone.classList.remove('has-image');
    removeImageBtn.style.display = 'none';
    currentImageBase64 = null;
  }

  // ==========================================================================
  // GESTION DE LA MODALE DE CONFIRMATION
  // ==========================================================================
  function showConfirmationModal(stoneId, chakraId) {
    stoneToDeleteId = stoneId;
    chakraOfStoneToDelete = chakraId;
    confirmationModal.style.display = 'flex';
    confirmationModal.offsetHeight; // Force reflow
    confirmationModal.classList.add('visible');
    confirmDeleteBtn.focus();
  }

  function hideConfirmationModal() {
    confirmationModal.classList.remove('visible');
    confirmationModal.addEventListener('transitionend', () => {
        if (!confirmationModal.classList.contains('visible')) {
            confirmationModal.style.display = 'none';
        }
    }, { once: true });
  }

  // ==========================================================================
  // SYSTÈME DE CONNEXION ADMIN
  // ==========================================================================

  function updateAdminUI() {
    adminLoginImg.src = isAdmin ? ADMIN_ICON_URL : GUEST_ICON_URL;
    adminLoginImg.alt = isAdmin ? "Déconnexion admin" : "Connexion admin";
    adminLoginIcon.title = isAdmin ? "Mode Administrateur" : "Mode Invité (cliquer pour connexion)";

    if (addStoneTabBtn) {
      addStoneTabBtn.style.display = isAdmin ? "inline-block" : "none";
    }

    stoneList.querySelectorAll('.edit-stone-btn, .delete-stone-btn').forEach(btn => {
      btn.style.display = isAdmin ? "inline-block" : "none";
    });

    if (!isAdmin && infoPanel.classList.contains("visible")) {
      const activeTab = document.querySelector('.tab-link.active');
      if (activeTab === addStoneTabBtn) {
        activateTab(document.querySelector('.tab-link[data-tab="tab-my-stones"]'));
      }
    }
  }

  function setAdminMode(active) {
    const newState = !!active;
    if (isAdmin === newState) return;

    isAdmin = newState;
    localStorage.setItem(ADMIN_SESSION_KEY, isAdmin ? "1" : "0");

    if (isAdmin) {
      localStorage.setItem(ADMIN_SESSION_TIMESTAMP_KEY, Date.now().toString());
      startAdminSessionTimer();
    } else {
      localStorage.removeItem(ADMIN_SESSION_TIMESTAMP_KEY);
      clearAdminSessionTimer();
      if (isEditing) {
          resetForm();
      }
    }
    updateAdminUI();
  }

  function startAdminSessionTimer() {
    clearAdminSessionTimer();
    const expireIn = getAdminSessionRemaining();
    if (expireIn > 0) {
      console.log(`Session admin expire dans ${Math.round(expireIn / 1000 / 60)} minutes.`);
      adminSessionTimeout = setTimeout(() => {
        console.log("Session admin expirée.");
        setAdminMode(false);
        showToast("Session administrateur expirée. Vous êtes repassé en mode invité.", "info");
      }, expireIn);
    } else if (localStorage.getItem(ADMIN_SESSION_KEY) === "1") {
        console.log("Session admin déjà expirée au démarrage du timer.");
        setAdminMode(false);
    }
  }

  function clearAdminSessionTimer() {
    if (adminSessionTimeout) {
      clearTimeout(adminSessionTimeout);
      adminSessionTimeout = null;
    }
  }

  function getAdminSessionRemaining() {
    const timestamp = parseInt(localStorage.getItem(ADMIN_SESSION_TIMESTAMP_KEY), 10);
    if (!timestamp) return 0;
    const now = Date.now();
    const expiryTime = timestamp + ADMIN_SESSION_DURATION;
    return Math.max(0, expiryTime - now);
  }

  function checkAdminSessionValidity() {
    if (localStorage.getItem(ADMIN_SESSION_KEY) === "1") {
      if (getAdminSessionRemaining() > 0) {
        setAdminMode(true);
        return;
      }
    }
    setAdminMode(false);
  }

  function closeLoginModal() {
    // Reset fields and error message first
    adminPasswordInput.value = "";
    adminLoginError.textContent = "";
    adminLoginError.style.display = "none";
    // Start hiding animation (for manual close)
    adminLoginModal.classList.remove("visible");
    // Add listener to set display:none *after* transition (for manual close)
     adminLoginModal.addEventListener('transitionend', () => {
         if (!adminLoginModal.classList.contains('visible')) {
             adminLoginModal.style.display = "none";
         }
     }, { once: true });
  }

  function closeLogoutModal() {
    adminLogoutModal.classList.remove("visible");
     adminLogoutModal.addEventListener('transitionend', () => {
        if (!adminLogoutModal.classList.contains('visible')) {
            adminLogoutModal.style.display = "none";
        }
     }, { once: true });
  }

  async function tryAdminLogin() {
    const password = adminPasswordInput.value;
    if (!password) {
        adminLoginError.textContent = "Veuillez entrer un mot de passe.";
        adminLoginError.style.display = "block";
        return;
    }

    adminLoginError.style.display = "none";
    adminLoginBtn.disabled = true;
    adminLoginBtn.textContent = "Vérification...";

    try {
      const response = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAdminMode(true);
        // Call closeLoginModal to reset fields/errors, but hide immediately after
        closeLoginModal();
        adminLoginModal.style.display = "none"; // <-- Hide immediately
      } else {
        const errorMessage = result.message || "Mot de passe incorrect.";
        adminLoginError.textContent = errorMessage;
        adminLoginError.style.display = "block";
        adminPasswordInput.value = "";
        adminPasswordInput.focus();
      }
    } catch (error) {
      console.error("Erreur lors de la tentative de connexion:", error);
      adminLoginError.textContent = "Erreur de communication avec le serveur.";
      adminLoginError.style.display = "block";
    } finally {
      adminLoginBtn.disabled = false;
      adminLoginBtn.textContent = "Se connecter";
    }
  }

  // ==========================================================================
  // ÉCOUTEURS D'ÉVÉNEMENTS PRINCIPAUX
  // ==========================================================================

  // --- Clics sur les pierres chakra (utilisant la délégation d'événements) ---
  svgElement.addEventListener("click", (event) => {
    const target = event.target;
    // Vérifie si l'élément cliqué est bien un cercle chakra
    if (target.matches(".chakra-svg-stone")) {
        const chakraId = target.id;
        console.log(`Cercle Chakra cliqué : ${chakraId}`);
        showPanel(chakraId);
    }
  });

  // --- Clic sur le bouton de fermeture du panneau ---
  closePanelButton.addEventListener("click", hidePanel);

  // --- Navigation par onglets ---
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        activateTab(tab);
    });
  });

  // --- Clics dans la liste des pierres (Modification / Suppression via délégation) ---
  stoneList.addEventListener('click', (event) => {
    const target = event.target;
    const button = target.closest('.edit-stone-btn, .delete-stone-btn');
    if (!button || !isAdmin) return;

    const listItem = button.closest('li');
    const stoneIdStr = listItem?.getAttribute('data-stone-id');

    if (!stoneIdStr || !currentChakraId) {
        console.error("ID de pierre ou ID de chakra courant manquant pour l'action.");
        return;
    }

    if (button.classList.contains('delete-stone-btn')) {
      showConfirmationModal(stoneIdStr, currentChakraId);
    } else if (button.classList.contains('edit-stone-btn')) {
       const stoneToEdit = allStonesData[currentChakraId]?.find(s => String(s.id) === stoneIdStr);
       if (stoneToEdit) {
         populateEditForm(stoneToEdit);
       } else {
         console.error("Pierre à modifier non trouvée dans les données locales:", stoneIdStr);
         showToast("Erreur: Impossible de trouver les données de cette pierre.", "error");
       }
    }
  });

  // --- Boutons de la modale de confirmation ---
  cancelDeleteBtn.addEventListener('click', () => {
      hideConfirmationModal();
      stoneToDeleteId = null;
      chakraOfStoneToDelete = null;
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!stoneToDeleteId || !chakraOfStoneToDelete) {
      console.error("Erreur critique : ID de pierre ou chakra manquant pour la suppression confirmée.");
      hideConfirmationModal();
      return;
    }

    confirmDeleteBtn.disabled = true;
    cancelDeleteBtn.disabled = true;

    const success = await deleteStoneBackend(stoneToDeleteId);

    confirmDeleteBtn.disabled = false;
    cancelDeleteBtn.disabled = false;

    if (success) {
      if (allStonesData[chakraOfStoneToDelete]) {
         allStonesData[chakraOfStoneToDelete] = allStonesData[chakraOfStoneToDelete].filter(
             (stone) => String(stone.id) !== stoneToDeleteId
         );
         console.log("État local mis à jour (suppression):", allStonesData);
      }
      const listItemToDelete = stoneList.querySelector(`li[data-stone-id="${stoneToDeleteId}"]`);
      if (listItemToDelete) listItemToDelete.remove();

      if (stoneList.children.length === 0) {
        stoneList.innerHTML = initialStoneListMessageHTML;
      }
      updateAdminUI();
    } else {
      showToast("Échec de la suppression de la pierre.", "error");
    }

    hideConfirmationModal();
    stoneToDeleteId = null;
    chakraOfStoneToDelete = null;
  });

  // --- Soumission du formulaire d'ajout/modification ---
  addStoneForm.addEventListener("submit", handleFormSubmit);

  // --- Changement état des cases à cocher de type de bijou ---
  jewelryCheckboxesContainer.addEventListener('change', (event) => {
      if (event.target.matches('input[name="jewelry-type"]')) {
          handleJewelryCheckboxChange(event.target);
      }
  });

  function handleJewelryCheckboxChange(checkbox) {
    const normalizedType = checkbox.value.replace(/\s|\/|'/g, '_');
    const quantityInput = document.querySelector(`input[name="quantity_${normalizedType}"]`);
    if (quantityInput) {
      quantityInput.disabled = !checkbox.checked;
      if (checkbox.checked) {
        quantityInput.value = '';
        quantityInput.placeholder = '1';
      } else {
        quantityInput.value = '';
        quantityInput.placeholder = '';
      }
    }
  }

  // --- Événements pour l'upload/drop d'image ---
  imageDropZone.addEventListener('click', (e) => {
      if (e.target !== removeImageBtn) { imageInput.click(); }
  });
  imageInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) { handleFileSelect(e.target.files[0]); }
  });
  removeImageBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation(); resetImagePreview();
  });
  imageDropZone.addEventListener('dragover', (e) => {
      e.preventDefault(); imageDropZone.classList.add('drag-over');
  });
  imageDropZone.addEventListener('dragleave', () => imageDropZone.classList.remove('drag-over'));
  imageDropZone.addEventListener('drop', (e) => {
      e.preventDefault(); imageDropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileSelect(e.dataTransfer.files[0]);
          imageInput.value = null;
      }
  });

  // --- Événements pour le système de connexion Admin ---
  adminLoginIcon.addEventListener("click", () => {
    if (isAdmin) {
      adminLogoutModal.style.display = "flex";
      adminLogoutModal.offsetHeight; // Reflow
      adminLogoutModal.classList.add("visible");
      adminLogoutBtn.focus();
    } else {
      adminLoginModal.style.display = "flex";
      adminLoginModal.offsetHeight; // Reflow
      adminLoginModal.classList.add("visible");
      adminPasswordInput.value = "";
      adminLoginError.style.display = "none";
      setTimeout(() => adminPasswordInput.focus(), 50);
    }
  });

  closeLoginModalBtn.addEventListener("click", closeLoginModal);
  adminPasswordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { tryAdminLogin(); }
  });
  adminLoginBtn.addEventListener("click", tryAdminLogin);

  closeLogoutModalBtn.addEventListener("click", closeLogoutModal);
  adminLogoutBtn.addEventListener("click", () => {
    setAdminMode(false);
    closeLogoutModal();
  });

  // --- Vérification session admin au focus/intervalle ---
  window.addEventListener("focus", checkAdminSessionValidity);
  setInterval(checkAdminSessionValidity, 60 * 1000);

  // ==========================================================================
  // INITIALISATION AU CHARGEMENT DE LA PAGE
  // ==========================================================================
  confirmationModal.style.display = 'none';
  adminLoginModal.style.display = 'none';
  adminLogoutModal.style.display = 'none';
  stoneList.innerHTML = initialStoneListMessageHTML;

  createSVGCircles(); // Crée les cercles SVG au chargement
  checkAdminSessionValidity();
  await loadInitialStones();
  // updateAdminUI(); // updateAdminUI est appelé dans checkAdminSessionValidity et potentiellement dans loadInitialStones->displayStones

}); // Fin de DOMContentLoaded