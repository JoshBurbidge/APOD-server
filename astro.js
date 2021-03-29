// make http request to NASA astronomy pic of the day API
// save image to file/serve image to client

const http = require('http')
const https = require('https')
const fs = require('fs')
const stream = require('stream').Transform;

const API_KEY = 'SG35ljk5f4q4NooWub8MpYVWDagXggEDgbXVhnYO';
const PATH = '/planetary/apod?';
// api url: 'https://api.nasa.gov/planetary/apod'
// var DATE = '2000-03-20';

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
            //reqDate = now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate();
        }
        // validate reqDate
        params.set("date", reqDate);
        options.path = PATH+params;

        // define imgName
        let imgName = '/apod-'+reqDate+'.jpeg';
        try {
            fs.accessSync(__dirname + imgName); // throws error if can't access
            console.log('image '+imgName+ ' already created.');
        } catch (err) {
            console.log('image not found. creating now...');
            requestImage();
        }

        // BUG -- make this return JSON with url included
        setTimeout( () => {
            res.writeHead(200, {'Content-Type':'text/plain'});
            res.writeHead(200, {"Access-Control-Allow-Origin":"*"});
            let url = __dirname+imgName; // relative url
            // BUG -- maybe make server respond with jpeg
            //let url = 'http://localhost:3000'+imgName; // abs url to this server
            res.end(url);
        }, 1000);
    }

    // might readfile before created bc of async, rearrange this
    // respond with jpeg image
    /*
    setTimeout( () => {
        fs.readFile(__dirname + imgName, (err, content) => {
            if (err) throw err;
            res.writeHead(200, {'Content-Type':'image/jpeg'});
            //res.writeHead(200, {'Content-Type':'text/html'});
            res.end(content);
        });
    }, 1000); */
});
myServer.listen(PORT, () => console.log('server listening on port '+PORT));

// get apod image from url and save it to a file
function saveImage(imageURL, imgName) {
    https.get(imageURL, function(imageResponse) {
        //let img = "";
        if(imageResponse.statusCode ==200 && 
            imageResponse.headers['content-type'] =='image/jpeg') {

            let img = new stream(); //what is stream?
            imageResponse.on("data", function(chunk) {
                //img += chunk;
                img.push(chunk);
            });
            imageResponse.on("end", function() {
                // save image to file
                fs.writeFileSync(__dirname + imgName, img.read());
                console.log('image saved.');
            });
        } else {
            console.log("could not get image: " +imageResponse.statusCode);
        }
    }).on("error", function(err) {
        console.log("error on get image: "+err.message);
    });
}

function requestImage() {
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
            //saveImage(imageURL, imgName);
            saveImage(imageURL, "/apod-"+params.get("date")+".jpeg");
    
            // BUG -- clear out old images
    
        }); //end of response.on() -> full response received
    }).on("error", function(err) {
        // on error from ClientRequest
        console.log("error on get JSON: "+err.message);
    });//end of https.get.on()
}