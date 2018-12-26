'use strict';

module.exports.hello = (event, context) => {
  const SECRET_KEY = process.env.secretkey

  let http = require('https');

  let body = ''

  let url = `https://api.wunderground.com/api/${SECRET_KEY}/forecast/geolookup/conditions/q/${event.state}/${event.city}.json`

   http.get(url, (res) => {
     res.on('data', (d) => 
     {
       body += d
     })
     res.on('end', () => {
       context.succeed(JSON.parse(body))
     })
     res.on('error', (err) => {
       context.fail("err: " + err.message)
     })
   })

};
