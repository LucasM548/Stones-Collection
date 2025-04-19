/**
 * =============================================================================
 * script.js - Logique principale de l'application Harmonie des Chakras
 * =============================================================================
 * Gère l'interaction avec les chakras, l'affichage du panneau d'information,
 * la gestion des pierres (ajout, modification, suppression), l'upload d'images,
 * et le système de connexion administrateur.
 * Utilise des variables CSS pour un style plus dynamique.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // ==========================================================================
  // CONSTANTES ET CONFIGURATION
  // ==========================================================================
  const CHAKRA_NAMES = [
    "root",
    "sacral",
    "solar-plexus",
    "heart",
    "throat",
    "third-eye",
    "crown",
    "secondary",
  ];
  const IMAGE_MAX_WIDTH = 800;
  const IMAGE_MAX_HEIGHT = 800;
  const IMAGE_JPEG_QUALITY = 0.7;
  const ADMIN_ICON_URL = "images/admin.png";
  const GUEST_ICON_URL = "images/guest.png";
  const ADMIN_SESSION_KEY = "isAdminSession";
  const ADMIN_SESSION_TIMESTAMP_KEY = "adminSessionTimestamp";
  const ADMIN_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in ms

  // Détails des chakras pour l'affichage d'informations
  const CHAKRA_DETAILS = {
    "svg-root": {
      nom: "Racine (Muladhara)",
      couleur: "Rouge",
      element: "Terre",
      description:
        "Ancrage, sécurité, survie. Connecté à nos besoins fondamentaux.",
    },
    "svg-sacral": {
      nom: "Sacré (Swadhisthana)",
      couleur: "Orange",
      element: "Eau",
      description:
        "Créativité, émotions, sexualité. Centre de notre plaisir et de notre passion.",
    },
    "svg-solar-plexus": {
      nom: "Plexus Solaire (Manipura)",
      couleur: "Jaune",
      element: "Feu",
      description:
        "Confiance en soi, pouvoir personnel, volonté. Siège de notre identité et de notre force intérieure.",
    },
    "svg-heart": {
      nom: "Cœur (Anahata)",
      couleur: "Vert",
      element: "Air",
      description:
        "Amour, compassion, relations. Pont entre les chakras inférieurs et supérieurs.",
    },
    "svg-throat": {
      nom: "Gorge (Vishuddha)",
      couleur: "Bleu clair",
      element: "Éther/Espace",
      description:
        "Communication, expression de soi, vérité. Capacité à exprimer nos pensées et sentiments.",
    },
    "svg-third-eye": {
      nom: "Troisième Œil (Ajna)",
      couleur: "Indigo",
      element: "Lumière",
      description:
        "Intuition, clairvoyance, sagesse. Centre de notre perception au-delà du monde matériel.",
    },
    "svg-crown": {
      nom: "Couronne (Sahasrara)",
      couleur: "Violet / Blanc",
      element: "Conscience",
      description:
        "Spiritualité, connexion au divin, illumination. Porte vers la conscience universelle.",
    },
    "svg-secondary": {
      nom: "Mains et Pieds",
      couleur: "Noir",
      element: "Éther/Terre",
      description:
        "Connexion à la Terre, Action, Manifestation. Ancrage profond, capacité d'action, manifestation aisée.",
    },
  };

  // Données pour la génération dynamique des cercles SVG
  const chakraCirclesData = [
    { id: "svg-crown", name: "Couronne (Sahasrara)", cy: 235 },
    { id: "svg-third-eye", name: "Troisième Œil (Ajna)", cy: 373 },
    { id: "svg-throat", name: "Gorge (Vishuddha)", cy: 510 },
    { id: "svg-heart", name: "Cœur (Anahata)", cy: 665 },
    { id: "svg-solar-plexus", name: "Plexus Solaire (Manipura)", cy: 819 },
    { id: "svg-sacral", name: "Sacré (Swadhisthana)", cy: 977 },
    { id: "svg-root", name: "Racine (Muladhara)", cy: 1135 },
    { id: "svg-secondary", name: "Mains et Pieds", cy: 1290 },
  ];

  // Attributs communs pour les cercles SVG
  const commonCircleAttrs = {
    cx: "500",
    r: "40",
    class: "chakra-svg-stone",
  };
  const svgNS = "http://www.w3.org/2000/svg";

  // Types de bijoux pour génération dynamique du formulaire
  const JEWELRY_TYPES = [
    "Pierre brute",
    "Pierre Roulée/Taillée",
    "Collier",
    "Bracelet",
    "Bague",
    "Pendentif",
    "Boucles d'oreilles",
    "Autre",
  ];
  const DEFAULT_QUANTITY_PLACEHOLDER = "1"; // Placeholder quand la case est cochée

  // ==========================================================================
  // SÉLECTION DES ÉLÉMENTS DU DOM
  // ==========================================================================
  const svgElement = document.getElementById("chakra-svg");
  const infoPanel = document.getElementById("info-panel");
  const panelChakraName = document.getElementById("panel-chakra-name");
  const closePanelButton = document.getElementById("close-panel");
  const tabs = document.querySelectorAll(".tab-link");
  const tabContents = document.querySelectorAll(".tab-content");
  const generalInfoTabContent = document.getElementById("tab-general");
  const addStoneTabBtn = document.querySelector(
    '.tab-link[data-tab="tab-add-stone"]'
  );
  const stoneList = document.getElementById("stone-list");
  const addStoneForm = document.getElementById("add-stone-form");
  const stoneNameInput = document.getElementById("stone-name");
  const stoneVirtuesInput = document.getElementById("stone-virtues");
  const stonePurificationInput = document.getElementById("stone-purification");
  const stoneRechargeInput = document.getElementById("stone-recharge");
  const jewelryCheckboxesContainer =
    document.getElementById("jewelry-type-group");
  const submitButton = addStoneForm.querySelector('button[type="submit"]');
  const imageInput = document.getElementById("stoneImageInput");
  const imageDropZone = document.getElementById("imageDropZone");
  const imagePreview = document.getElementById("imagePreview");
  const removeImageBtn = document.getElementById("removeImageBtn");
  const dropZonePrompt = document.querySelector(".drop-zone-prompt");
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
  const initialStoneListMessageHTML = `<li><em>${escapeHTML(
    "Aucune pierre ajoutée pour ce chakra."
  )}</em></li>`;

  // ==========================================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================================

  /** Échappe les caractères HTML potentiellement dangereux */
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /** Normalise une chaîne pour l'utiliser dans des attributs (remplace espaces, slashs, etc.) */
  function normalizeStringType(type) {
    return type.replace(/[\s\/']/g, "_");
  }

  /** Supprime toutes les classes de couleur de chakra d'un élément (si utilisées). */
  function removeChakraColorClasses(element) {
    element.classList.remove(
      ...CHAKRA_NAMES.map((name) => `chakra-active-color-${name}`)
    );
  }

  /** Affiche un message temporaire (toast) - Basique, peut être stylisé via CSS */
  function showToast(message, type = "info") {
    // type peut être 'info', 'success', 'error', 'warning'
    console.log(`[${type.toUpperCase()}] Toast: ${message}`);
    // Implémentation simple avec alert, peut être remplacé par une UI de toast plus sophistiquée
    alert(`[${type.toUpperCase()}] ${message}`);
  }

  // ==========================================================================
  // GÉNÉRATION DYNAMIQUE DES ÉLÉMENTS UI
  // ==========================================================================

  /** Crée les cercles SVG des chakras dynamiquement */
  function createSVGCircles() {
    chakraCirclesData.forEach((chakra) => {
      const circle = document.createElementNS(svgNS, "circle");
      const chakraNameSuffix = chakra.id.replace("svg-", "");
      const chakraColorVarName = `--chakra-color-${chakraNameSuffix}`;
      const chakraColor = getComputedStyle(document.documentElement)
        .getPropertyValue(chakraColorVarName)
        .trim();

      circle.setAttributeNS(null, "id", chakra.id);
      circle.setAttributeNS(null, "class", commonCircleAttrs.class);
      circle.setAttributeNS(null, "data-chakra-name", chakra.name); // Gardé pour référence potentielle
      circle.setAttributeNS(null, "cx", commonCircleAttrs.cx);
      circle.setAttributeNS(null, "cy", chakra.cy.toString());
      circle.setAttributeNS(null, "r", commonCircleAttrs.r);

      // Définit la variable CSS --stone-color directement sur l'élément cercle
      if (chakraColor) {
        circle.style.setProperty("--stone-color", chakraColor);
      } else {
        console.warn(`Couleur non trouvée pour le chakra ${chakraNameSuffix}`);
      }

      svgElement.appendChild(circle);
    });
  }

  /** Génère les cases à cocher et champs de quantité pour les types de bijoux */
  function generateJewelryCheckboxes() {
    jewelryCheckboxesContainer.innerHTML = ""; // Vide le conteneur

    JEWELRY_TYPES.forEach((type) => {
      const normalizedType = normalizeStringType(type);
      const itemDiv = document.createElement("div");
      itemDiv.className = "jewelry-type-item";

      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "jewelry-type";
      checkbox.value = type;
      checkbox.dataset.type = type; // Utilise data-type pour lier au champ quantité

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${type}`)); // Ajoute l'espace avant le texte

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.dataset.type = type; // Lie ce champ quantité au type via data-type
      quantityInput.name = `quantity_${normalizedType}`; // Nom cohérent si nécessaire
      quantityInput.min = "1";
      quantityInput.disabled = true; // Désactivé par défaut
      quantityInput.placeholder = ""; // Placeholder initialement vide

      itemDiv.appendChild(label);
      itemDiv.appendChild(quantityInput);
      jewelryCheckboxesContainer.appendChild(itemDiv);
    });
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

      // Assure que les IDs sont des strings pour la cohérence
      for (const chakraId in loadedData) {
        if (Array.isArray(loadedData[chakraId])) {
          loadedData[chakraId].forEach((stone) => {
            if (
              stone &&
              stone.id !== undefined &&
              typeof stone.id !== "string"
            ) {
              stone.id = String(stone.id);
            }
          });
        }
      }

      allStonesData = loadedData; // Met à jour l'état global

      // Si un panneau est déjà ouvert, rafraîchir sa liste
      if (currentChakraId) {
        displayStonesForChakra(currentChakraId);
      }
    } catch (error) {
      console.error("Erreur lors du chargement initial des pierres:", error);
      showToast(
        "Impossible de charger les données des pierres. Vérifiez votre connexion ou réessayez plus tard.",
        "error"
      );
      allStonesData = {}; // Assure un état vide en cas d'erreur
    }
  }

  /** Ajoute ou met à jour une pierre via l'API backend. */
  async function addOrUpdateStoneBackend(chakraId, stoneData) {
    const isEditingOperation = !!stoneData.id;
    const stoneIdForURL = stoneData.id;
    const url = isEditingOperation
      ? `./.netlify/functions/stones/${stoneIdForURL}`
      : `./.netlify/functions/stones`;
    const method = isEditingOperation ? "PUT" : "POST";

    const payload = { ...stoneData, chakraId: chakraId };
    // Ne pas envoyer l'ID dans le payload pour une création
    if (!isEditingOperation) {
      delete payload.id;
    } else {
      // Assurer que l'ID n'est pas dans le corps pour PUT si l'API l'attend dans l'URL
      // Si l'API attend aussi l'ID dans le corps pour PUT, ne pas supprimer ici.
      // delete payload.id; // Décommenter si l'API n'attend pas l'ID dans le corps pour PUT
    }

    console.log(`Envoi ${method} vers ${url} avec payload:`, payload);

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Erreur Backend (${response.status}):`, errorBody);
        throw new Error(
          `Erreur HTTP! status: ${response.status}, body: ${errorBody}`
        );
      }

      // Pour PUT, la réponse peut être 200 avec la ressource mise à jour ou 204 No Content
      if (response.status === 204) {
        console.log("Opération PUT réussie (204 No Content).");
        // Retourne les données envoyées (avec l'ID) car le backend n'a rien retourné
        return { ...stoneData };
      }

      const savedStone = await response.json();
      console.log("Pierre sauvegardée via backend:", savedStone);
      // Assurer que l'ID retourné est une string
      if (savedStone && savedStone.id !== undefined) {
        savedStone.id = String(savedStone.id);
      }
      return savedStone;
    } catch (error) {
      console.error(
        `Erreur lors de ${
          isEditingOperation ? "la modification" : "l'ajout"
        } via backend:`,
        error
      );
      showToast(
        `Une erreur est survenue lors de ${
          isEditingOperation ? "la modification" : "l'ajout"
        } de la pierre.`,
        "error"
      );
      return null;
    }
  }

  /** Supprime une pierre via l'API backend. */
  async function deleteStoneBackend(stoneId) {
    console.log(`Tentative de suppression de la pierre ID: ${stoneId}`);
    try {
      const response = await fetch(`./.netlify/functions/stones/${stoneId}`, {
        method: "DELETE",
      });

      // Considérer 200, 202, 204 comme succès, 404 comme déjà supprimé
      if (response.ok || response.status === 204 || response.status === 404) {
        if (response.status === 404) {
          console.warn(
            "Pierre non trouvée pour suppression (ID:",
            stoneId,
            "), peut-être déjà supprimée."
          );
        }
        console.log(
          "Suppression réussie (ou pierre déjà supprimée) pour ID:",
          stoneId
        );
        return true;
      } else {
        // Gérer les autres erreurs
        const errorBody = await response.text();
        console.error(`Erreur Backend (${response.status}):`, errorBody);
        throw new Error(
          `Erreur HTTP! status: ${response.status}, body: ${errorBody}`
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression via backend:", error);
      showToast(
        "Une erreur est survenue lors de la suppression de la pierre.",
        "error"
      );
      return false;
    }
  }

  // ==========================================================================
  // GESTION DU PANNEAU D'INFORMATION
  // ==========================================================================

  /** Affiche le panneau d'information pour un chakra donné */
  function showPanel(chakraId) {
    // Remove .selected from all chakra circles
    document
      .querySelectorAll(".chakra-svg-stone.selected")
      .forEach((el) => el.classList.remove("selected"));
    // Add .selected to the clicked chakra
    const clickedCircle = document.getElementById(chakraId);
    if (clickedCircle) {
      clickedCircle.classList.add("selected");
    }
    currentChakraId = chakraId;
    const chakraData = CHAKRA_DETAILS[chakraId];
    const chakraNameSuffix = chakraId.replace("svg-", ""); // ex: 'root'
    const chakraColorVarName = `--chakra-color-${chakraNameSuffix}`; // ex: '--chakra-color-root'

    // Récupère la couleur calculée du chakra depuis les variables globales
    const activeChakraColor = getComputedStyle(document.documentElement)
      .getPropertyValue(chakraColorVarName)
      .trim();

    panelChakraName.textContent = chakraData ? chakraData.nom : "Infos Chakra";

    // Définit la variable CSS --active-chakra-color sur le panneau pour le style dynamique des onglets
    if (activeChakraColor) {
      infoPanel.style.setProperty("--active-chakra-color", activeChakraColor);
    } else {
      // Fallback ou supprimer si la couleur n'est pas trouvée
      infoPanel.style.removeProperty("--active-chakra-color");
      console.warn(`Couleur active non définie pour ${chakraNameSuffix}`);
    }

    // Optionnel: Garder les classes si elles sont utilisées pour autre chose que la couleur de l'onglet actif
    removeChakraColorClasses(infoPanel); // Nettoie les anciennes classes
    if (CHAKRA_NAMES.includes(chakraNameSuffix)) {
      // infoPanel.classList.add(`chakra-active-color-${chakraNameSuffix}`); // Ajouter si nécessaire pour d'autres styles
    }

    // Remplit l'onglet d'informations générales
    if (chakraData) {
      generalInfoTabContent.innerHTML = `
        <h3>${escapeHTML(chakraData.nom)}</h3>
        <p><strong>Couleur:</strong> ${escapeHTML(chakraData.couleur)}</p>
        <p><strong>Élément:</strong> ${escapeHTML(chakraData.element)}</p>
        <p><strong>Description:</strong> ${escapeHTML(
          chakraData.description
        )}</p>
      `;
    } else {
      generalInfoTabContent.innerHTML = `<p>Informations non disponibles pour ce chakra.</p>`;
    }

    displayStonesForChakra(chakraId); // Affiche les pierres pour ce chakra
    activateTab(document.querySelector('.tab-link[data-tab="tab-general"]')); // Active le premier onglet par défaut
    infoPanel.classList.add("visible"); // Rend le panneau visible
    updateAdminUI(); // Met à jour l'UI admin (visibilité boutons/onglets)
  }

  /** Cache le panneau d'information */
  function hidePanel() {
    // Remove .selected from all chakra circles when closing the panel
    document
      .querySelectorAll(".chakra-svg-stone.selected")
      .forEach((el) => el.classList.remove("selected"));
    infoPanel.classList.remove("visible");
    infoPanel.style.removeProperty("--active-chakra-color"); // Efface la variable de couleur active
    // Optionnel: supprimer la classe spécifique au chakra si elle était ajoutée
    // removeChakraColorClasses(infoPanel);
    currentChakraId = null;
    if (isEditing) {
      // Si on fermait pendant une édition, réinitialiser le formulaire
      resetForm();
    }
  }

  /** Active un onglet spécifique dans le panneau */
  function activateTab(selectedTab) {
    if (!selectedTab) return;

    // Vérifie si l'accès à l'onglet "Ajouter" est autorisé (admin requis)
    if (selectedTab === addStoneTabBtn && !isAdmin) {
      showToast("Accès réservé aux administrateurs.", "warning");
      return; // Ne change pas d'onglet
    }

    // Met à jour les classes active pour les boutons et les contenus d'onglet
    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    selectedTab.classList.add("active");
    const targetTabContentId = selectedTab.getAttribute("data-tab");
    const targetTabContent = document.getElementById(targetTabContentId);
    if (targetTabContent) {
      targetTabContent.classList.add("active");
    }

    // Si on active l'onglet d'ajout et qu'on n'est pas en mode édition, vider le formulaire
    if (targetTabContentId === "tab-add-stone" && !isEditing) {
      resetForm();
    }
  }

  // ==========================================================================
  // GESTION DES PIERRES (Affichage)
  // ==========================================================================

  /** Génère le contenu HTML pour un élément de la liste de pierres */
  function generateStoneListItemHTML(stoneData) {
    const stoneIdString = String(stoneData.id); // Assure que l'ID est une string

    // Formatte l'affichage des types de bijoux et quantités
    const jewelryDisplay =
      Array.isArray(stoneData.jewelryTypes) && stoneData.jewelryTypes.length > 0
        ? stoneData.jewelryTypes
            .map(
              (item) =>
                `${escapeHTML(item.type)}${
                  item.quantity > 1 ? ` (x${item.quantity})` : ""
                }`
            )
            .join(", ")
        : "Non spécifié";

    // Gère les valeurs potentiellement nulles pour purification/recharge
    const purificationDisplay = stoneData.purification
      ? escapeHTML(stoneData.purification)
      : "Non spécifié";
    const rechargeDisplay = stoneData.recharge
      ? escapeHTML(stoneData.recharge)
      : "Non spécifié";

    // Inclut l'image si elle existe et est valide
    const imageHTML =
      stoneData.image &&
      typeof stoneData.image === "string" &&
      stoneData.image.startsWith("data:image")
        ? `<img src="${stoneData.image}" alt="${escapeHTML(
            stoneData.name
          )}" class="stone-list-image">`
        : '<span class="stone-list-image-placeholder"></span>'; // Placeholder si pas d'image

    // Conditionne l'affichage des boutons admin
    const buttonStyle = isAdmin ? "" : 'style="display:none;"';

    // Construit le HTML final
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
          <button class="edit-stone-btn" data-stone-id="${stoneIdString}" aria-label="Modifier ${escapeHTML(
      stoneData.name
    )}" ${buttonStyle} title="Modifier">✎</button>
          <button class="delete-stone-btn" data-stone-id="${stoneIdString}" aria-label="Supprimer ${escapeHTML(
      stoneData.name
    )}" ${buttonStyle} title="Supprimer">×</button>
        </div>
      `;
  }

  /** Affiche les pierres pour le chakra actuellement sélectionné */
  function displayStonesForChakra(chakraId) {
    const stonesForCurrentChakra = (allStonesData[chakraId] || []).filter(
      (stone) =>
        stone &&
        typeof stone === "object" &&
        stone.id !== undefined &&
        stone.id !== null
    ); // Filtre les données invalides

    stoneList.innerHTML = ""; // Vide la liste précédente

    if (stonesForCurrentChakra.length === 0) {
      stoneList.innerHTML = initialStoneListMessageHTML; // Affiche message si vide
    } else {
      const chakraName = chakraId.replace("svg-", ""); // ex: 'root'
      const chakraColorVarName = `--chakra-color-${chakraName}`;
      const itemChakraColor = getComputedStyle(document.documentElement)
        .getPropertyValue(chakraColorVarName)
        .trim();

      stonesForCurrentChakra.forEach((stone) => {
        const listItem = document.createElement("li");
        listItem.setAttribute("data-stone-id", String(stone.id));
        // Définit la variable CSS --item-chakra-color pour la bordure dynamique
        if (itemChakraColor) {
          listItem.style.setProperty("--item-chakra-color", itemChakraColor);
        }
        listItem.innerHTML = generateStoneListItemHTML(stone); // Génère le contenu
        stoneList.appendChild(listItem); // Ajoute à la liste
      });
      updateAdminUI(); // Assure que les boutons edit/delete sont visibles si admin
    }
  }

  /** Ajoute un nouvel élément pierre à la liste affichée */
  function addStoneToDisplayList(chakraId, stoneData) {
    if (!stoneData || stoneData.id === undefined || stoneData.id === null) {
      console.error(
        "Impossible d'ajouter à la liste : données de pierre invalides",
        stoneData
      );
      return;
    }

    // Enlève le message "aucune pierre" s'il est présent
    const initialMessageElement = stoneList.querySelector("li em");
    if (
      initialMessageElement &&
      initialMessageElement.textContent.includes("Aucune pierre ajoutée")
    ) {
      stoneList.innerHTML = "";
    }

    const listItem = document.createElement("li");
    const chakraName = chakraId.replace("svg-", "");
    const chakraColorVarName = `--chakra-color-${chakraName}`;
    const itemChakraColor = getComputedStyle(document.documentElement)
      .getPropertyValue(chakraColorVarName)
      .trim();

    listItem.setAttribute("data-stone-id", String(stoneData.id));
    // Définit la variable CSS --item-chakra-color pour la bordure dynamique
    if (itemChakraColor) {
      listItem.style.setProperty("--item-chakra-color", itemChakraColor);
    }
    listItem.innerHTML = generateStoneListItemHTML(stoneData);
    stoneList.appendChild(listItem);
    updateAdminUI(); // Met à jour la visibilité des boutons
  }

  /** Met à jour un élément pierre existant dans la liste affichée */
  function updateStoneInDisplayList(chakraId, stoneData) {
    if (!stoneData || stoneData.id === undefined || stoneData.id === null) {
      console.error(
        "Impossible de mettre à jour la liste : données de pierre invalides",
        stoneData
      );
      return;
    }
    const stoneIdString = String(stoneData.id);
    const listItem = stoneList.querySelector(
      `li[data-stone-id="${stoneIdString}"]`
    );

    if (listItem) {
      const chakraName = chakraId.replace("svg-", "");
      const chakraColorVarName = `--chakra-color-${chakraName}`;
      const itemChakraColor = getComputedStyle(document.documentElement)
        .getPropertyValue(chakraColorVarName)
        .trim();
      // Met à jour la variable CSS --item-chakra-color
      if (itemChakraColor) {
        listItem.style.setProperty("--item-chakra-color", itemChakraColor);
      }
      listItem.innerHTML = generateStoneListItemHTML(stoneData); // Regénère le contenu
      updateAdminUI(); // Met à jour la visibilité des boutons
    } else {
      console.warn(
        "Élément de liste non trouvé pour mise à jour, ID:",
        stoneIdString
      );
      // Optionnel: Appeler displayStonesForChakra pour reconstruire toute la liste
      // displayStonesForChakra(chakraId);
    }
  }

  // ==========================================================================
  // GESTION DU FORMULAIRE D'AJOUT/MODIFICATION
  // ==========================================================================

  /** Remplit le formulaire avec les données d'une pierre pour l'édition */
  function populateEditForm(stoneData) {
    stoneNameInput.value = stoneData.name;
    stoneVirtuesInput.value = stoneData.virtues;
    stonePurificationInput.value = stoneData.purification || "";
    stoneRechargeInput.value = stoneData.recharge || "";

    resetJewelryCheckboxesAndQuantities(); // Réinitialise d'abord

    // Coche les cases et remplit les quantités correspondantes
    stoneData.jewelryTypes?.forEach((item) => {
      if (item && typeof item.type === "string") {
        const checkbox = jewelryCheckboxesContainer.querySelector(
          `input[type="checkbox"][data-type="${item.type}"]`
        );
        if (checkbox) {
          checkbox.checked = true;
          const quantityInput = jewelryCheckboxesContainer.querySelector(
            `input[type="number"][data-type="${item.type}"]`
          );
          if (quantityInput) {
            quantityInput.disabled = false;
            // Affiche la quantité seulement si elle est supérieure à 1
            quantityInput.value = item.quantity > 1 ? item.quantity : "";
            quantityInput.placeholder = DEFAULT_QUANTITY_PLACEHOLDER; // Met '1' en placeholder
          }
        } else {
          console.warn(`Checkbox non trouvée pour le type: ${item.type}`);
        }
      } else {
        console.warn(
          "Item de type de bijou malformé ignoré lors de la modification:",
          item
        );
      }
    });

    // Gère l'affichage de l'image existante
    if (
      stoneData.image &&
      typeof stoneData.image === "string" &&
      stoneData.image.startsWith("data:image")
    ) {
      imagePreview.src = stoneData.image;
      imagePreview.style.display = "block";
      imageDropZone.classList.add("has-image");
      removeImageBtn.style.display = "inline-block";
      currentImageBase64 = stoneData.image; // Stocke l'image actuelle
    } else {
      resetImagePreview(); // Efface si pas d'image
    }

    // Met à jour l'état pour l'édition
    submitButton.textContent = "Modifier la pierre";
    isEditing = true;
    editingStoneId = String(stoneData.id); // Stocke l'ID de la pierre en cours d'édition

    activateTab(addStoneTabBtn); // Active l'onglet d'ajout/modif
    stoneNameInput.focus(); // Met le focus sur le nom
  }

  /** Réinitialise les cases à cocher et champs de quantité des bijoux */
  function resetJewelryCheckboxesAndQuantities() {
    jewelryCheckboxesContainer
      .querySelectorAll('input[type="checkbox"][name="jewelry-type"]')
      .forEach((checkbox) => {
        checkbox.checked = false;
        const type = checkbox.dataset.type;
        const quantityInput = jewelryCheckboxesContainer.querySelector(
          `input[type="number"][data-type="${type}"]`
        );
        if (quantityInput) {
          quantityInput.value = "";
          quantityInput.placeholder = "";
          quantityInput.disabled = true;
        }
      });
  }

  /** Réinitialise complètement le formulaire */
  function resetForm() {
    addStoneForm.reset(); // Réinitialise les champs input/textarea standards
    resetJewelryCheckboxesAndQuantities(); // Réinitialise spécifiquement les bijoux
    resetImagePreview(); // Réinitialise la prévisualisation d'image
    submitButton.textContent = "Ajouter la pierre"; // Texte par défaut du bouton
    isEditing = false; // Sort du mode édition
    editingStoneId = null; // Efface l'ID en cours d'édition
    currentImageBase64 = null; // Efface l'image en mémoire
  }

  /** Gère la soumission du formulaire (ajout ou modification) */
  async function handleFormSubmit(event) {
    event.preventDefault(); // Empêche la soumission HTML classique

    // Vérifications admin et chakra sélectionné
    if (!isAdmin) {
      showToast("Action réservée aux administrateurs.", "error");
      return;
    }
    if (!currentChakraId) {
      showToast("Veuillez d'abord sélectionner un chakra.", "warning");
      return;
    }

    // Récupère les valeurs des champs simples
    const stoneName = stoneNameInput.value.trim();
    const stoneVirtues = stoneVirtuesInput.value.trim();

    // Récupère les types de bijoux cochés et leurs quantités
    const jewelryTypesWithQuantities = Array.from(
      jewelryCheckboxesContainer.querySelectorAll(
        'input[type="checkbox"][name="jewelry-type"]:checked'
      )
    ).map((checkbox) => {
      const type = checkbox.dataset.type; // Utilise data-type pour récupérer le nom
      const quantityInput = jewelryCheckboxesContainer.querySelector(
        `input[type="number"][data-type="${type}"]`
      );
      let quantity = 1; // Quantité par défaut si cochée
      if (quantityInput) {
        const parsedValue = parseInt(quantityInput.value, 10);
        // Utilise la valeur saisie si elle est valide (>= 1)
        if (!isNaN(parsedValue) && parsedValue >= 1) {
          quantity = parsedValue;
        }
      }
      return { type: type, quantity: quantity };
    });

    // Construit l'objet de données à envoyer au backend
    const stoneDataForBackend = {
      name: stoneName,
      virtues: stoneVirtues,
      purification: stonePurificationInput.value.trim() || null, // Envoie null si vide
      recharge: stoneRechargeInput.value.trim() || null, // Envoie null si vide
      jewelryTypes: jewelryTypesWithQuantities,
      image: currentImageBase64, // Image encodée en Base64 ou null
      // Ajoute l'ID seulement si on est en mode édition
      ...(isEditing && { id: editingStoneId }),
    };

    // Désactive le bouton et change le texte pendant l'opération
    submitButton.disabled = true;
    submitButton.textContent = isEditing ? "Modification..." : "Ajout...";

    // Appelle la fonction backend pour sauvegarder
    const savedStone = await addOrUpdateStoneBackend(
      currentChakraId,
      stoneDataForBackend
    );

    submitButton.disabled = false; // Réactive le bouton

    // Si la sauvegarde a réussi et retourné une pierre valide
    if (savedStone && savedStone.id) {
      // Met à jour l'état local (allStonesData)
      if (!allStonesData[currentChakraId]) {
        allStonesData[currentChakraId] = []; // Initialise si c'est la première pierre pour ce chakra
      }
      const stoneIndex = allStonesData[currentChakraId].findIndex(
        (s) => String(s.id) === String(savedStone.id)
      );

      if (stoneIndex !== -1) {
        // Modification: remplace dans le tableau local
        allStonesData[currentChakraId][stoneIndex] = savedStone;
        console.log("État local mis à jour (modification):", allStonesData);
        updateStoneInDisplayList(currentChakraId, savedStone); // Met à jour l'affichage
      } else {
        // Ajout: ajoute au tableau local
        allStonesData[currentChakraId].push(savedStone);
        console.log("État local mis à jour (ajout):", allStonesData);
        addStoneToDisplayList(currentChakraId, savedStone); // Ajoute à l'affichage
      }

      resetForm(); // Réinitialise le formulaire
      // Change d'onglet pour montrer la liste mise à jour
      activateTab(
        document.querySelector('.tab-link[data-tab="tab-my-stones"]')
      );
    } else {
      // Si la sauvegarde a échoué
      console.error(
        "La sauvegarde via le backend a échoué ou n'a pas retourné de données valides."
      );
      // Rétablit le texte du bouton approprié
      submitButton.textContent = isEditing
        ? "Modifier la pierre"
        : "Ajouter la pierre";
      // Un message d'erreur a normalement déjà été affiché par addOrUpdateStoneBackend
    }
  }

  // ==========================================================================
  // GESTION DE L'UPLOAD D'IMAGE
  // ==========================================================================

  /** Traite le fichier image sélectionné ou déposé */
  function handleFileSelect(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Veuillez sélectionner un fichier image.", "warning");
      resetImagePreview();
      return;
    }
    const reader = new FileReader();

    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        // Calcul des nouvelles dimensions pour redimensionnement (si nécessaire)
        let width = img.width;
        let height = img.height;
        const ratio = width / height;

        if (width > IMAGE_MAX_WIDTH || height > IMAGE_MAX_HEIGHT) {
          if (width > height) {
            // Image paysage
            width = IMAGE_MAX_WIDTH;
            height = width / ratio;
          } else {
            // Image portrait ou carrée
            height = IMAGE_MAX_HEIGHT;
            width = height * ratio;
          }
          width = Math.round(width);
          height = Math.round(height);
          console.log(`Image redimensionnée à ${width}x${height}`);
        }

        // Dessine l'image redimensionnée sur un canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convertit le canvas en Base64 JPEG avec la qualité définie
        const resizedBase64 = canvas.toDataURL(
          "image/jpeg",
          IMAGE_JPEG_QUALITY
        );

        // Met à jour l'aperçu et stocke l'image encodée
        imagePreview.src = resizedBase64;
        imagePreview.style.display = "block";
        imageDropZone.classList.add("has-image");
        removeImageBtn.style.display = "inline-block";
        dropZonePrompt.style.display = "none"; // Cache le texte d'invite
        currentImageBase64 = resizedBase64;
      };
      img.onerror = function () {
        console.error(
          "Erreur de chargement de l'image pour redimensionnement."
        );
        showToast(
          "Le fichier sélectionné ne semble pas être une image valide.",
          "error"
        );
        resetImagePreview();
      };
      img.src = e.target.result; // Charge l'image source dans l'objet Image
    };
    reader.onerror = function () {
      console.error("Erreur de lecture du fichier.");
      showToast("Erreur lors de la lecture du fichier.", "error");
      resetImagePreview();
    };
    reader.readAsDataURL(file); // Lit le fichier comme Data URL (Base64)
  }

  /** Réinitialise la zone d'aperçu de l'image */
  function resetImagePreview() {
    imageInput.value = null; // Efface la sélection de fichier
    imagePreview.src = "#"; // Source vide ou placeholder
    imagePreview.style.display = "none"; // Cache l'aperçu
    imageDropZone.classList.remove("has-image"); // Enlève la classe d'état
    removeImageBtn.style.display = "none"; // Cache le bouton de suppression
    dropZonePrompt.style.display = "block"; // Réaffiche le texte d'invite
    currentImageBase64 = null; // Efface l'image stockée
  }

  // ==========================================================================
  // GESTION DE LA MODALE DE CONFIRMATION DE SUPPRESSION
  // ==========================================================================
  function showConfirmationModal(stoneId, chakraId) {
    stoneToDeleteId = stoneId; // Stocke l'ID pour la confirmation
    chakraOfStoneToDelete = chakraId; // Stocke le chakra associé
    confirmationModal.style.display = "flex"; // Affiche l'overlay
    confirmationModal.offsetHeight; // Force un reflow pour l'animation
    confirmationModal.classList.add("visible"); // Déclenche l'animation d'entrée
    confirmDeleteBtn.focus(); // Met le focus sur le bouton confirmer
  }

  function hideConfirmationModal() {
    confirmationModal.classList.remove("visible"); // Déclenche l'animation de sortie
    // Masque l'élément après la fin de la transition CSS
    confirmationModal.addEventListener(
      "transitionend",
      () => {
        if (!confirmationModal.classList.contains("visible")) {
          confirmationModal.style.display = "none";
        }
      },
      { once: true }
    ); // S'assure que l'écouteur ne s'exécute qu'une fois
  }

  // ==========================================================================
  // SYSTÈME DE CONNEXION ADMIN
  // ==========================================================================

  /** Met à jour l'interface utilisateur en fonction du statut admin */
  function updateAdminUI() {
    // Met à jour l'icône et le titre de connexion/déconnexion
    adminLoginImg.src = isAdmin ? ADMIN_ICON_URL : GUEST_ICON_URL;
    adminLoginImg.alt = isAdmin ? "Déconnexion admin" : "Connexion admin";
    adminLoginIcon.title = isAdmin
      ? "Mode Administrateur - Session Active"
      : "Mode Invité (cliquer pour connexion)";

    // Affiche ou cache l'onglet "Ajouter une pierre"
    if (addStoneTabBtn) {
      addStoneTabBtn.style.display = isAdmin ? "inline-block" : "none";
    }

    // Affiche ou cache les boutons Modifier/Supprimer dans la liste des pierres
    stoneList
      .querySelectorAll(".edit-stone-btn, .delete-stone-btn")
      .forEach((btn) => {
        btn.style.display = isAdmin ? "inline-block" : "none";
      });

    // Si l'utilisateur n'est plus admin et que le panneau est ouvert sur l'onglet d'ajout,
    // basculer vers l'onglet "Mes pierres"
    if (!isAdmin && infoPanel.classList.contains("visible")) {
      const activeTab = document.querySelector(".tab-link.active");
      if (activeTab === addStoneTabBtn) {
        activateTab(
          document.querySelector('.tab-link[data-tab="tab-my-stones"]')
        );
      }
    }
  }

  /** Active ou désactive le mode administrateur */
  function setAdminMode(active) {
    const newState = !!active; // Force en booléen
    if (isAdmin === newState) return; // Ne fait rien si l'état ne change pas

    isAdmin = newState;
    localStorage.setItem(ADMIN_SESSION_KEY, isAdmin ? "1" : "0"); // Stocke l'état dans localStorage

    if (isAdmin) {
      // Si admin, enregistre le timestamp et démarre le timer de session
      localStorage.setItem(ADMIN_SESSION_TIMESTAMP_KEY, Date.now().toString());
      startAdminSessionTimer();
    } else {
      // Si non admin, supprime le timestamp et arrête le timer
      localStorage.removeItem(ADMIN_SESSION_TIMESTAMP_KEY);
      clearAdminSessionTimer();
      // Si on se déconnecte en mode édition, réinitialiser le formulaire
      if (isEditing) {
        resetForm();
      }
    }
    updateAdminUI();
  }

  /** Démarre le timer d'expiration de la session admin */
  function startAdminSessionTimer() {
    clearAdminSessionTimer(); // Annule tout timer précédent
    const expireIn = getAdminSessionRemaining(); // Calcule le temps restant
    if (expireIn > 0) {
      console.log(
        `Session admin expire dans ${Math.round(expireIn / 1000 / 60)} minutes.`
      );
      // Définit un timeout pour désactiver le mode admin à l'expiration
      adminSessionTimeout = setTimeout(() => {
        console.log("Session admin expirée.");
        setAdminMode(false);
        showToast(
          "Session administrateur expirée. Vous êtes repassé en mode invité.",
          "info"
        );
      }, expireIn);
    } else if (localStorage.getItem(ADMIN_SESSION_KEY) === "1") {
      // Si la session est marquée comme active mais déjà expirée au démarrage
      console.log("Session admin déjà expirée au démarrage du timer.");
      setAdminMode(false);
    }
  }

  /** Annule le timer d'expiration de session */
  function clearAdminSessionTimer() {
    if (adminSessionTimeout) {
      clearTimeout(adminSessionTimeout);
      adminSessionTimeout = null;
    }
  }

  /** Calcule le temps restant (en ms) avant l'expiration de la session admin */
  function getAdminSessionRemaining() {
    const timestamp = parseInt(
      localStorage.getItem(ADMIN_SESSION_TIMESTAMP_KEY),
      10
    );
    if (!timestamp) return 0; // Pas de session active
    const now = Date.now();
    const expiryTime = timestamp + ADMIN_SESSION_DURATION;
    return Math.max(0, expiryTime - now); // Retourne 0 si expiré
  }

  /** Vérifie la validité de la session admin (appelée périodiquement et au focus) */
  function checkAdminSessionValidity() {
    if (localStorage.getItem(ADMIN_SESSION_KEY) === "1") {
      // Si marqué comme admin
      if (getAdminSessionRemaining() > 0) {
        // Et si le temps n'est pas écoulé
        setAdminMode(true);
        return;
      }
    }
    setAdminMode(false);
  }

  /** Ferme la modale de connexion */
  function closeLoginModal() {
    adminPasswordInput.value = ""; // Vide le champ mot de passe
    adminLoginError.textContent = ""; // Efface les messages d'erreur
    adminLoginError.style.display = "none";
    adminLoginModal.classList.remove("visible"); // Lance l'animation de fermeture
    adminLoginModal.addEventListener(
      "transitionend",
      () => {
        // Cache après l'animation
        if (!adminLoginModal.classList.contains("visible")) {
          adminLoginModal.style.display = "none";
        }
      },
      { once: true }
    );
  }

  /** Ferme la modale de déconnexion */
  function closeLogoutModal() {
    adminLogoutModal.classList.remove("visible"); // Lance l'animation de fermeture
    adminLogoutModal.addEventListener(
      "transitionend",
      () => {
        // Cache après l'animation
        if (!adminLogoutModal.classList.contains("visible")) {
          adminLogoutModal.style.display = "none";
        }
      },
      { once: true }
    );
  }

  /** Tente de se connecter en tant qu'admin via l'API */
  async function tryAdminLogin() {
    const password = adminPasswordInput.value;
    if (!password) {
      adminLoginError.textContent = "Veuillez entrer un mot de passe.";
      adminLoginError.style.display = "block";
      return;
    }

    adminLoginError.style.display = "none"; // Cache l'erreur précédente
    adminLoginBtn.disabled = true; // Désactive le bouton
    adminLoginBtn.textContent = "Vérification...";

    try {
      // Appelle la fonction Netlify de connexion
      const response = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password }),
      });

      const result = await response.json(); // Récupère la réponse JSON

      if (response.ok && result.success) {
        // Si succès
        setAdminMode(true); // Active le mode admin
        closeLoginModal(); // Ferme la modale
        adminLoginModal.style.display = "none"; // Cache immédiatement si besoin
      } else {
        // Si échec
        const errorMessage = result.message || "Mot de passe incorrect.";
        adminLoginError.textContent = errorMessage; // Affiche l'erreur
        adminLoginError.style.display = "block";
        adminPasswordInput.value = ""; // Vide le champ
        adminPasswordInput.focus(); // Remet le focus
      }
    } catch (error) {
      // Si erreur de communication
      console.error("Erreur lors de la tentative de connexion:", error);
      adminLoginError.textContent = "Erreur de communication avec le serveur.";
      adminLoginError.style.display = "block";
    } finally {
      // Dans tous les cas
      adminLoginBtn.disabled = false; // Réactive le bouton
      adminLoginBtn.textContent = "Se connecter"; // Rétablit le texte
    }
  }

  // ==========================================================================
  // ÉCOUTEURS D'ÉVÉNEMENTS PRINCIPAUX
  // ==========================================================================

  // --- Clics sur les cercles chakra (utilise la délégation d'événements sur le SVG) ---
  svgElement.addEventListener("click", (event) => {
    const target = event.target;
    // Vérifie si l'élément cliqué est bien un cercle chakra avec la classe attendue
    if (target.matches(".chakra-svg-stone")) {
      const chakraId = target.id; // Récupère l'ID du cercle (ex: 'svg-root')
      console.log(`Cercle Chakra cliqué : ${chakraId}`);
      showPanel(chakraId); // Affiche le panneau pour ce chakra
    }
  });

  // --- Clic sur le bouton de fermeture du panneau ---
  closePanelButton.addEventListener("click", hidePanel);

  // --- Navigation par onglets dans le panneau ---
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab); // Active l'onglet cliqué
    });
  });

  // --- Clics dans la liste des pierres (Modification / Suppression via délégation) ---
  stoneList.addEventListener("click", (event) => {
    const target = event.target;
    // Trouve le bouton cliqué (edit ou delete) le plus proche
    const button = target.closest(".edit-stone-btn, .delete-stone-btn");

    // Si ce n'est pas un bouton ou si pas admin, ne rien faire
    if (!button || !isAdmin) return;

    // Trouve l'élément <li> parent pour récupérer l'ID de la pierre
    const listItem = button.closest("li");
    const stoneIdStr = listItem?.getAttribute("data-stone-id"); // Récupère l'ID stocké

    // Vérifie que l'ID et le chakra courant sont valides
    if (!stoneIdStr || !currentChakraId) {
      console.error(
        "ID de pierre ou ID de chakra courant manquant pour l'action."
      );
      return;
    }

    // Action en fonction du bouton cliqué
    if (button.classList.contains("delete-stone-btn")) {
      showConfirmationModal(stoneIdStr, currentChakraId); // Ouvre la modale de confirmation
    } else if (button.classList.contains("edit-stone-btn")) {
      // Trouve les données de la pierre dans l'état local
      const stoneToEdit = allStonesData[currentChakraId]?.find(
        (s) => String(s.id) === stoneIdStr
      );
      if (stoneToEdit) {
        populateEditForm(stoneToEdit); // Remplit le formulaire pour édition
      } else {
        // Si la pierre n'est pas trouvée localement (ne devrait pas arriver)
        console.error(
          "Pierre à modifier non trouvée dans les données locales:",
          stoneIdStr
        );
        showToast(
          "Erreur: Impossible de trouver les données de cette pierre.",
          "error"
        );
      }
    }
  });

  // --- Boutons de la modale de confirmation de suppression ---
  cancelDeleteBtn.addEventListener("click", () => {
    hideConfirmationModal(); // Cache la modale
    // Réinitialise les IDs stockés pour la suppression
    stoneToDeleteId = null;
    chakraOfStoneToDelete = null;
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    // Vérifie si les IDs sont bien présents
    if (!stoneToDeleteId || !chakraOfStoneToDelete) {
      console.error(
        "Erreur critique : ID de pierre ou chakra manquant pour la suppression confirmée."
      );
      hideConfirmationModal();
      return;
    }

    // Désactive les boutons pendant l'opération
    confirmDeleteBtn.disabled = true;
    cancelDeleteBtn.disabled = true;

    // Appelle le backend pour supprimer
    const success = await deleteStoneBackend(stoneToDeleteId);

    // Réactive les boutons
    confirmDeleteBtn.disabled = false;
    cancelDeleteBtn.disabled = false;

    if (success) {
      // Si suppression réussie
      // Met à jour l'état local
      if (allStonesData[chakraOfStoneToDelete]) {
        allStonesData[chakraOfStoneToDelete] = allStonesData[
          chakraOfStoneToDelete
        ].filter((stone) => String(stone.id) !== stoneToDeleteId);
        console.log("État local mis à jour (suppression):", allStonesData);
      }
      // Supprime l'élément de la liste affichée
      const listItemToDelete = stoneList.querySelector(
        `li[data-stone-id="${stoneToDeleteId}"]`
      );
      if (listItemToDelete) listItemToDelete.remove();

      // Si la liste devient vide, affiche le message par défaut
      if (stoneList.children.length === 0) {
        stoneList.innerHTML = initialStoneListMessageHTML;
      }
      // updateAdminUI(); // Pas forcément nécessaire ici car les boutons sont déjà cachés si non admin
    } else {
      // Si la suppression a échoué (message déjà affiché par deleteStoneBackend)
      // showToast("Échec de la suppression de la pierre.", "error");
    }

    hideConfirmationModal(); // Cache la modale
    // Réinitialise les IDs
    stoneToDeleteId = null;
    chakraOfStoneToDelete = null;
  });

  // --- Soumission du formulaire d'ajout/modification ---
  addStoneForm.addEventListener("submit", handleFormSubmit);

  // --- Changement état des cases à cocher de type de bijou ---
  jewelryCheckboxesContainer.addEventListener("change", (event) => {
    // Vérifie si l'élément modifié est une checkbox de type de bijou
    if (event.target.matches('input[type="checkbox"][name="jewelry-type"]')) {
      handleJewelryCheckboxChange(event.target); // Gère l'activation/désactivation du champ quantité
    }
  });

  /** Gère le changement d'état d'une case à cocher de bijou */
  function handleJewelryCheckboxChange(checkbox) {
    const type = checkbox.dataset.type; // Récupère le type depuis data-type
    // Trouve le champ quantité associé via data-type
    const quantityInput = jewelryCheckboxesContainer.querySelector(
      `input[type="number"][data-type="${type}"]`
    );
    if (quantityInput) {
      quantityInput.disabled = !checkbox.checked; // Active/désactive le champ
      if (checkbox.checked) {
        quantityInput.value = ""; // Vide la valeur précédente
        quantityInput.placeholder = DEFAULT_QUANTITY_PLACEHOLDER; // Met '1' en placeholder
      } else {
        quantityInput.value = ""; // Vide la valeur
        quantityInput.placeholder = ""; // Vide le placeholder
      }
    }
  }

  // --- Événements pour l'upload/drop d'image ---
  // Clic sur la zone (sauf bouton supprimer) ouvre le sélecteur de fichier
  imageDropZone.addEventListener("click", (e) => {
    if (
      e.target !== removeImageBtn &&
      !imageDropZone.classList.contains("has-image")
    ) {
      imageInput.click();
    } else if (
      imageDropZone.classList.contains("has-image") &&
      e.target !== removeImageBtn
    ) {
      // Optionnel: Permettre de changer l'image en cliquant dessus ?
      imageInput.click();
    }
  });
  // Changement dans l'input file (sélection classique)
  imageInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });
  // Clic sur le bouton de suppression d'image
  removeImageBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation(); // Empêche le clic de déclencher l'ouverture du sélecteur
    resetImagePreview();
  });
  // Drag & Drop - gestionnaires d'événements
  imageDropZone.addEventListener("dragover", (e) => {
    e.preventDefault(); // Nécessaire pour autoriser le drop
    imageDropZone.classList.add("drag-over"); // Style visuel pendant le survol
  });
  imageDropZone.addEventListener("dragleave", () =>
    imageDropZone.classList.remove("drag-over")
  );
  imageDropZone.addEventListener("drop", (e) => {
    e.preventDefault(); // Empêche le navigateur d'ouvrir le fichier
    imageDropZone.classList.remove("drag-over");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]); // Traite le fichier déposé
      imageInput.value = null; // Efface l'input file au cas où
    }
  });

  // --- Événements pour le système de connexion Admin ---
  // Clic sur l'icône admin/guest
  adminLoginIcon.addEventListener("click", () => {
    if (isAdmin) {
      // Si admin, ouvre la modale de déconnexion
      adminLogoutModal.style.display = "flex";
      adminLogoutModal.offsetHeight; // Reflow
      adminLogoutModal.classList.add("visible");
      adminLogoutBtn.focus();
    } else {
      // Si guest, ouvre la modale de connexion
      adminLoginModal.style.display = "flex";
      adminLoginModal.offsetHeight; // Reflow
      adminLoginModal.classList.add("visible");
      adminPasswordInput.value = "";
      adminLoginError.style.display = "none"; // Cache l'erreur
      // Met le focus sur le champ mdp après une courte pause (pour l'animation)
      setTimeout(() => adminPasswordInput.focus(), 50);
    }
  });

  // Fermeture des modales admin
  closeLoginModalBtn.addEventListener("click", closeLoginModal);
  closeLogoutModalBtn.addEventListener("click", closeLogoutModal);

  // Connexion via touche Entrée dans le champ mot de passe
  adminPasswordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      tryAdminLogin();
    }
  });
  // Connexion via clic sur le bouton
  adminLoginBtn.addEventListener("click", tryAdminLogin);

  // Déconnexion via clic sur le bouton
  adminLogoutBtn.addEventListener("click", () => {
    setAdminMode(false); // Désactive le mode admin
    closeLogoutModal(); // Ferme la modale
  });

  // --- Vérification périodique et au focus de la validité de la session admin ---
  window.addEventListener("focus", checkAdminSessionValidity); // Au retour sur l'onglet
  setInterval(checkAdminSessionValidity, 60 * 1000); // Toutes les minutes

  // ==========================================================================
  // INITIALISATION AU CHARGEMENT DE LA PAGE
  // ==========================================================================
  confirmationModal.style.display = "none"; // Masque les modales initialement
  adminLoginModal.style.display = "none";
  adminLogoutModal.style.display = "none";
  stoneList.innerHTML = initialStoneListMessageHTML; // Message initial dans la liste

  generateJewelryCheckboxes(); // Crée les options de bijoux dans le formulaire
  createSVGCircles(); // Crée les cercles SVG des chakras
  checkAdminSessionValidity(); // Vérifie l'état admin au chargement
  await loadInitialStones(); // Charge les données des pierres depuis le backend
  // updateAdminUI(); // Est appelé dans checkAdminSessionValidity et potentiellement après loadInitialStones->displayStones
}); // Fin de DOMContentLoaded
