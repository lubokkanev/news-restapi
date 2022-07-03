# News REST API
## Requirements

* node.js 18
* mongodb 4.7
* koa 10.1.1

## Setup
```
npm install
docker build . -t <username>/crypto-apis
```

## Start
```
docker run -p 49060:8080 -d <username>/crypto-apis
```

## Test

http://0.0.0.0:49060/news

#### Sample REST calls
```
curl -i -X GET http://0.0.0.0:49060/news -H "content-type:application/json"
```

```
curl -i -X POST http://0.0.0.0:49060/news -H "content-type:application/json" -d '{ "_id": "10", "date": "10-01-2022", "description": "descr", "text": "text", "title": "titleX" }'
```
