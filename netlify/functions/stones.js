const { neon } = require('@netlify/neon');

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
                    // Note: id in Postgres is usually integer, but if we used SERIAL it is an int. 
                    // However, frontend might be sending string. Let's assume it's an ID.
                    // If previously using MongoDB ObjectIDs (strings), new IDs will be integers.
                    // Need to handle potential mismatch if frontend expects string IDs or if old links exist.
                    // For now, simple select.
                    const rows = await sql`SELECT * FROM stones WHERE id = ${stoneId}`;
                    if (rows.length === 0) {
                        response = { statusCode: 404, body: JSON.stringify({ error: 'Stone not found' }) };
                    } else {
                        // Map snake_case or specific fields if needed, but select * should be fine 
                        // if column names match what frontend expects. 
                        // Frontend expects: id, name, virtues, chakraId, etc.
                        // "jewelryTypes" is JSONB, so it returns as object/array automatically in JS.
                        response = { statusCode: 200, body: JSON.stringify(rows[0]) };
                    }
                } else {
                    // GET /stones
                    const rows = await sql`SELECT * FROM stones`;
                    // Frontend expects grouped by chakraId
                    const stonesGroupedByChakra = rows.reduce((acc, stone) => {
                        const chakraId = stone.chakraId || 'unknown';
                        if (!acc[chakraId]) acc[chakraId] = [];
                        // Ensure id is string if frontend expects strict string
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
                // cleanup id/ _id if present
                const { name, virtues, chakraId, image, description, purification, recharge, jewelryTypes } = newStoneData;

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

                // Construct dynamic update query
                // neon/postgres doesn't have a simple "update set object" helper in vanilla sql template tag 
                // like some ORMs. We need to build it or update specific fields.
                // For simplicity, we can update all known fields or use a helper.
                // Let's rely on specific fields to be safe.
                
                const uName = updateData.name;
                const uVirtues = updateData.virtues;
                const uChakraId = updateData.chakraId;
                const uImage = updateData.image; 
                const uDesc = updateData.description;
                const uPurif = updateData.purification;
                const uRech = updateData.recharge;
                const uJewel = updateData.jewelryTypes;

                // We can't conditionally add parameters easily in tagged template literal without helper.
                // We will do a full update of these fields. If they are undefined in updateData, 
                // checks needed. But PUT usually implies full resource update or PATCH for partial.
                // The frontend logic sends the whole object usually (see script.js line 408: JSON.stringify(payload)).
                // So we can assume full object is sent.

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