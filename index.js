const express = require('express');
const axios = require('axios');
const Redis = require('redis');

const app = express();

//im goin to use a free REST APi that fetches all universities of a country
//http://universities.hipolabs.com/

//create redis client, use redisOM for object-mapping between app and redisInstance
//using localInstance on default ports so no need to pass url params
const client = Redis.createClient();
client.connect();

const EXPIRATION_TIME = 3600;

app.get('/search', async (req, res) => {
    const url =  'http://universities.hipolabs.com/search';

    const country = req.query.name;
    
    
    //add searched-data to redis cache
    key = `name?=${country}`;
    
    //check key before making request
    //check for cache-hit & cache-miss
    const cached = await client.get(key, async (err, value) => {
        if(err) {
            // cache miss  then make request
            return 'key doesnt exist';
        }

        if(value) {
            //cache hit
            return value;
        }
    });

    if(!cached)  {
        //cache miss then make request and save results to cache
        const {data} = await axios.get(url, {
            params: {
                name: country
            }
        });

        client.setEx(key, EXPIRATION_TIME, JSON.stringify(data), (err) => {
            if(err)  {
                console.log(err);
            }
        });

        return res.json(data);
    }

    res.json(JSON.parse(cached));
});

const PORT = 6060;
app.listen(PORT, ()=> {
    console.log(`Redis-crash-course runnnig on ${PORT}`);
})