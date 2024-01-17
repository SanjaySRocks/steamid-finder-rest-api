const https = require('https');

function getUserInfo(steamID64, API_KEY) {
    const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${steamID64}`;

    return new Promise((resolve, reject) => {
        https.get(apiUrl, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const userData = JSON.parse(data);
                    resolve(userData);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}


module.exports = {
    getUserInfo
};
