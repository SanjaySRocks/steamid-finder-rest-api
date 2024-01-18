# Steam Finder Rest API

## Endpoints
### /search (POST)
### Body
```
{
  "steam"="https://steamcommunity.com/id/Doppler9123/"
}
```

### Response json 
```
{
    "steamID3": "[U:1:93616676]",
    "steamID2": "STEAM_0:0:46808338",
    "steamID64": "76561198053882404",
    "profile": {
        "steamid": "76561198053882404",
        "communityvisibilitystate": 3,
        "profilestate": 1,
        "personaname": "#Sanjay",
        "commentpermission": 1,
        "profileurl": "https://steamcommunity.com/id/Doppler9123/",
        "avatar": "https://avatars.steamstatic.com/371dabff15825c2d4c7b5bf304eb48aa0c3ba7b2.jpg",
        "avatarmedium": "https://avatars.steamstatic.com/371dabff15825c2d4c7b5bf304eb48aa0c3ba7b2_medium.jpg",
        "avatarfull": "https://avatars.steamstatic.com/371dabff15825c2d4c7b5bf304eb48aa0c3ba7b2_full.jpg",
        "avatarhash": "371dabff15825c2d4c7b5bf304eb48aa0c3ba7b2",
        "personastate": 0,
        "realname": "Майкл",
        "primaryclanid": "103582791440076637",
        "timecreated": 1322980407,
        "personastateflags": 0,
        "loccountrycode": "KZ"
    }
}

```

## Request
### NodeJS - Axios

```
const axios = require('axios');
const qs = require('qs');
let data = qs.stringify({
  'steamid': 'https://steamcommunity.com/id/Doppler9123/' 
});

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'localhost:3000/search',
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});

```
