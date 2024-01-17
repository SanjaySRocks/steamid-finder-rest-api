const express = require('express');
const bodyParser = require('body-parser');
const SteamID = require('steamid');
const xml2js = require('xml2js');

// Caching Requests
const NodeCache = require("node-cache");
const { getUserInfo } = require('./steamFunctions');
const myCache = new NodeCache();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res.status(200).json({ message: "Welcome to Steam Finder Rest API" });
})


// POST endpoint for SteamID conversion
app.post('/search', async (req, res) => {
	const input = req.body.steamid;

	if (myCache.has("data_" + input)) {
		console.log("Cache Data Get");
		return res.status(200).json(myCache.get("data_" + input));
	}

	if (!input) return res.status(400).json({ message: "Steamid field is missing!" });

	try {

		let steamID;
		if (input.includes('steamcommunity.com')) {

			const steamID64 = await getSteamIDFromProfileLinkV2(input);
			steamID = new SteamID(steamID64);
		} else {
			steamID = new SteamID(input);
		}

		if(!steamID.isValid())
			throw new Error("Enter valid steamid!");

		const details = await getUserInfo(steamID.getSteamID64(), "D6B52829DA66DFD1EE4D7A8BE956DE9E");

		const response = {
			steamID3: steamID.getSteam3RenderedID(),
			steamID2: steamID.getSteam2RenderedID(),
			steamID64: steamID.getSteamID64(),
			details: details.response.players[0]
		}

		console.log("Cache Data Set")
		myCache.set("data_" + input, response);
		// console.log("Cache Keys: ", myCache.keys());

		res.status(200).json(response);
	}
	catch (error) {
		res.status(500).json({ message: "Something went wrong!", error: error.message });
	}
});

function getSteamIDFromProfileLinkV1(link) {
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
                            if (result.profile.steamID64[0]) {
                                // return steamid64
                                resolve(result.profile.steamID64[0]);
                            }
                            else if (result.response.error) {
                                reject(new Error(result.response.error[0]));
                            }
                            else {
                                reject(new Error("Error in parsing data from profile!"));
                            }
                        });
                    } else {
                        reject(new Error(error));
                    }
                });
            } else {
                reject(new Error('Invalid Steam profile link'));
            }
        }
    });
}


async function getSteamIDFromProfileLinkV2(link) {
    try {
        const steamIDRegex = /steamcommunity\.com\/profiles\/([0-9]+)/;
        const match = link.match(steamIDRegex);

        if (match) {
            return match[1];
        }

        const vanityRegex = /steamcommunity\.com\/id\/(.+)/;
        const vanityMatch = link.match(vanityRegex);

        if (vanityMatch) {
            const url = `https://steamcommunity.com/id/${vanityMatch[1]}/?xml=1`;
            const response = await fetch(url);
            const body = await response.text();

            const result = await xml2js.parseStringPromise(body);

            if (result.profile && result.profile.steamID64) {
                return result.profile.steamID64[0];
            } else if (result.response && result.response.error) {
                throw new Error(result.response.error[0]);
            } else {
                throw new Error("Error in parsing data from profile!");
            }
        } else {
            throw new Error('Invalid Steam profile link');
        }
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}


// Start the server
app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});
