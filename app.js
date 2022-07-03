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

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/news', async function (request, response) {
    let listings = await findListings();
    response.json(listings);
});

app.get('/news/:id', async function (request, response) {
    let newsId = request.params.id;
    try {
        let listing = await findListing(newsId);
        if (listing != null) {
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
    // xxx: add validation
    try {
        let listing = await findListing(body.id);
        if (listing != null) {
            response.sendStatus(422);
        } else {
            addListing({
                id: body.id,
                date: body.date,
                title: body.title,
                description: body.description,
                text: body.text,
            });
            response.sendStatus(200);
        }
    } catch (exception) {
        response.sendStatus(500);
    }
});

app.put('/news/:id', async function (request, response) {
    let body = request.body;
    let id = request.params.id;

    try {
        let listing = await findListing(id);
        if (listing == null) {
            response.sendStatus(404);
        } else {
            updateListing(id, body);
            response.send(200);
        }
    } catch (exception) {
        response.send(500);
    }
});

app.delete('/news/:id', async function (request, response) {
    let id = request.params.id;
    
    try {
        let listing = await findListing(id);
        if (listing == null) {
            response.sendStatus(404);
        } else {
            removeListing(id);
            response.sendStatus(200);
        }
    } catch (exception) {
        response.send(500);
    }
});

app.listen(8080); //to port on which the express server listen
