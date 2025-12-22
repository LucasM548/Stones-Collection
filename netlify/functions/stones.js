const { neon } = require('@netlify/neon');

/**
 * Searches Wikipedia for an image of the stone.
 * Returns the source URL of the first relevant image found, or null.
 */
async function fetchWikipediaImage(stoneName) {
    if (!stoneName) return null;
    try {
        console.log(`Searching Wikipedia for image of: ${stoneName}`);
        // Search for the page title
        const searchUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(stoneName)}&format=json&origin=*`;
        const searchResp = await fetch(searchUrl);
        const searchData = await searchResp.json();

        if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
            const pageTitle = searchData.query.search[0].title;

            // Get page images
            const imagesUrl = `https://fr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=500&format=json&origin=*`;
            const imagesResp = await fetch(imagesUrl);
            const imagesData = await imagesResp.json();

            const pages = imagesData.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pages[pageId] && pages[pageId].thumbnail) {
                console.log(`Image found for ${stoneName}: ${pages[pageId].thumbnail.source}`);
                return pages[pageId].thumbnail.source;
            }
        }
        console.log(`No image found on Wikipedia for ${stoneName}`);
        return null;
    } catch (error) {
        console.error("Error fetching Wikipedia image:", error);
        return null;
    }
}

exports.handler = async (event, context) => {
    const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL
    const pathParts = event.path.split('/').filter(Boolean);
    // stoneId is the 4th element if path is /.../stones/ID
    const stoneId = pathParts.length === 4 ? pathParts[3] : null;

    console.log(`Request Path: ${event.path}, Method: ${event.httpMethod}, Extracted stoneId: ${stoneId}`);

    let response;

    try {
        switch (event.httpMethod) {
            case 'GET':
                if (stoneId) {
                    // GET /stones/:id
                    const rows = await sql`SELECT * FROM stones WHERE id = ${stoneId}`;
                    if (rows.length === 0) {
                        response = { statusCode: 404, body: JSON.stringify({ error: 'Stone not found' }) };
                    } else {
                        response = { statusCode: 200, body: JSON.stringify(rows[0]) };
                    }
                } else {
                    // GET /stones
                    const rows = await sql`SELECT * FROM stones`;
                    // Frontend expects grouped by chakraId
                    const stonesGroupedByChakra = rows.reduce((acc, stone) => {
                        const chakraId = stone.chakraId || 'unknown';
                        if (!acc[chakraId]) acc[chakraId] = [];
                        stone.id = String(stone.id);
                        acc[chakraId].push(stone);
                        return acc;
                    }, {});
                    response = { statusCode: 200, body: JSON.stringify(stonesGroupedByChakra) };
                }
                break;

            case 'POST':
                // POST /stones
                let newStoneData;
                try { newStoneData = JSON.parse(event.body); }
                catch (e) { response = { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; break; }

                if (!newStoneData.name || !newStoneData.virtues || !newStoneData.chakraId) {
                    response = { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
                    break;
                }

                // Insert
                let { name, virtues, chakraId, image, description, purification, recharge, jewelryTypes } = newStoneData;

                // If no image provided, try to fetch from Wikipedia
                if (!image || image.trim() === "") {
                    image = await fetchWikipediaImage(name);
                }

                const insertedRows = await sql`
                    INSERT INTO stones (name, virtues, "chakraId", image, description, purification, recharge, "jewelryTypes")
                    VALUES (${name}, ${virtues}, ${chakraId}, ${image || null}, ${description || null}, ${purification || null}, ${recharge || null}, ${JSON.stringify(jewelryTypes) || null})
                    RETURNING *
                `;

                const createdStone = insertedRows[0];
                createdStone.id = String(createdStone.id);

                response = { statusCode: 201, body: JSON.stringify(createdStone) };
                break;

            case 'PUT':
                // PUT /stones/:id
                if (!stoneId) { response = { statusCode: 400, body: JSON.stringify({ error: 'Missing stone ID' }) }; break; }

                let updateData;
                try { updateData = JSON.parse(event.body); }
                catch (e) { response = { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; break; }


                const uName = updateData.name;
                const uVirtues = updateData.virtues;
                const uChakraId = updateData.chakraId;
                let uImage = updateData.image;
                const uDesc = updateData.description;
                const uPurif = updateData.purification;
                const uRech = updateData.recharge;
                const uJewel = updateData.jewelryTypes;

                // Check if we need to auto-fetch image (if existing is being cleared or never existed, and no new one provided)
                // However, PUT usually sends the full state. If uImage is unexpectedly empty but title changed, maybe we should fetch?
                // Let's implement: if uImage is explicitly null/empty string, try to fetch. 
                // Note: user might want to delete image. But here the requirement is "try to find an image".
                if (!uImage || uImage.trim() === "") {
                    uImage = await fetchWikipediaImage(uName);
                }

                const updatedRows = await sql`
                    UPDATE stones 
                    SET 
                        name = ${uName}, 
                        virtues = ${uVirtues}, 
                        "chakraId" = ${uChakraId}, 
                        image = ${uImage}, 
                        description = ${uDesc}, 
                        purification = ${uPurif}, 
                        recharge = ${uRech}, 
                        "jewelryTypes" = ${JSON.stringify(uJewel)}
                    WHERE id = ${stoneId}
                    RETURNING *
                `;

                if (updatedRows.length === 0) {
                    response = { statusCode: 404, body: JSON.stringify({ error: 'Stone not found' }) };
                } else {
                    const updatedStone = updatedRows[0];
                    updatedStone.id = String(updatedStone.id);
                    response = { statusCode: 200, body: JSON.stringify(updatedStone) };
                }
                break;

            case 'DELETE':
                if (!stoneId) { response = { statusCode: 400, body: JSON.stringify({ error: 'Missing stone ID' }) }; break; }

                await sql`DELETE FROM stones WHERE id = ${stoneId}`;
                response = { statusCode: 204, body: '' };
                break;

            default:
                response = { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
        }

        if (!response.headers) {
            response.headers = {};
        }
        response.headers['Content-Type'] = 'application/json';
        return response;

    } catch (error) {
        console.error('Database Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal Server Error: ' + error.message })
        };
    }
};