$(document).ready(function() {
    var ip = '';

    $.getJSON('https://api.ipify.org?format=jsonp&callback=?', function (data) {
        ip = data.ip;
        getlocation(ip);
    });

    function getlocation(ip){
        $.getJSON('https://uh413l2v86.execute-api.us-east-2.amazonaws.com/dev/ip/'+ip, function (data) {
            getweather(data.subdivisions[0].iso_code, data.city.names.en);
        });
    }

    function getweather(state, city){
        $.getJSON('https://95q9th9l7l.execute-api.us-east-2.amazonaws.com/dev/location/'+state+'/'+city, function (data) {
            $('#topimage').attr('src', data.current_observation.icon_url);
            $('#title').text(data.current_observation.display_location.full);
            $('#temp').text(data.current_observation.temperature_string);
            $('#wind').text(data.current_observation.wind_string);
        });
    }
})
