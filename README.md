# News REST API
## Requirements

* node.js 18
* mongodb 4.7
* koa 10.1.1
* docker 20.10

## Setup
Set `dbUrl` in server.js

Start your mongo DB

## Start
```bash
docker-compose up -d
```

## Test

http://localhost:49060/news

#### Sample REST calls
```bash
curl -i -X POST http://localhost:49060/news -H "content-type:application/json" -d '{ "_id": "10", "date": "10-01-2022", "description": "descr", "text": "text", "title": "titleX" }'
```

```bash
curl -i -X GET http://localhost:49060/news/10 -H "content-type:application/json"
```
## Stop

```bash
docker-compose down
```
