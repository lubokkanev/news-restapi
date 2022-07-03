const {MongoClient} = require("mongodb");
const url = "mongodb://127.0.0.1:27017";
const mongoClient = new MongoClient(url);
const dbName = "crypto_apis";
const collectionName = "news";

async function addListing(listing) {
    await mongoClient.db(dbName).collection(collectionName).insertOne(listing);
}

async function findListings() {
    return mongoClient
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
    await mongoClient.db(dbName).collection(collectionName).updateOne({id: id}, newValues);
}

async function removeListing(id) {
    await mongoClient.db(dbName).collection(collectionName).deleteOne({id: id});
}

// ======== REST API ============ // xxx: rm

const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const router = Router({
    prefix: '/news'
});
let bodyParser = require('koa-body');
app.use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods());

let date = require('date-and-time')
let dateFormat = 'YYYY/MM/DD HH:mm:ss';

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

router.get('/', async ctx => {
    ctx.body = await findListings();
});

router.get('/:id', async ctx => {
    try {
        let id = ctx.params.id;
        let listing;
        if (Number.isNaN(Number.parseInt(id)) || (listing = await findListing(id)) != null) {
            ctx.body = listing;
        } else {
            ctx.response.status = 404;
        }
    } catch (exception) {
        ctx.response.status = 404;
    }
});

router.post('/', async ctx => {
    let body = ctx.request.body;

    try {
        if (await validInput(body)) {
            await addListing({
                id: body.id,
                date: date.format(new Date(body.date), dateFormat),
                title: body.title,
                description: body.description,
                text: body.text,
            });
            ctx.response.status = 200;
        } else {
            ctx.response.status = 422;
        }
    } catch (exception) {
        ctx.response.status = 500;
    }
});

router.put('/:id', async ctx => {
    try {
        let body = ctx.request.body;
        let id = ctx.request.params.id;

        if (Number.isNaN(Number.parseInt(id)) || await findListing(id) == null) {
            ctx.response.status = 404;
        } else {
            await updateListing(id, body);
            ctx.response.status = 200;
        }
    } catch
        (exception) {
        ctx.response.status = 500;
    }
});

router.delete('/:id', async ctx => {
    let id = ctx.request.params.id;

    try {
        if (Number.isNaN(Number.parseInt(id)) || await findListing(id) == null) {
            ctx.response.status = 404;
        } else {
            await removeListing(id);
            ctx.response.status = 200;
        }
    } catch (exception) {
        ctx.response.status = 500;
    }
});

mongoClient.connect();
app.listen(8080);
