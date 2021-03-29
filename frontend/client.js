const SERVER_HOST = "http://localhost:3000/"; // change to real server

window.addEventListener('load', function() {
    const btn = document.getElementById("date-btn");

    btn.addEventListener('click', function() {
        //console.log(document.getElementById("date-input").value);
        queries = '?date='+ document.getElementById("date-input").value
        console.log(SERVER_HOST+queries);

        xhr = new XMLHttpRequest();
        xhr.open('GET', SERVER_HOST+queries);
        xhr.send();

        xhr.addEventListener("load", function(event) {
            console.log("loading..");
            document.getElementById("apod").setAttribute("src", event.target.responseText);
            console.log(document.getElementById("apod").getAttribute("src"));
        }); //end xhr load listener
    }); // end btn click listener
}); // end window load listener