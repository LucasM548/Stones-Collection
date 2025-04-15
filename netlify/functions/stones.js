// Fichier: netlify/functions/stones.js

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
let DB_NAME;

try { // Configuration check
    if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is not set.');
    const pathPart = MONGODB_URI.split('/').pop();
    DB_NAME = pathPart ? pathPart.split('?')[0] : null;
    if (!DB_NAME) throw new Error('Could not parse database name from MONGODB_URI.');
    console.log("Configuration DB OK: URI présente, DB_NAME extrait:", DB_NAME);
} catch (error) {
    console.error("FATAL CONFIGURATION ERROR:", error.message);
}

let cachedDb = null;

async function connectToDatabase() { // Database connection logic
    if (cachedDb) {
        try {
            await cachedDb.command({ ping: 1 });
            console.log("Using cached DB connection.");
            return cachedDb;
        } catch (e) {
            console.warn("Cached DB connection lost, reconnecting.", e.message);
            cachedDb = null;
        }
    }
    if (!MONGODB_URI || !DB_NAME) throw new Error("Database configuration is missing.");
    console.log("Connecting to Database...");
    const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, connectTimeoutMS: 5000, serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(DB_NAME);
    cachedDb = db;
    console.log("Database connection established and cached.");
    return db;
}

exports.handler = async (event, context) => { // Main handler

    // --- Gestion de la requête Preflight OPTIONS ---
    if (event.httpMethod === 'OPTIONS') {
        console.log("Received OPTIONS preflight request");
        return {
            statusCode: 204, // No Content
            headers: corsHeaders, // Envoyer les en-têtes CORS
            body: ''
        };
    }
    // --- Fin Gestion OPTIONS ---


    context.callbackWaitsForEmptyEventLoop = false;
    if (!MONGODB_URI || !DB_NAME) { /* Config check */
        return {
            statusCode: 500,
            headers: corsHeaders, // Ajouter CORS aux erreurs aussi
            body: JSON.stringify({ error: 'Server configuration error.' })
        };
    }

    try {
        const db = await connectToDatabase();
        const collection = db.collection('stones');
        const pathParts = event.path.split('/').filter(Boolean);
        const stoneId = pathParts.length === 4 ? pathParts[3] : null;
        console.log(`Request Path: ${event.path}, Method: ${event.httpMethod}, Extracted stoneId: ${stoneId}`);

        let response; // Pour stocker la réponse avant d'ajouter les headers

        switch (event.httpMethod) {
            case 'GET':
                if (stoneId) { // Get single stone
                    if (!ObjectId.isValid(stoneId)) {
                        response = { statusCode: 400, body: JSON.stringify({ error: 'Invalid stone ID format' }) };
                    } else {
                        const stone = await collection.findOne({ _id: new ObjectId(stoneId) });
                        if (!stone) {
                           response = { statusCode: 404, body: JSON.stringify({ error: 'Stone not found' }) };
                        } else {
                            stone.id = stone._id.toString(); delete stone._id;
                            response = { statusCode: 200, body: JSON.stringify(stone) };
                        }
                    }
                } else { // Get all stones
                    const allStonesArray = await collection.find({}).toArray();
                    const stonesGroupedByChakra = allStonesArray.reduce((acc, stone) => {
                        const chakraId = stone.chakraId || 'unknown';
                        if (!acc[chakraId]) acc[chakraId] = [];
                        stone.id = stone._id.toString(); delete stone._id;
                        acc[chakraId].push(stone);
                        return acc;
                    }, {});
                    response = { statusCode: 200, body: JSON.stringify(stonesGroupedByChakra) };
                }
                break; // Sortir du switch pour ajouter les headers

            case 'POST': // Add new stone
                let newStoneData;
                try { newStoneData = JSON.parse(event.body); }
                catch (e) { response = { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; break; }
                if (!newStoneData.name || !newStoneData.virtues || !newStoneData.chakraId) { response = { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields (name, virtues, chakraId)' })}; break; }

                const dataToInsert = { ...newStoneData };
                if ('id' in dataToInsert) delete dataToInsert.id;
                if ('_id' in dataToInsert) delete dataToInsert._id;

                const resultPost = await collection.insertOne(dataToInsert);
                const createdStone = { ...dataToInsert, id: resultPost.insertedId.toString() };
                response = { statusCode: 201, body: JSON.stringify(createdStone) };
                break;

            case 'PUT': // Update existing stone
                if (!stoneId) { response = { statusCode: 400, body: JSON.stringify({ error: 'Missing stone ID in path for PUT request' }) }; break; }
                if (!ObjectId.isValid(stoneId)) { response = { statusCode: 400, body: JSON.stringify({ error: 'Invalid stone ID format' }) }; break; }
                let updatedStoneData;
                try { updatedStoneData = JSON.parse(event.body); }
                catch (e) { response = { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; break; }

                const dataToUpdate = { ...updatedStoneData };
                if ('id' in dataToUpdate) delete dataToUpdate.id;
                if ('_id' in dataToUpdate) delete dataToUpdate._id;

                const resultPut = await collection.updateOne({ _id: new ObjectId(stoneId) }, { $set: dataToUpdate });
                if (resultPut.matchedCount === 0) { response = { statusCode: 404, body: JSON.stringify({ error: 'Stone not found for update' }) }; break; }
                const updatedStone = { ...dataToUpdate, id: stoneId };
                response = { statusCode: 200, body: JSON.stringify(updatedStone) };
                break;

            case 'DELETE': // Delete stone
                if (!stoneId) { response = { statusCode: 400, body: JSON.stringify({ error: 'Missing stone ID in path for DELETE request' }) }; break; }
                if (!ObjectId.isValid(stoneId)) { response = { statusCode: 400, body: JSON.stringify({ error: 'Invalid stone ID format' }) }; break; }
                await collection.deleteOne({ _id: new ObjectId(stoneId) });
                response = { statusCode: 204, body: '' }; // No body needed for 204
                break;

            default:
                response = { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
                break;
        }

        // Ajouter les headers CORS à la réponse finale (avant de retourner)
        // S'assurer que les headers existants (comme Content-Type) ne sont pas écrasés si la réponse en a déjà
        const finalHeaders = { ...corsHeaders };
        if (response.body && response.statusCode !== 204) {
            finalHeaders['Content-Type'] = 'application/json'; // Assurer Content-Type pour les réponses avec corps
        }

        return {
             ...response, // Copier statusCode et body
             headers: finalHeaders // Ajouter/remplacer les headers
        };

    } catch (error) { // Catch all errors
        console.error('Unhandled error in Netlify function handler:', error);
        const isConfigError = error.message.includes("configuration") || error.message.includes("connection") || error.message.includes("Timeout");
        const statusCode = isConfigError ? 503 : 500;
        const errorMessage = isConfigError ? "Database connection error." : "Internal Server Error";
        // Retourner l'erreur avec les headers CORS
        return {
            statusCode: statusCode,
            headers: corsHeaders, // Ajouter CORS aux erreurs aussi
            body: JSON.stringify({ error: errorMessage })
        };
    }
};