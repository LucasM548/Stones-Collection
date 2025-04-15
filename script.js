document.addEventListener("DOMContentLoaded", async () => {
  // ==========================================================================
  // CONSTANTES ET CONFIGURATION
  // ==========================================================================
  const CHAKRA_NAMES = ["root", "sacral", "solar-plexus", "heart", "throat", "third-eye", "crown"];
  const IMAGE_MAX_WIDTH = 800;
  const IMAGE_MAX_HEIGHT = 800;
  const IMAGE_JPEG_QUALITY = 0.7;

  const CHAKRA_DETAILS = { /* ... (inchangé) ... */
    "svg-root": { nom: "Racine (Muladhara)", couleur: "Rouge", element: "Terre", description: "Ancrage, sécurité, survie. Connecté à nos besoins fondamentaux." },
    "svg-sacral": { nom: "Sacré (Swadhisthana)", couleur: "Orange", element: "Eau", description: "Créativité, émotions, sexualité. Centre de notre plaisir et de notre passion." },
    "svg-solar-plexus": { nom: "Plexus Solaire (Manipura)", couleur: "Jaune", element: "Feu", description: "Confiance en soi, pouvoir personnel, volonté. Siège de notre identité et de notre force intérieure." },
    "svg-heart": { nom: "Cœur (Anahata)", couleur: "Vert", element: "Air", description: "Amour, compassion, relations. Pont entre les chakras inférieurs et supérieurs." },
    "svg-throat": { nom: "Gorge (Vishuddha)", couleur: "Bleu clair", element: "Éther/Espace", description: "Communication, expression de soi, vérité. Capacité à exprimer nos pensées et sentiments." },
    "svg-third-eye": { nom: "Troisième Œil (Ajna)", couleur: "Indigo", element: "Lumière", description: "Intuition, clairvoyance, sagesse. Centre de notre perception au-delà du monde matériel." },
    "svg-crown": { nom: "Couronne (Sahasrara)", couleur: "Violet / Blanc", element: "Conscience", description: "Spiritualité, connexion au divin, illumination. Porte vers la conscience universelle." }
  };

  // ==========================================================================
  // SÉLECTION DES ÉLÉMENTS DU DOM
  // ==========================================================================
  const chakraStonesElements = document.querySelectorAll(".chakra-svg-stone");
  const infoPanel = document.getElementById("info-panel");
  const panelChakraName = document.getElementById("panel-chakra-name");
  const closePanelButton = document.getElementById("close-panel");
  const tabs = document.querySelectorAll(".tab-link");
  const tabContents = document.querySelectorAll(".tab-content");
  const generalInfoTabContent = document.getElementById("tab-general");
  const myStonesTabContent = document.getElementById("tab-my-stones");
  const addStoneTabContent = document.getElementById("tab-add-stone");
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

  // ==========================================================================
  // ÉTAT DE L'APPLICATION
  // ==========================================================================
  let currentChakraId = null;
  let allStonesData = {}; // <-- Initialisé vide, sera rempli par l'API
  let stoneToDeleteId = null;
  let chakraOfStoneToDelete = null;
  let isEditing = false;
  let editingStoneId = null; // Sera l'ID string de MongoDB
  let currentImageBase64 = null;
  const initialStoneListMessageHTML = `<li><em>${escapeHTML("Aucune pierre ajoutée pour ce chakra.")}</em></li>`; // Message initial

  // ==========================================================================
  // FONCTIONS UTILITAIRES (inchangées pour la plupart)
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

  // ==========================================================================
  // FONCTIONS D'INTERACTION AVEC L'API BACKEND (NOUVEAU)
  // ==========================================================================

  /**
   * Charge toutes les pierres depuis le backend Netlify.
   * Met à jour la variable globale `allStonesData`.
   * @returns {Promise<void>}
   */
  async function loadInitialStones() {
    console.log("Chargement des données initiales depuis le backend...");
    try {
      const response = await fetch(".netlify/functions/stones"); // Appel GET
      if (!response.ok) {
        throw new Error(`Erreur HTTP! status: ${response.status}`);
      }
      allStonesData = await response.json();
      console.log("Données chargées:", allStonesData);
      // Si un panneau est déjà ouvert, rafraîchir sa liste
      if (currentChakraId) {
        displayStonesForChakra(currentChakraId);
      }
    } catch (error) {
      console.error("Erreur lors du chargement initial des pierres:", error);
      alert("Impossible de charger les données des pierres. Vérifiez votre connexion ou réessayez plus tard.");
      allStonesData = {}; // Assurer un état vide en cas d'erreur
    }
  }

  /**
   * Ajoute ou met à jour une pierre via l'API backend.
   * @param {string} chakraId - L'ID du chakra concerné.
   * @param {object} stoneData - Les données de la pierre SANS l'ID si ajout, AVEC l'ID si modification.
   * @returns {Promise<object|null>} La pierre ajoutée/modifiée depuis le backend (avec ID) ou null en cas d'erreur.
   */
  async function addOrUpdateStoneBackend(chakraId, stoneData) {
    const isEditingOperation = !!stoneData.id; // Vrai si stoneData a un ID (modification)
    const stoneIdForURL = stoneData.id; // Garde l'ID pour l'URL si modification

    try {
      const url = isEditingOperation ? `./.netlify/functions/stones/${stoneIdForURL}` : `./.netlify/functions/stones`;
      const method = isEditingOperation ? 'PUT' : 'POST';

      // Préparer le payload : inclure chakraId, et enlever l'id du corps si c'est un PUT
      const payload = { ...stoneData, chakraId: chakraId };
      if (isEditingOperation) {
        delete payload.id; // L'ID est dans l'URL pour PUT
      }

      console.log(`Envoi ${method} vers ${url} avec payload:`, payload);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Erreur Backend (${response.status}):`, errorBody);
        throw new Error(`Erreur HTTP! status: ${response.status}, body: ${errorBody}`);
      }

      if (response.status === 204) { // Cas du PUT réussi sans corps retourné (rare, mais possible)
        return { ...stoneData, id: stoneIdForURL }; // Reconstruire l'objet attendu par le frontend
      }

      const savedStone = await response.json(); // POST (201) ou PUT (200) devrait retourner la donnée
      console.log("Pierre sauvegardée via backend:", savedStone);
      return savedStone;

    } catch (error) {
      console.error(`Erreur lors de ${isEditingOperation ? 'la modification' : "l'ajout"} via backend:`, error);
      alert(`Une erreur est survenue lors de ${isEditingOperation ? 'la modification' : "l'ajout"} de la pierre.`);
      return null;
    }
  }

  /**
   * Supprime une pierre via l'API backend.
   * @param {string} stoneId - L'ID MongoDB (string) de la pierre à supprimer.
   * @returns {Promise<boolean>} Vrai si la suppression a réussi (ou si la pierre n'existait déjà plus), faux sinon.
   */
  async function deleteStoneBackend(stoneId) {
    console.log(`Tentative de suppression de la pierre ID: ${stoneId}`);
    try {
      const response = await fetch(`./.netlify/functions/stones/${stoneId}`, {
        method: 'DELETE',
      });

      // Si OK (200, 204) ou Not Found (404), on considère que c'est un succès côté frontend
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
      alert("Une erreur est survenue lors de la suppression de la pierre.");
      return false;
    }
  }

  // ==========================================================================
  // GESTION DU PANNEAU D'INFORMATION (peu de changements)
  // ==========================================================================

  function showPanel(chakraId) {
    currentChakraId = chakraId;
    // ... (mise à jour titre, couleur, infos générales - inchangé) ...
    const chakraData = CHAKRA_DETAILS[chakraId];
    const chakraNameSuffix = chakraId.replace('svg-', '');

    panelChakraName.textContent = chakraData ? chakraData.nom : "Infos Chakra";
    removeChakraColorClasses(infoPanel);
    if (CHAKRA_NAMES.includes(chakraNameSuffix)) {
      infoPanel.classList.add(`chakra-active-color-${chakraNameSuffix}`);
    }

    if (chakraData) {
      generalInfoTabContent.innerHTML = `
        <h3>${chakraData.nom}</h3>
        <p><strong>Couleur:</strong> ${chakraData.couleur}</p>
        <p><strong>Élément:</strong> ${chakraData.element}</p>
        <p><strong>Description:</strong> ${chakraData.description}</p>
      `;
    } else {
      generalInfoTabContent.innerHTML = `<p>Informations non disponibles pour ce chakra.</p>`;
    }

    // Charger et afficher les pierres (lit maintenant depuis allStonesData rempli par l'API)
    displayStonesForChakra(chakraId);

    activateTab(document.querySelector('.tab-link[data-tab="tab-general"]'));
    infoPanel.classList.add("visible");
  }

  function hidePanel() {
    // ... (inchangé) ...
    infoPanel.classList.remove("visible");
    removeChakraColorClasses(infoPanel); // Nettoyer la classe de couleur
    currentChakraId = null;
    if (isEditing) {
        resetForm();
    }
  }

  function activateTab(selectedTab) {
     // ... (inchangé) ...
    if (!selectedTab) return;
    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    selectedTab.classList.add("active");
    const targetTabContentId = selectedTab.getAttribute("data-tab");
    const targetTabContent = document.getElementById(targetTabContentId);
    if (targetTabContent) {
      targetTabContent.classList.add("active");
    }
  }

  // ==========================================================================
  // GESTION DES PIERRES (Affichage - CRUD se fait via API maintenant)
  // ==========================================================================

  /** Génère le HTML pour un élément de la liste des pierres. */
  function generateStoneListItemHTML(stoneData) {
      // Assurer que stoneData.id est bien une string pour l'attribut data-stone-id
      const stoneIdString = String(stoneData.id);
      const jewelryDisplay = stoneData.jewelryTypes?.length > 0 ? stoneData.jewelryTypes.join(', ') : 'Non spécifié';
      const purificationDisplay = stoneData.purification || 'Non spécifié';
      const rechargeDisplay = stoneData.recharge || 'Non spécifié';
      // Vérifie si l'image est une chaîne base64 valide ou une URL
      const imageHTML = stoneData.image && typeof stoneData.image === 'string' && stoneData.image.startsWith('data:image')
          ? `<img src="${stoneData.image}" alt="${escapeHTML(stoneData.name)}" class="stone-list-image">`
          : ''; // N'affiche pas d'image si ce n'est pas du base64 valide

      return `
        <div class="stone-info">
          ${imageHTML}
          <div class="stone-text">
            <strong>${escapeHTML(stoneData.name)}</strong>
            <em>Vertus:</em> ${escapeHTML(stoneData.virtues)}<br>
            <em>Purification:</em> ${escapeHTML(purificationDisplay)}<br>
            <em>Rechargement:</em> ${escapeHTML(rechargeDisplay)}<br>
            <em>Type(s) de bijou:</em> ${escapeHTML(jewelryDisplay)}
          </div>
        </div>
        <div class="stone-buttons">
          <button class="edit-stone-btn" data-stone-id="${stoneIdString}" aria-label="Modifier ${escapeHTML(stoneData.name)}">✎</button>
          <button class="delete-stone-btn" data-stone-id="${stoneIdString}" aria-label="Supprimer ${escapeHTML(stoneData.name)}">×</button>
        </div>
      `;
  }

  /** Affiche les pierres pour un chakra donné dans la liste. */
  function displayStonesForChakra(chakraId) {
    const stonesForCurrentChakra = allStonesData[chakraId] || [];
    stoneList.innerHTML = ""; // Vider la liste actuelle

    if (stonesForCurrentChakra.length === 0) {
      stoneList.innerHTML = initialStoneListMessageHTML; // Afficher message si vide
    } else {
      stonesForCurrentChakra.forEach(stone => {
        // Vérifier si stone et stone.id existent avant de créer l'élément
        if (stone && stone.id) {
          const listItem = document.createElement("li");
          listItem.setAttribute('data-stone-id', String(stone.id)); // Assurer que c'est une string
          listItem.innerHTML = generateStoneListItemHTML(stone);
          stoneList.appendChild(listItem);
        } else {
          console.warn("Donnée de pierre invalide ou sans ID trouvée pour le chakra:", chakraId, stone);
        }
      });
    }
  }

  /** Ajoute un élément pierre à la liste affichée (après succès API). */
  function addStoneToDisplayList(stoneData) {
        const initialMessageElement = stoneList.querySelector('li em');
        if (initialMessageElement && initialMessageElement.textContent.includes('Aucune pierre ajoutée')) {
            stoneList.innerHTML = ''; // Enlever le message initial
        }

        // Vérifier si stone et stone.id existent
        if (!stoneData || !stoneData.id) {
            console.error("Impossible d'ajouter à la liste : données de pierre invalides", stoneData);
            return;
        }

        const listItem = document.createElement("li");
        listItem.setAttribute('data-stone-id', String(stoneData.id));
        listItem.innerHTML = generateStoneListItemHTML(stoneData);
        stoneList.appendChild(listItem);
  }

  /** Met à jour l'affichage d'une pierre dans la liste (après succès API). */
  function updateStoneInDisplayList(stoneData) {
      // Vérifier si stone et stone.id existent
      if (!stoneData || !stoneData.id) {
          console.error("Impossible de mettre à jour la liste : données de pierre invalides", stoneData);
          return;
      }
      const stoneIdString = String(stoneData.id);
      const listItem = stoneList.querySelector(`li[data-stone-id="${stoneIdString}"]`);
      if (listItem) {
          listItem.innerHTML = generateStoneListItemHTML(stoneData);
      } else {
          console.warn("Élément de liste non trouvé pour mise à jour, ID:", stoneIdString);
      }
  }

  // Supprimé: addOrUpdateStone (remplacé par addOrUpdateStoneBackend)
  // Supprimé: deleteStoneData (remplacé par deleteStoneBackend)

  // ==========================================================================
  // GESTION DU FORMULAIRE (peu de changements, sauf submit)
  // ==========================================================================

  function populateEditForm(stoneData) {
    // ... (inchangé, mais s'assurer que stoneData.id est bien la string de MongoDB) ...
    stoneNameInput.value = stoneData.name;
    stoneVirtuesInput.value = stoneData.virtues;
    stonePurificationInput.value = stoneData.purification || '';
    stoneRechargeInput.value = stoneData.recharge || '';

    jewelryCheckboxesContainer.querySelectorAll('input[name="jewelry-type"]').forEach(checkbox => {
      checkbox.checked = stoneData.jewelryTypes?.includes(checkbox.value) || false;
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
    editingStoneId = String(stoneData.id); // <-- Assurer que c'est une string

    activateTab(document.querySelector('.tab-link[data-tab="tab-add-stone"]'));
    stoneNameInput.focus();
  }

  function resetForm() {
    // ... (inchangé) ...
    addStoneForm.reset();
    jewelryCheckboxesContainer.querySelectorAll('input[name="jewelry-type"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    resetImagePreview();
    submitButton.textContent = 'Ajouter la pierre';
    isEditing = false;
    editingStoneId = null;
    currentImageBase64 = null;
  }

  /** Gère la soumission du formulaire (appel API). */
  async function handleFormSubmit(event) { // <-- Ajout de async
    event.preventDefault();
    if (!currentChakraId) {
      alert("Veuillez d'abord sélectionner un chakra.");
      return;
    }

    const stoneName = stoneNameInput.value.trim();
    const stoneVirtues = stoneVirtuesInput.value.trim();

    if (stoneName === "" || stoneVirtues === "") {
      alert("Le nom et les vertus de la pierre sont requis.");
      return;
    }

    const selectedJewelryTypes = Array.from(
        jewelryCheckboxesContainer.querySelectorAll('input[name="jewelry-type"]:checked')
    ).map(cb => cb.value);

    // Prépare les données pour l'API. L'ID est inclus SEULEMENT si on modifie.
    const stoneDataForBackend = {
        name: stoneName,
        virtues: stoneVirtues,
        purification: stonePurificationInput.value.trim(),
        recharge: stoneRechargeInput.value.trim(),
        jewelryTypes: selectedJewelryTypes,
        image: currentImageBase64, // L'image base64
        ...(isEditing && { id: editingStoneId }) // Ajoute l'id uniquement en mode édition
    };

    // Désactiver le bouton pendant l'appel API
    submitButton.disabled = true;
    submitButton.textContent = isEditing ? 'Modification...' : 'Ajout...';

    // Appel à la nouvelle fonction backend
    const savedStone = await addOrUpdateStoneBackend(currentChakraId, stoneDataForBackend);

    // Réactiver le bouton
    submitButton.disabled = false;
    submitButton.textContent = isEditing ? 'Modifier la pierre' : 'Ajouter la pierre';


    if (savedStone && savedStone.id) { // Vérifier si l'opération a réussi et qu'on a un ID
      // --- Mise à jour de l'état local (allStonesData) ---
      if (!allStonesData[currentChakraId]) {
        allStonesData[currentChakraId] = [];
      }
      const stoneIndex = allStonesData[currentChakraId].findIndex(s => s.id === savedStone.id);

      if (stoneIndex !== -1) {
        // Mise à jour dans le tableau local
        allStonesData[currentChakraId][stoneIndex] = savedStone;
        console.log("État local mis à jour (modification):", allStonesData);
      } else {
        // Ajout dans le tableau local
        allStonesData[currentChakraId].push(savedStone);
         console.log("État local mis à jour (ajout):", allStonesData);
      }
      // --- Fin mise à jour état local ---

      // Mettre à jour l'affichage de la liste
      if (isEditing) {
        updateStoneInDisplayList(savedStone);
      } else {
        addStoneToDisplayList(savedStone);
      }

      // Réinitialiser le formulaire et revenir à l'onglet des pierres
      resetForm();
      activateTab(document.querySelector('.tab-link[data-tab="tab-my-stones"]'));

    } else {
      // L'erreur a déjà été signalée par addOrUpdateStoneBackend via une alerte
      console.error("La sauvegarde via le backend a échoué ou n'a pas retourné de données valides.");
    }
  }

  // ==========================================================================
  // GESTION DE L'UPLOAD D'IMAGE (inchangé)
  // ==========================================================================
  function handleFileSelect(file) { /* ... (code inchangé) ... */
        if (!file || !file.type.startsWith('image/')) {
            resetImagePreview();
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = new Image();
          img.onload = function() {
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > IMAGE_MAX_WIDTH) {
                height = Math.round(height * IMAGE_MAX_WIDTH / width);
                width = IMAGE_MAX_WIDTH;
              }
            } else {
              if (height > IMAGE_MAX_HEIGHT) {
                width = Math.round(width * IMAGE_MAX_HEIGHT / height);
                height = IMAGE_MAX_HEIGHT;
              }
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
            alert("Le fichier sélectionné ne semble pas être une image valide ou est corrompu.");
            resetImagePreview();
          }
          img.src = e.target.result;
        }
        reader.onerror = function() {
          console.error("Erreur de lecture du fichier.");
          alert("Une erreur s'est produite lors de la lecture du fichier.");
          resetImagePreview();
        }
        reader.readAsDataURL(file);
  }
  function resetImagePreview() { /* ... (code inchangé) ... */
    imageInput.value = null;
    imagePreview.src = '#';
    imagePreview.style.display = 'none';
    imageDropZone.classList.remove('has-image');
    removeImageBtn.style.display = 'none';
    currentImageBase64 = null;
  }
  // --- Écouteurs d'événements pour l'image --- (inchangés)
  imageDropZone.addEventListener('click', (e) => { /* ... */ if (e.target !== removeImageBtn) { imageInput.click(); } });
  imageInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
  removeImageBtn.addEventListener('click', (e) => { /* ... */ e.preventDefault(); e.stopPropagation(); resetImagePreview(); });
  imageDropZone.addEventListener('dragover', (e) => { /* ... */ e.preventDefault(); imageDropZone.classList.add('drag-over'); });
  imageDropZone.addEventListener('dragleave', () => imageDropZone.classList.remove('drag-over'));
  imageDropZone.addEventListener('drop', (e) => { /* ... */ e.preventDefault(); imageDropZone.classList.remove('drag-over'); if (e.dataTransfer.files.length > 0) { handleFileSelect(e.dataTransfer.files[0]); } });


  // ==========================================================================
  // GESTION DE LA MODALE DE CONFIRMATION (peu de changements, sauf bouton confirmer)
  // ==========================================================================
  function showConfirmationModal() { /* ... (inchangé) ... */
    confirmationModal.style.display = 'flex';
    confirmationModal.offsetHeight;
    confirmationModal.classList.add('visible');
    confirmDeleteBtn.focus();
  }
  function hideConfirmationModal() { /* ... (inchangé) ... */
    confirmationModal.classList.remove('visible');
    confirmationModal.addEventListener('transitionend', () => {
        confirmationModal.style.display = 'none';
    }, { once: true });
    // Ne réinitialise plus ici, mais après la confirmation/annulation
    // stoneToDeleteId = null;
    // chakraOfStoneToDelete = null;
  }

  // ==========================================================================
  // ÉCOUTEURS D'ÉVÉNEMENTS PRINCIPAUX
  // ==========================================================================

  // Clic sur une pierre chakra SVG (inchangé)
  chakraStonesElements.forEach((stone) => {
    stone.addEventListener("click", () => {
      showPanel(stone.id);
    });
  });

  // Fermeture du panneau (inchangé)
  closePanelButton.addEventListener("click", hidePanel);

  // Navigation par onglets (inchangé)
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab));
  });

  // Clics dans la liste des pierres (modification/suppression)
  stoneList.addEventListener('click', (event) => {
    const target = event.target;
    // Cherche le bouton cliqué, puis remonte au LI parent pour trouver l'ID
    const button = target.closest('.edit-stone-btn, .delete-stone-btn');
    if (!button) return; // Sort si on n'a pas cliqué sur un des boutons

    const listItem = button.closest('li');
    const stoneIdStr = listItem?.getAttribute('data-stone-id'); // Récupère l'ID string

    if (!stoneIdStr) {
        console.error("Impossible de trouver l'ID de la pierre pour l'action.");
        return;
    }

    if (button.classList.contains('delete-stone-btn')) {
      stoneToDeleteId = stoneIdStr; // Stocker l'ID string
      chakraOfStoneToDelete = currentChakraId;
      showConfirmationModal();
    } else if (button.classList.contains('edit-stone-btn')) {
       // Trouver la pierre dans l'état local (allStonesData)
       const stoneToEdit = allStonesData[currentChakraId]?.find(s => String(s.id) === stoneIdStr); // Comparer les strings
       if (stoneToEdit) {
         populateEditForm(stoneToEdit);
       } else {
         console.error("Pierre à modifier non trouvée dans les données locales:", stoneIdStr, allStonesData[currentChakraId]);
         alert("Erreur : Impossible de trouver les données de cette pierre pour la modification.");
       }
    }
  });

  // Boutons de la modale de confirmation
  cancelDeleteBtn.addEventListener('click', () => {
      hideConfirmationModal();
      // Réinitialiser les IDs seulement à l'annulation ou après succès
      stoneToDeleteId = null;
      chakraOfStoneToDelete = null;
  });

  confirmDeleteBtn.addEventListener('click', async () => { // <-- Ajout de async
    if (stoneToDeleteId && chakraOfStoneToDelete) {

      // Désactiver bouton pendant l'appel
      confirmDeleteBtn.disabled = true;
      cancelDeleteBtn.disabled = true;

      const success = await deleteStoneBackend(stoneToDeleteId); // Appelle le backend

      // Réactiver boutons
       confirmDeleteBtn.disabled = false;
       cancelDeleteBtn.disabled = false;

      if (success) {
        // --- Mise à jour de l'état local (allStonesData) ---
        if (allStonesData[chakraOfStoneToDelete]) {
           const initialLength = allStonesData[chakraOfStoneToDelete].length;
           // Filtre basé sur l'ID string
           allStonesData[chakraOfStoneToDelete] = allStonesData[chakraOfStoneToDelete].filter(
               (stone) => String(stone.id) !== stoneToDeleteId
           );
           if (allStonesData[chakraOfStoneToDelete].length < initialLength) {
                console.log("État local mis à jour (suppression):", allStonesData);
           }
           // Optionnel : nettoyer si le tableau est vide
           if (allStonesData[chakraOfStoneToDelete].length === 0) {
             delete allStonesData[chakraOfStoneToDelete];
           }
        }
        // --- Fin mise à jour état local ---

        // Supprimer l'élément de la liste affichée
        const listItemToDelete = stoneList.querySelector(`li[data-stone-id="${stoneToDeleteId}"]`);
        if (listItemToDelete) {
          listItemToDelete.remove();
        }

        // Vérifier si la liste est maintenant vide et afficher le message
        if (stoneList.children.length === 0) {
          stoneList.innerHTML = initialStoneListMessageHTML;
        }

      } else {
        // L'erreur a déjà été signalée par deleteStoneBackend via une alerte
        console.error("La suppression a échoué côté backend.");
      }
    } else {
      console.error("Erreur : ID de pierre ou chakra manquant pour la suppression.");
    }
    hideConfirmationModal(); // Fermer la modale
    // Réinitialiser les IDs après l'opération
    stoneToDeleteId = null;
    chakraOfStoneToDelete = null;
  });

  // Soumission du formulaire
  addStoneForm.addEventListener("submit", handleFormSubmit); // handleFormSubmit est déjà async

  // ==========================================================================
// INITIALISATION
// ==========================================================================
  confirmationModal.style.display = 'none';
  stoneList.innerHTML = initialStoneListMessageHTML; // Mettre le message initial par défaut

  // Charger les données initiales depuis le backend !
  await loadInitialStones(); // <-- Appel initial pour charger les données

  // ==================== ADMIN/INVITE LOGIN SYSTEM ====================

  // --- Constantes ---
  const ADMIN_ICON_URL = "images/admin.png";
  const GUEST_ICON_URL = "images/guest.png";
  const ADMIN_SESSION_KEY = "isAdminSession";
  const ADMIN_SESSION_TIMESTAMP_KEY = "adminSessionTimestamp";
  const ADMIN_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes en ms

  // --- Sélection DOM ---
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
  const addStoneTabBtn = document.querySelector('.tab-link[data-tab="tab-add-stone"]');

  // --- Etat ---
  let isAdmin = false;
  let adminSessionTimeout = null;

  // --- Fonctions utilitaires ---
  function setAdminMode(active) {
    isAdmin = !!active;
    localStorage.setItem(ADMIN_SESSION_KEY, isAdmin ? "1" : "0");
    if (isAdmin) {
      localStorage.setItem(ADMIN_SESSION_TIMESTAMP_KEY, Date.now().toString());
    } else {
      localStorage.removeItem(ADMIN_SESSION_TIMESTAMP_KEY);
    }
    updateAdminUI();
    if (isAdmin) {
      startAdminSessionTimer();
    } else {
      clearAdminSessionTimer();
    }
  }

  function updateAdminUI() {
    // Icône
    adminLoginImg.src = isAdmin ? ADMIN_ICON_URL : GUEST_ICON_URL;
    adminLoginImg.alt = isAdmin ? "Déconnexion admin" : "Connexion admin";
    // Bouton "Ajouter une pierre"
    if (addStoneTabBtn) {
      addStoneTabBtn.style.display = isAdmin ? "inline-block" : "none";
    }
    // Boutons édition/suppression sur chaque pierre
    document.querySelectorAll('.edit-stone-btn, .delete-stone-btn').forEach(btn => {
      btn.style.display = isAdmin ? "inline-block" : "none";
    });
    // Formulaire d'ajout/modif
    if (!isAdmin && infoPanel.classList.contains("visible")) {
      // Si on est sur l'onglet "ajout/modif" en mode invité, forcer retour à "Mes pierres"
      const activeTab = document.querySelector('.tab-link.active');
      if (activeTab && activeTab.getAttribute("data-tab") === "tab-add-stone") {
        activateTab(document.querySelector('.tab-link[data-tab="tab-my-stones"]'));
      }
    }
  }

  function startAdminSessionTimer() {
    clearAdminSessionTimer();
    const expireIn = getAdminSessionRemaining();
    if (expireIn > 0) {
      adminSessionTimeout = setTimeout(() => {
        setAdminMode(false);
        alert("Session administrateur expirée. Vous êtes repassé en mode invité.");
      }, expireIn);
    }
  }
  function clearAdminSessionTimer() {
    if (adminSessionTimeout) {
      clearTimeout(adminSessionTimeout);
      adminSessionTimeout = null;
    }
  }
  function getAdminSessionRemaining() {
    const ts = parseInt(localStorage.getItem(ADMIN_SESSION_TIMESTAMP_KEY), 10);
    if (!ts) return 0;
    const now = Date.now();
    const expire = ts + ADMIN_SESSION_DURATION;
    return Math.max(0, expire - now);
  }
  function checkAdminSessionValidity() {
    if (localStorage.getItem(ADMIN_SESSION_KEY) === "1") {
      const remaining = getAdminSessionRemaining();
      if (remaining > 0) {
        setAdminMode(true);
        return;
      }
    }
    setAdminMode(false);
  }

  // --- UI: Affichage dynamique des boutons admin sur la liste ---
  function patchStoneListButtons() {
    // Après chaque update de la liste, réappliquer la visibilité
    updateAdminUI();
  }
  // Patch affichage après chaque update de la liste de pierres
  const origDisplayStonesForChakra = displayStonesForChakra;
  displayStonesForChakra = function(chakraId) {
    origDisplayStonesForChakra(chakraId);
    patchStoneListButtons();
  };
  // Patch ajout/modif d'une pierre
  const origAddStoneToDisplayList = addStoneToDisplayList;
  addStoneToDisplayList = function(stoneData) {
    origAddStoneToDisplayList(stoneData);
    patchStoneListButtons();
  };
  const origUpdateStoneInDisplayList = updateStoneInDisplayList;
  updateStoneInDisplayList = function(stoneData) {
    origUpdateStoneInDisplayList(stoneData);
    patchStoneListButtons();
  };

  // --- Empêcher actions admin en mode invité ---
  if (addStoneForm) {
    const origHandleFormSubmit = handleFormSubmit;
    addStoneForm.removeEventListener("submit", handleFormSubmit);
    addStoneForm.addEventListener("submit", function(e) {
      if (!isAdmin) {
        e.preventDefault();
        alert("Seuls les administrateurs peuvent ajouter ou modifier des pierres.");
        return;
      }
      origHandleFormSubmit.call(this, e);
    });
  }
  // Empêche clic sur "ajouter une pierre" tab si non admin
  if (addStoneTabBtn) {
    addStoneTabBtn.addEventListener("click", function(e) {
      if (!isAdmin) {
        e.preventDefault();
        alert("Seuls les administrateurs peuvent ajouter des pierres.");
      }
    });
  }

  // --- Icône admin: gestion clic ---
  adminLoginIcon.addEventListener("click", () => {
    if (isAdmin) {
      adminLogoutModal.style.display = "flex";
      adminLogoutModal.classList.add("visible");
      adminLogoutBtn.focus();
    } else {
      adminLoginModal.style.display = "flex";
      adminLoginModal.classList.add("visible");
      adminPasswordInput.value = "";
      adminLoginError.style.display = "none";
      setTimeout(() => adminPasswordInput.focus(), 100);
    }
  });

  // --- Modale connexion ---
  closeLoginModalBtn.addEventListener("click", closeLoginModal);
  function closeLoginModal() {
    adminLoginModal.classList.remove("visible");
    setTimeout(() => { adminLoginModal.style.display = "none"; }, 200);
    adminPasswordInput.value = "";
    adminLoginError.style.display = "none";
  }
  adminPasswordInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") tryAdminLogin();
  });
  adminLoginBtn.addEventListener("click", tryAdminLogin);
  async function tryAdminLogin() {
    const valeurEntree = adminPasswordInput.value;
    adminLoginError.style.display = "none"; // Cacher l'erreur précédente
    adminLoginError.textContent = "";

    // Afficher un indicateur de chargement (optionnel mais recommandé)
    adminLoginBtn.disabled = true;
    adminLoginBtn.textContent = "Vérification...";

    try {
      const response = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: valeurEntree }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // --- Succès ---
        setAdminMode(true);
        closeLoginModal();
      } else {
        // --- Échec ---
        const errorMessage = result.message || "Mot de passe incorrect.";
        adminLoginError.textContent = errorMessage;
        adminLoginError.style.display = "block";
        adminPasswordInput.value = ""; // Vider le champ pour nouvelle tentative
        adminPasswordInput.focus(); // Remettre le focus sur le champ
      }
    } catch (error) {
      // Gérer les erreurs réseau ou autres erreurs fetch
      console.error("Erreur lors de la tentative de connexion:", error);
      adminLoginError.textContent = "Erreur de communication avec le serveur.";
      adminLoginError.style.display = "block";
    } finally {
        // Rétablir l'état normal du bouton
        adminLoginBtn.disabled = false;
        adminLoginBtn.textContent = "Se connecter";
    }
  }

  // --- Modale logout ---
  closeLogoutModalBtn.addEventListener("click", closeLogoutModal);

  function closeLogoutModal() {
    adminLogoutModal.classList.remove("visible");
    setTimeout(() => { adminLogoutModal.style.display = "none"; }, 200);
  }
  adminLogoutBtn.addEventListener("click", function() {
    setAdminMode(false);
    closeLogoutModal();
  });

  // --- Expiration auto ---
  window.addEventListener("focus", checkAdminSessionValidity);
  setInterval(checkAdminSessionValidity, 60 * 1000); // Vérif toutes les minutes

  // --- Initialisation au chargement ---
  checkAdminSessionValidity();

  // Patch initial sur la liste affichée
  patchStoneListButtons();
});
