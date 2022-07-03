const {MongoClient} = require("mongodb");
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);
const dbName = "crypto_apis";
const collectionName = "news";
client.connect(); // xxx: close the connection at some point?

async function addListing(listing) {
    await client.db(dbName).collection(collectionName).insertOne(listing);
}

async function findListings() {
    return client
        .db(dbName)
        .collection(collectionName)
        .find()
        .limit(10000)
        .toArray();
}

async function findListing(id) {
    for (let listing of await findListings()) {
        if (listing.id === id) {
            return listing;
        }
    }
    return null;
}

async function updateListing(id, body) {
    let newValues = {
        $set: {
            title: body.title,
            description: body.description,
            text: body.text,
            date: body.date,
        }
    }
    await client.db(dbName).collection(collectionName).updateOne({id: id}, newValues);
}

async function removeListing(id) {
    await client.db(dbName).collection(collectionName).deleteOne({id: id});
}

// ======== REST API ============

let date = require('date-and-time')
let dateFormat = 'YYYY/MM/DD HH:mm:ss';

let express = require('express');
let app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

async function validInput(body) {
    if (await findListing(body.id) != null) {
        return false;
    }

    if (!body.id || !body.title || !body.date || !body.description) {
        return false;
    }

    if (Number.isNaN(Number.parseInt(body.id))) {
        return false;
    }

    let d = date.format(new Date(body.date), dateFormat);
    if (!date.isValid(d.toString(), dateFormat)) {
        return false;
    }

    return true;
}

app.get('/news', async function (request, response) {
    response.json(await findListings());
});

app.get('/news/:id', async function (request, response) {
    try {
        let id = request.params.id;
        let listing;
        if (Number.isNaN(Number.parseInt(id)) || (listing = await findListing(id)) != null) {
            response.json(listing);
        } else {
            response.sendStatus(404);
        }
    } catch (exception) {
        response.sendStatus(404);
    }
});

app.post('/news', async function (request, response) {
    let body = request.body;

    try {
        if (await validInput(body)) {
            await addListing({
                id: body.id,
                date: date.format(new Date(body.date), dateFormat),
                title: body.title,
                description: body.description,
                text: body.text,
            });
            response.sendStatus(200);
        } else {
            response.sendStatus(422);
        }
    } catch (exception) {
        response.sendStatus(500);
    }
});

app.put('/news/:id', async function (request, response) {
    try {
        let body = request.body;
        let id = request.params.id;

        if (Number.isNaN(Number.parseInt(id)) || await findListing(id) == null) {
            response.sendStatus(404);
        } else {
            await updateListing(id, body);
            response.send(200);
        }
    } catch
        (exception) {
        response.send(500);
    }
});

app.delete('/news/:id', async function (request, response) {
    let id = request.params.id;

    try {
        if (Number.isNaN(Number.parseInt(id)) || await findListing(id) == null) {
            response.sendStatus(404);
        } else {
            removeListing(id);
            response.sendStatus(200);
        }
    } catch (exception) {
        response.send(500);
    }
});

app.listen(8080);
