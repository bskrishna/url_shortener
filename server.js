var express = require('express');
var app = express();
var dbClient = require('mongodb').MongoClient;
var mongoUrl = process.env.MONGODB_URI;
var responseObj;
var reqObj;

function searchAndInsert (err, documents) 
{
    if(documents.length === 0) {
        collectn.insert(
                {
                    originalUrl: reqObj.originalUrl,
                    shortUrl: reqObj.headers.host.split(':')[0]+
            '/'+Date.now()
                }, function (err, data) {
                    if(err) throw err;
                    responseObj.send(data.ops[0].shortUrl);
                });
    } else {
        responseObj.send(documents[0].shortUrl);
    }
}

function redirectFunc(err, documents)
{
    if(documents.length === 0) {
        responseObj.send("Invalid short URL");
    } else {
        console.log('redir to: '+documents[0].originalUrl.substr(1));
        responseObj.writeHead(301,
                  {Location: documents[0].originalUrl.substr(1)}
                );
        responseObj.end();
    }
}

function handleShortUrl(req, res) 
{
    responseObj = res;
    dbClient.connect(mongoUrl, 
            function(err, db){
                if(err) throw err;
                collectn = db.collection('url');
                collectn.find({shortUrl: req.headers.host.split(':')[0]+req.originalUrl},
                    {originalUrl:1,
                        _id:0}).toArray(redirectFunc);
            });
}

app.get(new RegExp('^/https?:\/\/[a-z]+[0-9]*[a-z]*\.[a-z]{2,}','i'), 
        function(req, res, next) {
            reqObj = req;
            responseObj = res;
            dbClient.connect(mongoUrl, 
                function(err, db){
                if(err) throw err;
                collectn = db.collection('url');
                collectn.find({originalUrl: req.originalUrl},
                    {shortUrl:1,
                        _id:0}).toArray(searchAndInsert);
                });
        });
app.get(new RegExp('^/[0-9]+$', 'i'), handleShortUrl);
app.all('*', function(req,res) {
    res.send('Invalid URL');
});
app.listen(process.env.PORT||8080, function() {
});

