// make http request to NASA astronomy pic of the day API
// save image to file/serve image to client

const http = require('http')
const https = require('https')
const fs = require('fs')
const stream = require('stream').Transform;

const API_KEY = 'OB8tSrfWQTqW6UiAclon9eyaaNiJZpwsKh0C8Mr7';
const PATH = '/planetary/apod?';
// api url: 'https://api.nasa.gov/planetary/apod'


// generate query string from object
const params = new URLSearchParams({
    api_key: API_KEY,
    thumbs: 'True',
    date: "", // BUG -- get date from url query param
});
const options = {
    hostname: "api.nasa.gov",
    path: PATH,//params,
    protocol: 'https:',
};
const APOD_URL = 'https://api.nasa.gov/planetary/apod?'+params;


const PORT = 3000;
// BUG -- get SSL key and use https
const myServer = http.createServer(function(req, res) {
    reqParams = new URLSearchParams(req.url.slice(1));
    // if url is .jpeg extension
    if (req.url.split(".").pop() == "jpeg") {
        fs.readFile(__dirname+'/'+ req.url.split("/").pop(), (err, content) => {
            if (err) throw err; // BUG -- does this before saveimage
            res.writeHead(200, {'Content-Type':'image/jpeg'});
            res.end(content);
        });
    // if url is not .jpeg or favicon
    } else if (req.url != '/favicon.ico') {
        //console.log(reqParams);
        reqDate = reqParams.get('date'); // date requested from client
        if (reqDate == null) {
            let now = new Date(Date.now());
            reqDate = '2000-03-23'; // default date
        }
        // validate reqDate
        params.set("date", reqDate);
        options.path = PATH + params;

        // define imgName
        let imgName = '/apod-' + reqDate + '.jpeg';
        try {
            fs.accessSync(__dirname + imgName); // throws error if can't access
            console.log('image ' + imgName + ' already created.');
            respondURL(res,imgName);
        } catch (err) {
            console.log('image not found. creating now...');
            requestImage( res, imgName, (imageURL) => {
                saveImage(imageURL, imgName, () => {
                    respondURL(res, imgName);
                })
            });
        }
    }
});
myServer.listen(PORT, () => console.log('server listening on port '+PORT));

function respondURL(res, url) {

    res.writeHead(200, {'Content-Type':'text/plain'});
    res.writeHead(200, {"Access-Control-Allow-Origin":"*"});
    res.end(url);

}

function requestImage(res, url, callback) {
    https.get(options, function(response) {
        //https.get(APOD_URL, function(response) {
        let data = "";
        // concat each chunk of data into string
        response.on("data", function(chunk) {
            data += chunk;
        });
        response.on("end", function() {
            // full data received, now use it
            dataJson = JSON.parse(data);
            //console.log(dataJson);

            let imageURL = "";
            let keys = Object.keys(dataJson);
            if (keys.includes("thumbnail_url")) {
                imageURL = dataJson.thumbnail_url;
            } else {
                imageURL = dataJson.hdurl;
            }
            //saveImage(imageURL, "/apod-"+params.get("date")+".jpeg");
            // BUG -- clear out old images
            callback(imageURL);

        }); //end of response.on() -> full response received
    }).on("error", function(err) {
        // on error from ClientRequest
        console.log("error on get JSON: "+err.message);
    });//end of https.get.on()
}

// get apod image from url and save it to a file
function saveImage(imageURL, imgName, callback) {
    https.get(imageURL, function(imageResponse) {
        //let img = "";
        if(imageResponse.statusCode ===200 &&
            imageResponse.headers['content-type'] ==='image/jpeg') {

            let img = new stream(); //what is stream?
            imageResponse.on("data", function(chunk) {
                //img += chunk;
                img.push(chunk);
            });
            imageResponse.on("end", function() {
                // save image to file
                fs.writeFile(__dirname + imgName, img.read(), () => {
                    callback();
                });
                console.log('image saved.');
            });
        } else {
            console.log("could not get image: " +imageResponse.statusCode);
        }
    }).on("error", function(err) {
        console.log("error on get image: "+err.message);
    });
}

