// Fichier: netlify/functions/login.js

exports.handler = async (event) => {
  // 1. Vérifier la méthode HTTP (on attend POST)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      body: JSON.stringify({ success: false, message: 'Méthode non autorisée' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // 2. Récupérer le mot de passe depuis le corps de la requête
  let submittedPassword;
  try {
    const body = JSON.parse(event.body);
    submittedPassword = body.password;
    if (!submittedPassword) {
      throw new Error("Mot de passe manquant dans la requête.");
    }
  } catch (error) {
    console.error("Erreur lors de l'analyse du corps de la requête:", error);
    return {
      statusCode: 400, // Bad Request
      body: JSON.stringify({ success: false, message: 'Requête invalide ou mot de passe manquant.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // 3. Récupérer le VRAI mot de passe depuis les variables d'environnement Netlify
  const correctPassword = process.env.ADMIN_PASSWORD;

  // Sécurité : Vérifier que la variable d'environnement est bien configurée
  if (!correctPassword) {
      console.error("ERREUR CRITIQUE: La variable d'environnement ADMIN_PASSWORD n'est pas définie sur Netlify !");
      return {
          statusCode: 500, // Internal Server Error
          body: JSON.stringify({ success: false, message: "Erreur de configuration du serveur." }),
          headers: { 'Content-Type': 'application/json' },
      };
  }

  // 4. Comparer les mots de passe
  if (submittedPassword === correctPassword) {
    // Succès
    return {
      statusCode: 200, // OK
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' },
    };
  } else {
    // Échec
    return {
      statusCode: 401, // Unauthorized
      body: JSON.stringify({ success: false, message: 'Mot de passe incorrect.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
