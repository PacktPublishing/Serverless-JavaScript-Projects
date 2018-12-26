$(document).ready(function() {
    var ip = '';

    $.getJSON('https://api.ipify.org?format=jsonp&callback=?', function (data) {
        //console.log(JSON.stringify(data, null, 2));
        ip = data.ip;
        getlocation(ip);
    });

    function getlocation(ip){
        $.getJSON('https://uh413l2v86.execute-api.us-east-2.amazonaws.com/dev/ip/'+ip, function (data) {
            //console.log(JSON.stringify(data, null, 2));
            getweather(data.subdivisions.iso_code, data.city.names.en);
        });
    }

    function getweather(state, city){
        $.getJSON('https://95q9th9l7l.execute-api.us-east-2.amazonaws.com/dev/location/'+state+'/'+city, function (data) {
            console.log(JSON.stringify(data, null, 2));
            //ip = data.ip;
        });
    }
})
