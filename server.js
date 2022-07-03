const {MongoClient} = require("mongodb");
const url = "mongodb://127.0.0.1:27017";
const mongoClient = new MongoClient(url);
const dbName = "crypto_apis";
const collectionName = "news";

async function findListings(sort, title, date, id) {
    let filter;
    if (id) {
        filter = {_id: id};
    } else if (title && date) {
        filter = {title: title, date: date};
    } else if (title) {
        filter = {title: title};
    } else if (date) {
        filter = {date: date};
    } else {
        filter = {};
    }

    return mongoClient
        .db(dbName)
        .collection(collectionName)
        .find()
        .filter(filter)
        .sort(sort)
        .toArray();
}

async function findListing(id) {
    return findListings(null, null, null, id);
}

async function addListing(listing) {
    await mongoClient.db(dbName).collection(collectionName).insertOne(listing);
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
    await mongoClient.db(dbName).collection(collectionName).updateOne({_id: id}, newValues);
}

async function removeListing(id) {
    await mongoClient.db(dbName).collection(collectionName).deleteOne({_id: id});
}

// ======== REST API ============ // xxx: rm

const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const router = Router({
    prefix: '/news'
});
let bodyParser = require('koa-body');
// let validate = require('koa-validation');
app.use(bodyParser())
    // .use(validate())
    .use(router.routes())
    .use(router.allowedMethods());

let date = require('date-and-time');
let dateFormat = 'YYYY/MM/DD';

async function validInput(ctx, body) {
    // ctx.validateBody({
    //     _id: 'requiredNumeric',
    //     date: 'date',
    //     description: 'required|maxLength:100',
    //     title: 'required|maxLength:20',
    //     text: 'required'
    // })
    //
    // return ctx.validationErrors != null; // xxx: finish

    if ((await findListing(body._id)).length !== 0) {
        return false;
    }

    if (!body._id || !body.title || !body.date || !body.description || !body.text) {
        return false;
    }

    if (Number.isNaN(Number.parseInt(body._id))) {
        return false;
    }

    let d = date.format(new Date(body.date), dateFormat);
    if (!date.isValid(d.toString(), dateFormat)) {
        return false;
    }

    return true;
}

router.get('/', async ctx => {
    ctx.body = await findListings(ctx.query['sort'], ctx.query['title'], ctx.query['date']);
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
        ctx.response.status = 500;
    }
});

router.post('/', async ctx => {
    let body = ctx.request.body;

    try {
        if (await validInput(ctx, body)) {
            await addListing({
                _id: body._id,
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
    } catch (exception) {
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
