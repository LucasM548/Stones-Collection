/**
 * =============================================================================
 * script.js - Logique principale de l'application Harmonie des Chakras
 * =============================================================================
 * Gère l'interaction avec les chakras, l'affichage du panneau d'information,
 * la gestion des pierres (ajout, modification, suppression), l'upload d'images,
 * le système de connexion administrateur, et la liste globale des pierres.
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
  // All Stones Modal DOM Elements
  const allStonesListBtn = document.getElementById("all-stones-list-btn");
  const allStonesModal = document.getElementById("all-stones-modal");
  const closeAllStonesModalBtn = document.getElementById(
    "close-all-stones-modal"
  );
  const allStonesSearchInput = document.getElementById(
    "all-stones-search-input"
  );
  const allStonesGlobalList = document.getElementById("all-stones-global-list");
  const allStonesSortButtons = document.querySelectorAll(
    ".all-stones-sort-options .sort-btn"
  );

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
  let currentSortCriteria = "name"; // 'name' or 'chakra' for allStonesModal

  // ==========================================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================================

  /** Échappe les caractères HTML potentiellement dangereux */
  function escapeHTML(str) {
    if (typeof str !== "string") return ""; // Gérer les cas où str n'est pas une chaîne
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
    console.log(`[${type.toUpperCase()}] Toast: ${message}`);
    alert(`[${type.toUpperCase()}] ${message}`);
  }

  /** Obtient le nom lisible d'un chakra à partir de son ID SVG */
  function getChakraDisplayName(svgChakraId) {
    return CHAKRA_DETAILS[svgChakraId]?.nom || svgChakraId.replace("svg-", "");
  }

  /** Obtient la couleur CSS d'un chakra à partir de son ID SVG */
  function getChakraColorById(svgChakraId) {
    const chakraNameSuffix = svgChakraId.replace("svg-", "");
    const chakraColorVarName = `--chakra-color-${chakraNameSuffix}`;
    return getComputedStyle(document.documentElement)
      .getPropertyValue(chakraColorVarName)
      .trim();
  }

  function isColorLight(color) {
    if (!color || color === "transparent") return false;

    let r, g, b;
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (color.startsWith("rgb")) {
      const match = color.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
      );
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
      } else {
        return false;
      }
    } else {
      const tempDiv = document.createElement("div");
      tempDiv.style.color = color;
      document.body.appendChild(tempDiv);
      const computedColor = getComputedStyle(tempDiv).color;
      document.body.removeChild(tempDiv);

      const match = computedColor.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
      );
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
      } else {
        return false;
      }
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
    const luminance = (r * 299 + g * 587 + b * 114) / 1000;
    return luminance > 150;
  }

  // ==========================================================================
  // GÉNÉRATION DYNAMIQUE DES ÉLÉMENTS UI
  // ==========================================================================

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
      circle.setAttributeNS(null, "data-chakra-name", chakra.name);
      circle.setAttributeNS(null, "cx", commonCircleAttrs.cx);
      circle.setAttributeNS(null, "cy", chakra.cy.toString());
      circle.setAttributeNS(null, "r", commonCircleAttrs.r);

      if (chakraColor) {
        circle.style.setProperty("--stone-color", chakraColor);
      } else {
        console.warn(`Couleur non trouvée pour le chakra ${chakraNameSuffix}`);
      }
      svgElement.appendChild(circle);
    });
  }

  function generateJewelryCheckboxes() {
    jewelryCheckboxesContainer.innerHTML = "";

    JEWELRY_TYPES.forEach((type) => {
      const normalizedType = normalizeStringType(type);
      const itemDiv = document.createElement("div");
      itemDiv.className = "jewelry-type-item";

      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "jewelry-type";
      checkbox.value = type;
      checkbox.dataset.type = type;

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${type}`));

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.dataset.type = type;
      quantityInput.name = `quantity_${normalizedType}`;
      quantityInput.min = "1";
      quantityInput.disabled = true;
      quantityInput.placeholder = "";

      itemDiv.appendChild(label);
      itemDiv.appendChild(quantityInput);
      jewelryCheckboxesContainer.appendChild(itemDiv);
    });
  }

  // ==========================================================================
  // FONCTIONS D'INTERACTION AVEC L'API BACKEND
  // ==========================================================================

  async function loadInitialStones() {
    console.log("Chargement des données initiales depuis le backend...");
    try {
      const response = await fetch("/.netlify/functions/stones");
      if (!response.ok) {
        throw new Error(`Erreur HTTP! status: ${response.status}`);
      }
      const loadedData = await response.json();
      console.log("Données brutes chargées:", loadedData);

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
      allStonesData = loadedData;
      if (currentChakraId) {
        displayStonesForChakra(currentChakraId);
      }
    } catch (error) {
      console.error("Erreur lors du chargement initial des pierres:", error);
      showToast(
        "Impossible de charger les données des pierres. Vérifiez votre connexion ou réessayez plus tard.",
        "error"
      );
      allStonesData = {};
    }
  }

  async function addOrUpdateStoneBackend(chakraId, stoneData) {
    const isEditingOperation = !!stoneData.id;
    const stoneIdForURL = stoneData.id;
    const url = isEditingOperation
      ? `./.netlify/functions/stones/${stoneIdForURL}`
      : `./.netlify/functions/stones`;
    const method = isEditingOperation ? "PUT" : "POST";

    const payload = { ...stoneData, chakraId: chakraId };
    if (!isEditingOperation) {
      delete payload.id;
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
      if (response.status === 204) {
        console.log("Opération PUT réussie (204 No Content).");
        return { ...stoneData };
      }
      const savedStone = await response.json();
      console.log("Pierre sauvegardée via backend:", savedStone);
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

  async function deleteStoneBackend(stoneId) {
    console.log(`Tentative de suppression de la pierre ID: ${stoneId}`);
    try {
      const response = await fetch(`./.netlify/functions/stones/${stoneId}`, {
        method: "DELETE",
      });

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

  function showPanel(chakraId) {
    document
      .querySelectorAll(".chakra-svg-stone.selected")
      .forEach((el) => el.classList.remove("selected"));
    const clickedCircle = document.getElementById(chakraId);
    if (clickedCircle) {
      clickedCircle.classList.add("selected");
    }
    currentChakraId = chakraId;
    const chakraData = CHAKRA_DETAILS[chakraId];
    const chakraNameSuffix = chakraId.replace("svg-", "");
    const chakraColorVarName = `--chakra-color-${chakraNameSuffix}`;

    const activeChakraColor = getComputedStyle(document.documentElement)
      .getPropertyValue(chakraColorVarName)
      .trim();

    panelChakraName.textContent = chakraData ? chakraData.nom : "Infos Chakra";

    if (activeChakraColor) {
      infoPanel.style.setProperty("--active-chakra-color", activeChakraColor);
    } else {
      infoPanel.style.removeProperty("--active-chakra-color");
      console.warn(`Couleur active non définie pour ${chakraNameSuffix}`);
    }

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

    displayStonesForChakra(chakraId);
    activateTab(document.querySelector('.tab-link[data-tab="tab-general"]'));
    infoPanel.classList.add("visible");
    updateAdminUI();
  }

  function hidePanel() {
    document
      .querySelectorAll(".chakra-svg-stone.selected")
      .forEach((el) => el.classList.remove("selected"));
    infoPanel.classList.remove("visible");
    infoPanel.style.removeProperty("--active-chakra-color");
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

    if (targetTabContentId === "tab-add-stone" && !isEditing) {
      resetForm();
    }
  }

  // ==========================================================================
  // GESTION DES PIERRES (Affichage)
  // ==========================================================================

  /**
   * Génère le contenu HTML pour un élément de la liste de pierres (utilisé par displayStonesForChakra ET populateAllStonesList).
   * @param {object} stoneData - Les données de la pierre.
   * @param {string} [contextChakraId] - L'ID du chakra (ex: "svg-root"), requis si 'chakraName' et 'chakraColor' ne sont pas dans stoneData.
   * @param {boolean} isGlobalList - True si c'est pour la liste globale (pour différencier les classes des boutons si besoin).
   */
  function generateGenericStoneListItemHTML(
    stoneData,
    contextChakraId,
    isGlobalList = false
  ) {
    const stoneIdString = String(stoneData.id);

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

    const purificationDisplay = stoneData.purification
      ? escapeHTML(stoneData.purification)
      : "Non spécifié";
    const rechargeDisplay = stoneData.recharge
      ? escapeHTML(stoneData.recharge)
      : "Non spécifié";

    const imageHTML =
      stoneData.image &&
      typeof stoneData.image === "string" &&
      stoneData.image.startsWith("data:image")
        ? `<img src="${stoneData.image}" alt="${escapeHTML(
            stoneData.name
          )}" class="stone-list-image">`
        : '<span class="stone-list-image-placeholder"></span>';

    const buttonStyle = isAdmin ? "" : 'style="display:none;"';
    const editBtnClass = isGlobalList
      ? "edit-global-stone-btn"
      : "edit-stone-btn";
    const deleteBtnClass = isGlobalList
      ? "delete-global-stone-btn"
      : "delete-stone-btn";

    // Chakra info for global list
    let chakraInfoHTML = "";
    if (isGlobalList && stoneData.chakraName) {
      const chakraColor =
        stoneData.chakraColor ||
        getChakraColorById(stoneData.chakraId || contextChakraId);
      const textColor = isColorLight(chakraColor) ? "#333" : "#fff"; // Ajuster les couleurs du texte du badge chakra
      chakraInfoHTML = `
          <div class="stone-list-chakra-info">
            <em>Chakra:</em> <span class="stone-chakra-badge" style="background-color: ${escapeHTML(
              chakraColor
            )}; color: ${escapeHTML(textColor)};">
              ${escapeHTML(stoneData.chakraName)}
            </span>
          </div>`;
    }

    return `
        <div class="stone-info">
          ${imageHTML}
          <div class="stone-text">
            <strong>${escapeHTML(stoneData.name)}</strong>
            ${chakraInfoHTML}
            <em>Vertus:</em> ${escapeHTML(stoneData.virtues)}<br>
            <em>Purification:</em> ${purificationDisplay}<br>
            <em>Rechargement:</em> ${rechargeDisplay}<br>
            <em>Type(s) de bijou(x):</em> ${jewelryDisplay}
          </div>
        </div>
        <div class="stone-buttons">
          <button class="${editBtnClass}" data-stone-id="${stoneIdString}" data-chakra-id="${escapeHTML(
      stoneData.chakraId || contextChakraId
    )}" aria-label="Modifier ${escapeHTML(
      stoneData.name
    )}" ${buttonStyle} title="Modifier">✎</button>
          <button class="${deleteBtnClass}" data-stone-id="${stoneIdString}" data-chakra-id="${escapeHTML(
      stoneData.chakraId || contextChakraId
    )}" aria-label="Supprimer ${escapeHTML(
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
    );

    stoneList.innerHTML = "";

    if (stonesForCurrentChakra.length === 0) {
      stoneList.innerHTML = initialStoneListMessageHTML;
    } else {
      const itemChakraColor = getChakraColorById(chakraId);

      stonesForCurrentChakra.forEach((stone) => {
        const listItem = document.createElement("li");
        listItem.setAttribute("data-stone-id", String(stone.id));
        if (itemChakraColor) {
          listItem.style.setProperty("--item-chakra-color", itemChakraColor);
        }
        // Utilise la fonction générique. Pour la liste de chakra, contextChakraId est chakraId.
        listItem.innerHTML = generateGenericStoneListItemHTML(
          stone,
          chakraId,
          false
        );
        stoneList.appendChild(listItem);
      });
      updateAdminUI();
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

    const initialMessageElement = stoneList.querySelector("li em");
    if (
      initialMessageElement &&
      initialMessageElement.textContent.includes("Aucune pierre ajoutée")
    ) {
      stoneList.innerHTML = "";
    }

    const listItem = document.createElement("li");
    const itemChakraColor = getChakraColorById(chakraId);

    listItem.setAttribute("data-stone-id", String(stoneData.id));
    if (itemChakraColor) {
      listItem.style.setProperty("--item-chakra-color", itemChakraColor);
    }
    listItem.innerHTML = generateGenericStoneListItemHTML(
      stoneData,
      chakraId,
      false
    );
    stoneList.appendChild(listItem);
    updateAdminUI();
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
      const itemChakraColor = getChakraColorById(chakraId);
      if (itemChakraColor) {
        listItem.style.setProperty("--item-chakra-color", itemChakraColor);
      }
      listItem.innerHTML = generateGenericStoneListItemHTML(
        stoneData,
        chakraId,
        false
      );
      updateAdminUI();
    } else {
      console.warn(
        "Élément de liste non trouvé pour mise à jour, ID:",
        stoneIdString
      );
    }
  }

  // ==========================================================================
  // GESTION DU FORMULAIRE D'AJOUT/MODIFICATION
  // ==========================================================================

  function populateEditForm(stoneData) {
    stoneNameInput.value = stoneData.name;
    stoneVirtuesInput.value = stoneData.virtues;
    stonePurificationInput.value = stoneData.purification || "";
    stoneRechargeInput.value = stoneData.recharge || "";

    resetJewelryCheckboxesAndQuantities();

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
            quantityInput.value = item.quantity > 1 ? item.quantity : "";
            quantityInput.placeholder = DEFAULT_QUANTITY_PLACEHOLDER;
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

    if (
      stoneData.image &&
      typeof stoneData.image === "string" &&
      stoneData.image.startsWith("data:image")
    ) {
      imagePreview.src = stoneData.image;
      imagePreview.style.display = "block";
      imageDropZone.classList.add("has-image");
      removeImageBtn.style.display = "inline-block";
      currentImageBase64 = stoneData.image;
    } else {
      resetImagePreview();
    }

    submitButton.textContent = "Modifier la pierre";
    isEditing = true;
    editingStoneId = String(stoneData.id);

    activateTab(addStoneTabBtn);
    stoneNameInput.focus();
  }

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

  function resetForm() {
    addStoneForm.reset();
    resetJewelryCheckboxesAndQuantities();
    resetImagePreview();
    submitButton.textContent = "Ajouter la pierre";
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
      jewelryCheckboxesContainer.querySelectorAll(
        'input[type="checkbox"][name="jewelry-type"]:checked'
      )
    ).map((checkbox) => {
      const type = checkbox.dataset.type;
      const quantityInput = jewelryCheckboxesContainer.querySelector(
        `input[type="number"][data-type="${type}"]`
      );
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
      ...(isEditing && { id: editingStoneId }),
    };

    submitButton.disabled = true;
    submitButton.textContent = isEditing ? "Modification..." : "Ajout...";

    const savedStone = await addOrUpdateStoneBackend(
      currentChakraId,
      stoneDataForBackend
    );

    submitButton.disabled = false;

    if (savedStone && savedStone.id) {
      if (!allStonesData[currentChakraId]) {
        allStonesData[currentChakraId] = [];
      }
      const stoneIndex = allStonesData[currentChakraId].findIndex(
        (s) => String(s.id) === String(savedStone.id)
      );

      if (stoneIndex !== -1) {
        allStonesData[currentChakraId][stoneIndex] = savedStone;
        console.log("État local mis à jour (modification):", allStonesData);
        updateStoneInDisplayList(currentChakraId, savedStone);
      } else {
        allStonesData[currentChakraId].push(savedStone);
        console.log("État local mis à jour (ajout):", allStonesData);
        addStoneToDisplayList(currentChakraId, savedStone);
      }
      // Rafraîchir la liste globale si elle est visible ou la prochaine fois qu'elle s'ouvre
      if (allStonesModal.classList.contains("visible")) {
        populateAllStonesList();
      }

      resetForm();
      activateTab(
        document.querySelector('.tab-link[data-tab="tab-my-stones"]')
      );
    } else {
      console.error(
        "La sauvegarde via le backend a échoué ou n'a pas retourné de données valides."
      );
      submitButton.textContent = isEditing
        ? "Modifier la pierre"
        : "Ajouter la pierre";
    }
  }

  // ==========================================================================
  // GESTION DE L'UPLOAD D'IMAGE
  // ==========================================================================

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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const resizedBase64 = canvas.toDataURL(
          "image/jpeg",
          IMAGE_JPEG_QUALITY
        );

        imagePreview.src = resizedBase64;
        imagePreview.style.display = "block";
        imageDropZone.classList.add("has-image");
        removeImageBtn.style.display = "inline-block";
        dropZonePrompt.style.display = "none";
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
      img.src = e.target.result;
    };
    reader.onerror = function () {
      console.error("Erreur de lecture du fichier.");
      showToast("Erreur lors de la lecture du fichier.", "error");
      resetImagePreview();
    };
    reader.readAsDataURL(file);
  }

  function resetImagePreview() {
    imageInput.value = null;
    imagePreview.src = "#";
    imagePreview.style.display = "none";
    imageDropZone.classList.remove("has-image");
    removeImageBtn.style.display = "none";
    dropZonePrompt.style.display = "block";
    currentImageBase64 = null;
  }

  // ==========================================================================
  // GESTION DE LA MODALE DE CONFIRMATION DE SUPPRESSION
  // ==========================================================================
  function showConfirmationModal(stoneId, chakraId) {
    stoneToDeleteId = stoneId;
    chakraOfStoneToDelete = chakraId;
    confirmationModal.style.display = "flex";
    confirmationModal.offsetHeight;
    confirmationModal.classList.add("visible");
    confirmDeleteBtn.focus();
  }

  function hideConfirmationModal() {
    confirmationModal.classList.remove("visible");
    confirmationModal.addEventListener(
      "transitionend",
      () => {
        if (!confirmationModal.classList.contains("visible")) {
          confirmationModal.style.display = "none";
        }
      },
      { once: true }
    );
  }

  // ==========================================================================
  // SYSTÈME DE CONNEXION ADMIN
  // ==========================================================================

  function updateAdminUI() {
    adminLoginImg.src = isAdmin ? ADMIN_ICON_URL : GUEST_ICON_URL;
    adminLoginImg.alt = isAdmin ? "Déconnexion admin" : "Connexion admin";
    adminLoginIcon.title = isAdmin
      ? "Mode Administrateur - Session Active"
      : "Mode Invité (cliquer pour connexion)";

    if (addStoneTabBtn) {
      addStoneTabBtn.style.display = isAdmin ? "inline-block" : "none";
    }

    const adminButtonsSelectors =
      ".edit-stone-btn, .delete-stone-btn, .edit-global-stone-btn, .delete-global-stone-btn";
    document.querySelectorAll(adminButtonsSelectors).forEach((btn) => {
      btn.style.display = isAdmin ? "inline-block" : "none";
    });

    if (!isAdmin && infoPanel.classList.contains("visible")) {
      const activeTab = document.querySelector(".tab-link.active");
      if (activeTab === addStoneTabBtn) {
        activateTab(
          document.querySelector('.tab-link[data-tab="tab-my-stones"]')
        );
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
      console.log(
        `Session admin expire dans ${Math.round(expireIn / 1000 / 60)} minutes.`
      );
      adminSessionTimeout = setTimeout(() => {
        console.log("Session admin expirée.");
        setAdminMode(false);
        showToast(
          "Session administrateur expirée. Vous êtes repassé en mode invité.",
          "info"
        );
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
    const timestamp = parseInt(
      localStorage.getItem(ADMIN_SESSION_TIMESTAMP_KEY),
      10
    );
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
    adminPasswordInput.value = "";
    adminLoginError.textContent = "";
    adminLoginError.style.display = "none";
    adminLoginModal.classList.remove("visible");
    adminLoginModal.addEventListener(
      "transitionend",
      () => {
        if (!adminLoginModal.classList.contains("visible")) {
          adminLoginModal.style.display = "none";
        }
      },
      { once: true }
    );
  }

  function closeLogoutModal() {
    adminLogoutModal.classList.remove("visible");
    adminLogoutModal.addEventListener(
      "transitionend",
      () => {
        if (!adminLogoutModal.classList.contains("visible")) {
          adminLogoutModal.style.display = "none";
        }
      },
      { once: true }
    );
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
        closeLoginModal();
        adminLoginModal.style.display = "none";
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
  // MODALE DE LA LISTE GLOBALE DE TOUTES LES PIERRES
  // ==========================================================================

  function openAllStonesModal() {
    populateAllStonesList();
    allStonesModal.style.display = "flex";
    allStonesModal.offsetHeight;
    allStonesModal.classList.add("visible");
    allStonesSearchInput.focus();
    allStonesSortButtons.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.sort === currentSortCriteria) {
        btn.classList.add("active");
      }
    });
  }

  function closeAllStonesModal() {
    allStonesModal.classList.remove("visible");
    allStonesModal.addEventListener(
      "transitionend",
      () => {
        if (!allStonesModal.classList.contains("visible")) {
          allStonesModal.style.display = "none";
        }
      },
      { once: true }
    );
  }

  function populateAllStonesList() {
    const searchTerm = allStonesSearchInput.value.toLowerCase().trim();
    let flatStoneList = [];

    for (const chakraIdKey in allStonesData) {
      if (Array.isArray(allStonesData[chakraIdKey])) {
        allStonesData[chakraIdKey].forEach((stone) => {
          if (stone && stone.id && stone.name) {
            flatStoneList.push({
              ...stone,
              chakraId: chakraIdKey,
              chakraName: getChakraDisplayName(chakraIdKey),
              chakraColor: getChakraColorById(chakraIdKey),
            });
          }
        });
      }
    }

    if (searchTerm) {
      flatStoneList = flatStoneList.filter(
        (stone) =>
          stone.name.toLowerCase().includes(searchTerm) ||
          stone.chakraName.toLowerCase().includes(searchTerm) ||
          (stone.virtues && stone.virtues.toLowerCase().includes(searchTerm)) ||
          (stone.purification &&
            stone.purification.toLowerCase().includes(searchTerm)) ||
          (stone.recharge &&
            stone.recharge.toLowerCase().includes(searchTerm)) ||
          (Array.isArray(stone.jewelryTypes) &&
            stone.jewelryTypes.some((jt) =>
              jt.type.toLowerCase().includes(searchTerm)
            ))
      );
    }

    flatStoneList.sort((a, b) => {
      if (currentSortCriteria === "name") {
        return a.name.localeCompare(b.name);
      } else if (currentSortCriteria === "chakra") {
        const chakraComparison = a.chakraName.localeCompare(b.chakraName);
        if (chakraComparison !== 0) return chakraComparison;
        return a.name.localeCompare(b.name); // Tri secondaire par nom
      }
      return 0;
    });

    allStonesGlobalList.innerHTML = "";
    if (flatStoneList.length === 0) {
      allStonesGlobalList.innerHTML = `<li><em>${
        searchTerm
          ? "Aucune pierre ne correspond à votre recherche."
          : "Aucune pierre dans la collection."
      }</em></li>`;
      return;
    }

    flatStoneList.forEach((stoneWithChakraInfo) => {
      const li = document.createElement("li");
      li.setAttribute("data-stone-id", String(stoneWithChakraInfo.id));
      li.setAttribute("data-chakra-id", String(stoneWithChakraInfo.chakraId));

      const itemChakraColor =
        stoneWithChakraInfo.chakraColor ||
        getChakraColorById(stoneWithChakraInfo.chakraId);
      if (itemChakraColor) {
        li.style.setProperty("--item-chakra-color", itemChakraColor);
      }

      li.innerHTML = generateGenericStoneListItemHTML(
        stoneWithChakraInfo,
        stoneWithChakraInfo.chakraId,
        true
      );

      // Le clic sur l'item lui-même (hors boutons) navigue
      li.addEventListener("click", (event) => {
        if (!event.target.closest("button")) {
          // Ne pas déclencher si on clique sur un bouton
          handleGlobalStoneClick(
            stoneWithChakraInfo.id,
            stoneWithChakraInfo.chakraId
          );
        }
      });
      allStonesGlobalList.appendChild(li);
    });
    updateAdminUI(); // Pour s'assurer que les boutons edit/delete dans la liste globale sont affichés/cachés correctement
  }

  function handleGlobalStoneClick(stoneId, chakraId) {
    closeAllStonesModal();
    showPanel(chakraId);

    setTimeout(() => {
      const stoneElementInPanel = stoneList.querySelector(
        `li[data-stone-id="${stoneId}"]`
      );
      if (stoneElementInPanel) {
        const myStonesTab = document.querySelector(
          '.tab-link[data-tab="tab-my-stones"]'
        );
        if (myStonesTab && !myStonesTab.classList.contains("active")) {
          activateTab(myStonesTab);
        }
        stoneElementInPanel.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        stoneElementInPanel.classList.add("highlighted-stone");
        setTimeout(() => {
          stoneElementInPanel.classList.remove("highlighted-stone");
        }, 2000);
      }
    }, 100);
  }

  // ==========================================================================
  // ÉCOUTEURS D'ÉVÉNEMENTS PRINCIPAUX
  // ==========================================================================

  svgElement.addEventListener("click", (event) => {
    const target = event.target;
    if (target.matches(".chakra-svg-stone")) {
      const chakraId = target.id;
      console.log(`Cercle Chakra cliqué : ${chakraId}`);
      showPanel(chakraId);
    }
  });

  closePanelButton.addEventListener("click", hidePanel);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab);
    });
  });

  // Délégation d'événements pour les listes de pierres (panneau et modale globale)
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    const editButton = target.closest(
      ".edit-stone-btn, .edit-global-stone-btn"
    );
    const deleteButton = target.closest(
      ".delete-stone-btn, .delete-global-stone-btn"
    );

    if (!isAdmin) return; // Actions réservées aux admins

    if (editButton) {
      const listItem = editButton.closest("li");
      const stoneIdStr = listItem?.dataset.stoneId;
      const chakraIdForStone = listItem?.dataset.chakraId || currentChakraId; // Utilise data-chakra-id pour la liste globale

      if (!stoneIdStr || !chakraIdForStone) {
        console.error(
          "ID de pierre ou ID de chakra manquant pour l'action d'édition."
        );
        return;
      }

      const stoneToEdit = allStonesData[chakraIdForStone]?.find(
        (s) => String(s.id) === stoneIdStr
      );

      if (stoneToEdit) {
        if (allStonesModal.classList.contains("visible")) {
          // Si on édite depuis la liste globale
          closeAllStonesModal();
        }
        // S'assurer que le bon chakra est sélectionné dans le panneau principal si ce n'est pas déjà le cas
        if (currentChakraId !== chakraIdForStone) {
          currentChakraId = chakraIdForStone; // Mettre à jour currentChakraId avant de montrer le panneau
        }
        showPanel(chakraIdForStone);
        populateEditForm(stoneToEdit);
      } else {
        console.error(
          "Pierre à modifier non trouvée dans les données locales:",
          stoneIdStr,
          "pour chakra",
          chakraIdForStone
        );
        showToast(
          "Erreur: Impossible de trouver les données de cette pierre.",
          "error"
        );
      }
    } else if (deleteButton) {
      const listItem = deleteButton.closest("li");
      const stoneIdStr = listItem?.dataset.stoneId;
      const chakraIdForStone = listItem?.dataset.chakraId || currentChakraId;

      if (!stoneIdStr || !chakraIdForStone) {
        console.error(
          "ID de pierre ou ID de chakra manquant pour l'action de suppression."
        );
        return;
      }
      showConfirmationModal(stoneIdStr, chakraIdForStone);
    }
  });

  cancelDeleteBtn.addEventListener("click", () => {
    hideConfirmationModal();
    stoneToDeleteId = null;
    chakraOfStoneToDelete = null;
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (!stoneToDeleteId || !chakraOfStoneToDelete) {
      console.error(
        "Erreur critique : ID de pierre ou chakra manquant pour la suppression confirmée."
      );
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
        allStonesData[chakraOfStoneToDelete] = allStonesData[
          chakraOfStoneToDelete
        ].filter((stone) => String(stone.id) !== stoneToDeleteId);
        console.log("État local mis à jour (suppression):", allStonesData);
      }
      // Supprimer de la liste du panneau d'information (si visible et pertinent)
      if (
        currentChakraId === chakraOfStoneToDelete &&
        infoPanel.classList.contains("visible")
      ) {
        const listItemToDeleteInPanel = stoneList.querySelector(
          `li[data-stone-id="${stoneToDeleteId}"]`
        );
        if (listItemToDeleteInPanel) listItemToDeleteInPanel.remove();
        if (stoneList.children.length === 0) {
          stoneList.innerHTML = initialStoneListMessageHTML;
        }
      }
      // Supprimer de la liste globale (si visible)
      if (allStonesModal.classList.contains("visible")) {
        const listItemToDeleteInGlobal = allStonesGlobalList.querySelector(
          `li[data-stone-id="${stoneToDeleteId}"]`
        );
        if (listItemToDeleteInGlobal) listItemToDeleteInGlobal.remove();
        if (allStonesGlobalList.children.length === 0) {
          allStonesGlobalList.innerHTML = `<li><em>Aucune pierre dans la collection.</em></li>`;
        }
      }
    }

    hideConfirmationModal();
    stoneToDeleteId = null;
    chakraOfStoneToDelete = null;
  });

  addStoneForm.addEventListener("submit", handleFormSubmit);

  jewelryCheckboxesContainer.addEventListener("change", (event) => {
    if (event.target.matches('input[type="checkbox"][name="jewelry-type"]')) {
      handleJewelryCheckboxChange(event.target);
    }
  });

  function handleJewelryCheckboxChange(checkbox) {
    const type = checkbox.dataset.type;
    const quantityInput = jewelryCheckboxesContainer.querySelector(
      `input[type="number"][data-type="${type}"]`
    );
    if (quantityInput) {
      quantityInput.disabled = !checkbox.checked;
      if (checkbox.checked) {
        quantityInput.value = "";
        quantityInput.placeholder = DEFAULT_QUANTITY_PLACEHOLDER;
      } else {
        quantityInput.value = "";
        quantityInput.placeholder = "";
      }
    }
  }

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
      imageInput.click();
    }
  });
  imageInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });
  removeImageBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    resetImagePreview();
  });
  imageDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    imageDropZone.classList.add("drag-over");
  });
  imageDropZone.addEventListener("dragleave", () =>
    imageDropZone.classList.remove("drag-over")
  );
  imageDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    imageDropZone.classList.remove("drag-over");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      imageInput.value = null;
    }
  });

  adminLoginIcon.addEventListener("click", () => {
    if (isAdmin) {
      adminLogoutModal.style.display = "flex";
      adminLogoutModal.offsetHeight;
      adminLogoutModal.classList.add("visible");
      adminLogoutBtn.focus();
    } else {
      adminLoginModal.style.display = "flex";
      adminLoginModal.offsetHeight;
      adminLoginModal.classList.add("visible");
      adminPasswordInput.value = "";
      adminLoginError.style.display = "none";
      setTimeout(() => adminPasswordInput.focus(), 50);
    }
  });

  closeLoginModalBtn.addEventListener("click", closeLoginModal);
  closeLogoutModalBtn.addEventListener("click", closeLogoutModal);

  adminPasswordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryAdminLogin();
  });
  adminLoginBtn.addEventListener("click", tryAdminLogin);

  adminLogoutBtn.addEventListener("click", () => {
    setAdminMode(false);
    closeLogoutModal();
  });

  window.addEventListener("focus", checkAdminSessionValidity);
  setInterval(checkAdminSessionValidity, 60 * 1000);

  allStonesListBtn.addEventListener("click", openAllStonesModal);
  closeAllStonesModalBtn.addEventListener("click", closeAllStonesModal);
  allStonesSearchInput.addEventListener("input", populateAllStonesList);
  allStonesSortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentSortCriteria = button.dataset.sort;
      allStonesSortButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      populateAllStonesList();
    });
  });

  // ==========================================================================
  // INITIALISATION AU CHARGEMENT DE LA PAGE
  // ==========================================================================
  confirmationModal.style.display = "none";
  adminLoginModal.style.display = "none";
  adminLogoutModal.style.display = "none";
  allStonesModal.style.display = "none";
  stoneList.innerHTML = initialStoneListMessageHTML;

  generateJewelryCheckboxes();
  createSVGCircles();
  checkAdminSessionValidity();
  await loadInitialStones();
  updateAdminUI();
});
