const express = require('express');
const bodyParser = require('body-parser');
const SteamID = require('steamid');
const xml2js = require('xml2js');

// Caching Requests
const NodeCache = require("node-cache");
const myCache = new NodeCache();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res)=>{
  res.status(200).json({message: "Welcome to Steam Finder Rest API"});
})

// POST endpoint for SteamID conversion
app.post('/search', async (req, res) => {
  const input = req.body.steamid;

  if (myCache.has("data_" + input)) {
    console.log("Cache Data Get");
    return res.status(200).json(myCache.get("data_" + input));
  }

  if (!input) return res.status(400).json({ message: "Steamid field is missing!" });

  let steamID;
  if (input.includes('steamcommunity.com')) {
    const steamID64 = await getSteamIDFromProfileLink(input);
    steamID = new SteamID(steamID64);
  } else {
    steamID = new SteamID(input);
  }

  const response = {
    steamID3: steamID.getSteam3RenderedID(),
    steamID2: steamID.getSteam2RenderedID(),
    steamID64: steamID.getSteamID64()
  }

  console.log("Cache Data Set")
  myCache.set("data_" + input, response);

  res.status(200).json(response);

});

// Helper function to get SteamID from Steam profile link
function getSteamIDFromProfileLink(link) {
  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser();

    const steamIDRegex = new RegExp(/steamcommunity\.com\/profiles\/([0-9]+)/);

    const match = link.match(steamIDRegex);
    if (match) {
      resolve(match[1]);
    } else {
      const vanityRegex = new RegExp(/steamcommunity\.com\/id\/(.+)/);

      const vanityMatch = link.match(vanityRegex);
      if (vanityMatch) {
        const url = `https://steamcommunity.com/id/${vanityMatch[1]}/?xml=1`;
        const request = require('request');

        request(url, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            parser.parseString(body, function (err, result) {
              if (err) {
                reject(err);
              } else {
                const steamID64 = result.profile.steamID64[0];
                resolve(steamID64);
              }
            });
          } else {
            reject(error);
          }
        });
      } else {
        reject(new Error('Invalid Steam profile link'));
      }
    }
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
