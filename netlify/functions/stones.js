// Fichier: netlify/functions/stones.js

const { MongoClient, ObjectId } = require('mongodb');
const corsHeaders = {
  // IMPORTANT : Pour la migration depuis GitHub Pages, utilise ton URL GitHub Pages.
  // Pour une utilisation générale plus tard depuis ton site Netlify, tu pourrais vouloir
  // utiliser '*' (moins sécurisé) ou l'URL de ton site Netlify, ou les deux.
  // Pour l'instant, autorisons GitHub Pages :
  'Access-Control-Allow-Origin': 'https://lucasm548.github.io/Stones-Collection/',
  // Alternative TEMPORAIRE (plus simple mais moins sécurisée) si tu as des soucis :
  // 'Access-Control-Allow-Origin': '*',

  // Méthodes HTTP autorisées par ton API
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',

  // En-têtes que le client (navigateur) est autorisé à envoyer
  'Access-Control-Allow-Headers': 'Content-Type, Authorization' // Ajouté Authorization au cas où
};

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
    context.callbackWaitsForEmptyEventLoop = false;
    if (!MONGODB_URI || !DB_NAME) { /* Config check */ return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' })}; }

    try {
        const db = await connectToDatabase();
        const collection = db.collection('stones');
        const pathParts = event.path.split('/').filter(Boolean);
        const stoneId = pathParts.length === 4 ? pathParts[3] : null;
        console.log(`Request Path: ${event.path}, Method: ${event.httpMethod}, Extracted stoneId: ${stoneId}`);

        switch (event.httpMethod) {
            case 'GET':
                if (stoneId) { // Get single stone
                    if (!ObjectId.isValid(stoneId)) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid stone ID format' }) };
                    const stone = await collection.findOne({ _id: new ObjectId(stoneId) });
                    if (!stone) return { statusCode: 404, body: JSON.stringify({ error: 'Stone not found' }) };
                    stone.id = stone._id.toString(); delete stone._id;
                    return { statusCode: 200, body: JSON.stringify(stone) };
                } else { // Get all stones
                    const allStonesArray = await collection.find({}).toArray();
                    const stonesGroupedByChakra = allStonesArray.reduce((acc, stone) => {
                        const chakraId = stone.chakraId || 'unknown';
                        if (!acc[chakraId]) acc[chakraId] = [];
                        stone.id = stone._id.toString(); delete stone._id;
                        acc[chakraId].push(stone);
                        return acc;
                    }, {});
                    return { statusCode: 200, body: JSON.stringify(stonesGroupedByChakra) };
                }

            case 'POST': // Add new stone
                let newStoneData;
                try { newStoneData = JSON.parse(event.body); }
                catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; }
                if (!newStoneData.name || !newStoneData.virtues || !newStoneData.chakraId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields (name, virtues, chakraId)' })};

                // *** MODIFICATION ICI (POST) ***
                const dataToInsert = { ...newStoneData };
                if ('id' in dataToInsert) delete dataToInsert.id;
                if ('_id' in dataToInsert) delete dataToInsert._id;

                const resultPost = await collection.insertOne(dataToInsert);
                const createdStone = { ...dataToInsert, id: resultPost.insertedId.toString() };
                return { statusCode: 201, body: JSON.stringify(createdStone) };

            case 'PUT': // Update existing stone
                if (!stoneId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing stone ID in path for PUT request' }) };
                if (!ObjectId.isValid(stoneId)) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid stone ID format' }) };
                let updatedStoneData;
                try { updatedStoneData = JSON.parse(event.body); }
                catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; }

                // *** MODIFICATION ICI (PUT) ***
                const dataToUpdate = { ...updatedStoneData };
                if ('id' in dataToUpdate) delete dataToUpdate.id;
                if ('_id' in dataToUpdate) delete dataToUpdate._id;

                const resultPut = await collection.updateOne({ _id: new ObjectId(stoneId) }, { $set: dataToUpdate });
                if (resultPut.matchedCount === 0) return { statusCode: 404, body: JSON.stringify({ error: 'Stone not found for update' }) };
                const updatedStone = { ...dataToUpdate, id: stoneId };
                return { statusCode: 200, body: JSON.stringify(updatedStone) };

            case 'DELETE': // Delete stone
                if (!stoneId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing stone ID in path for DELETE request' }) };
                if (!ObjectId.isValid(stoneId)) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid stone ID format' }) };
                await collection.deleteOne({ _id: new ObjectId(stoneId) });
                return { statusCode: 204, body: '' };

            default:
                return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
        }
    } catch (error) { // Catch all errors
        console.error('Unhandled error in Netlify function handler:', error);
        const isConfigError = error.message.includes("configuration") || error.message.includes("connection") || error.message.includes("Timeout");
        const statusCode = isConfigError ? 503 : 500;
        const errorMessage = isConfigError ? "Database connection error." : "Internal Server Error";
        return { statusCode: statusCode, body: JSON.stringify({ error: errorMessage }) };
    }
};