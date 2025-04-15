// Fichier: netlify/functions/stones.js

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
let DB_NAME;

// --- Vérification de la Configuration au démarrage ---
try {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set.');
    }
    const pathPart = MONGODB_URI.split('/').pop();
    DB_NAME = pathPart ? pathPart.split('?')[0] : null;
    if (!DB_NAME) {
         throw new Error('Could not parse database name from MONGODB_URI.');
    }
    console.log("Configuration DB OK: URI présente, DB_NAME extrait:", DB_NAME);
} catch (error) {
    console.error("FATAL CONFIGURATION ERROR:", error.message);
    // La fonction échouera au premier appel si la config est mauvaise
}
// --- Fin Vérification Configuration ---

let cachedDb = null;

// --- Connexion à la Base de Données (avec cache) ---
async function connectToDatabase() {
    if (cachedDb) {
        try {
            await cachedDb.command({ ping: 1 }); // Vérifie si la connexion est toujours active
            console.log("Using cached DB connection.");
            return cachedDb;
        } catch (e) {
            console.warn("Cached DB connection lost, reconnecting.", e.message);
            cachedDb = null; // Force la reconnexion
        }
    }
    // Vérifie à nouveau la config avant de tenter une connexion
    if (!MONGODB_URI || !DB_NAME) {
        // Cette erreur sera attrapée par le handler principal
        throw new Error("Database configuration is missing.");
    }
    console.log("Connecting to Database...");
    const client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000
    });
    await client.connect();
    const db = client.db(DB_NAME);
    cachedDb = db; // Met en cache la connexion
    console.log("Database connection established and cached.");
    return db;
}
// --- Fin Connexion DB ---

// --- Handler Principal de la Fonction Netlify ---
exports.handler = async (event, context) => {
    // Option pour la réutilisation des connexions dans les environnements serverless
    context.callbackWaitsForEmptyEventLoop = false;

    // Vérification de la config au début de chaque invocation (sécurité)
    if (!MONGODB_URI || !DB_NAME) {
        console.error('Handler Error: MONGODB_URI or DB_NAME is missing in configuration.');
        return {
            statusCode: 500,
            // Bonne pratique: définir Content-Type même pour les erreurs
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Server configuration error.' })
        };
    }

    try {
        const db = await connectToDatabase();
        const collection = db.collection('stones'); // Nom de la collection MongoDB
        const pathParts = event.path.split('/').filter(Boolean);
        // stoneId est le 4ème élément si le chemin est /.../stones/ID
        const stoneId = pathParts.length === 4 ? pathParts[3] : null;
        console.log(`Request Path: ${event.path}, Method: ${event.httpMethod}, Extracted stoneId: ${stoneId}`);

        let response; // Pour stocker la réponse avant de retourner

        switch (event.httpMethod) {
            // --- GET : Récupérer les pierres ---
            case 'GET':
                if (stoneId) { // GET /stones/:id
                    if (!ObjectId.isValid(stoneId)) {
                        response = { statusCode: 400, body: JSON.stringify({ error: 'Invalid stone ID format' }) };
                    } else {
                        const stone = await collection.findOne({ _id: new ObjectId(stoneId) });
                        if (!stone) {
                           response = { statusCode: 404, body: JSON.stringify({ error: 'Stone not found' }) };
                        } else {
                            stone.id = stone._id.toString(); delete stone._id; // Renommer _id en id
                            response = { statusCode: 200, body: JSON.stringify(stone) };
                        }
                    }
                } else { // GET /stones
                    const allStonesArray = await collection.find({}).toArray();
                    const stonesGroupedByChakra = allStonesArray.reduce((acc, stone) => {
                        const chakraId = stone.chakraId || 'unknown';
                        if (!acc[chakraId]) acc[chakraId] = [];
                        stone.id = stone._id.toString(); delete stone._id; // Renommer _id en id
                        acc[chakraId].push(stone);
                        return acc;
                    }, {});
                    response = { statusCode: 200, body: JSON.stringify(stonesGroupedByChakra) };
                }
                // Ajouter Content-Type si une réponse JSON est générée
                if (response.statusCode === 200 || response.statusCode === 400 || response.statusCode === 404) {
                     response.headers = { 'Content-Type': 'application/json' };
                }
                break;

            // --- POST : Ajouter une pierre ---
            case 'POST': // POST /stones
                let newStoneData;
                try { newStoneData = JSON.parse(event.body); }
                catch (e) { response = { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; break; }

                if (!newStoneData.name || !newStoneData.virtues || !newStoneData.chakraId) {
                    response = { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing required fields (name, virtues, chakraId)' })}; break;
                }

                // Préparer l'objet à insérer (sans id/_id venant du client)
                const dataToInsert = { ...newStoneData };
                if ('id' in dataToInsert) delete dataToInsert.id;
                if ('_id' in dataToInsert) delete dataToInsert._id;

                const resultPost = await collection.insertOne(dataToInsert);
                const createdStone = { ...dataToInsert, id: resultPost.insertedId.toString() };
                response = { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createdStone) };
                break;

            // --- PUT : Modifier une pierre ---
            case 'PUT': // PUT /stones/:id
                if (!stoneId) { response = { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing stone ID in path for PUT request' }) }; break; }
                if (!ObjectId.isValid(stoneId)) { response = { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid stone ID format' }) }; break; }

                let updatedStoneData;
                try { updatedStoneData = JSON.parse(event.body); }
                catch (e) { response = { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; break; }

                // Préparer l'objet de mise à jour (sans id/_id)
                const dataToUpdate = { ...updatedStoneData };
                if ('id' in dataToUpdate) delete dataToUpdate.id;
                if ('_id' in dataToUpdate) delete dataToUpdate._id;

                const resultPut = await collection.updateOne({ _id: new ObjectId(stoneId) }, { $set: dataToUpdate });
                if (resultPut.matchedCount === 0) { response = { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Stone not found for update' }) }; break; }

                // Renvoyer l'objet mis à jour (reconstruit)
                const updatedStone = { ...dataToUpdate, id: stoneId };
                response = { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedStone) };
                break;

            // --- DELETE : Supprimer une pierre ---
            case 'DELETE': // DELETE /stones/:id
                if (!stoneId) { response = { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing stone ID in path for DELETE request' }) }; break; }
                if (!ObjectId.isValid(stoneId)) { response = { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid stone ID format' }) }; break; }

                await collection.deleteOne({ _id: new ObjectId(stoneId) });
                // Pas de corps ni de Content-Type pour 204
                response = { statusCode: 204, body: '' };
                break;

            // --- Méthode non autorisée ---
            default:
                response = { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
                break;
        }

        // Retourner la réponse construite
        return response;

    } catch (error) { // --- Gestion des Erreurs Globales ---
        console.error('Unhandled error in Netlify function handler:', error);
        const isConfigError = error.message.includes("configuration") || error.message.includes("connection") || error.message.includes("Timeout");
        const statusCode = isConfigError ? 503 : 500; // 503 Service Unavailable si erreur config/connexion
        const errorMessage = isConfigError ? "Database connection error." : "Internal Server Error";

        // Retourner l'erreur
        return {
            statusCode: statusCode,
            headers: { 'Content-Type': 'application/json' }, // Définir Content-Type pour l'erreur
            body: JSON.stringify({ error: errorMessage })
            // Ne pas exposer error.message au client en production
        };
    }
};