
async function getUserInfo(steamID64, API_KEY) {
    const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${API_KEY}&steamids=${steamID64}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const userData = await response.json();
        return userData;
    } catch (error) {
        throw error;
    }
}



module.exports = {
    getUserInfo
};
