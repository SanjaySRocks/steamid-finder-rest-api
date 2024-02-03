require('dotenv').config();
const express = require('express');
const SteamID = require('steamid');
const xml2js = require('xml2js');
const NodeCache = require("node-cache");

const myCache = new NodeCache();

const app = express();
const port = process.env.PORT || 3000;

// for parsing application/json
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 


const steamApiKey = process.env.STEAM_API_KEY;

class Steam{
    constructor(input){
        this.input = input;
        this.steamid = null;
        this.profileData = {};
    }

    async initSteamId()
    {
        try{

            this.steamid = this.input.includes('steamcommunity.com') 
            ? new SteamID(await this.fromProfileToId(this.input))
            : new SteamID(this.input);

            if(!this.steamid.isValid())
			    throw new Error("Enter valid steamid!");

            this.profileData.steamID3 = this.steamid.getSteam3RenderedID()
            this.profileData.steamID2 = this.steamid.getSteam2RenderedID()
            this.profileData.steamID64 = this.steamid.getSteamID64()
            
            return this
        }
        catch(err)
        {
            throw err;
        }
    }
    
    async fromProfileToId(link) {
        const steamIDRegex = /steamcommunity\.com\/profiles\/([0-9]+)/;
        const match = link.match(steamIDRegex);
    
        if (match) {
            return match[1];
        }
    
        const vanityRegex = /steamcommunity\.com\/id\/(.+)/;
        const vanityMatch = link.match(vanityRegex);
    
        if (!vanityMatch) {
            throw new Error('Invalid Steam profile link');
        }
    
        const url = `https://steamcommunity.com/id/${vanityMatch[1]}/?xml=1`;
        const response = await fetch(url);
        const body = await response.text();
    
        try {
            const result = await xml2js.parseStringPromise(body);
    
            if (result.profile && result.profile.steamID64) {
                return result.profile.steamID64[0];
            } else if (result.response && result.response.error) {
                throw new Error(result.response.error[0]);
            } else {
                throw new Error('Error in parsing data from profile!');
            }
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }
    

    async getUserInfo(API_KEY) {

        // if (!this.profileData.steamID64) {
        //     throw new Error('steamID64 is missing in profileData');
        // }
        
        const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${this.profileData.steamID64}`;
    
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const userData = await response.json();
            this.profileData.profile = userData.response.players[0];

            return this

        } catch (error) {
            throw error;
        }
    }


}


// Main Code
app.get("/", (req, res) => {
	res.status(200).json({ message: "Welcome to Steam Finder Rest API", version: "1.2.2" });
})


// POST endpoint for SteamID conversion
app.post('/search', async (req, res) => {
	const input = req.body.steamid;
    
    if (!input) return res.status(200).json({ message: "Steamid field is missing!" });
	
    if (myCache.has("data_" + input)) {
		// console.log("Cache Data Get");
		return res.status(200).json(myCache.get("data_" + input));
	}


	try {
        const result = new Steam(input)
        await result.initSteamId()
        await result.getUserInfo(steamApiKey)

        response = result.profileData 

        // console.log("Cache Data Set")
		myCache.set("data_" + input, response);
		// console.log("Cache Keys: ", myCache.keys());

		res.status(200).json(response);
	}
	catch (error) {
		res.status(200).json({ message: "Something went wrong!", error: error.message });
	}
});




// Start the server
app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});
