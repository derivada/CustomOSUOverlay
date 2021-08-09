const fetch = require("node-fetch")
const fs = require('fs')
require('dotenv').config();

// osu!api authorization
let osuOAuthKey

async function connect() {
  const osuApiKey = process.env.OSU_KEY
  console.log(osuApiKey)
  await fetch("https://osu.ppy.sh/oauth/token", {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "grant_type": "client_credentials",
      "client_id": 8942,
      "client_secret": osuApiKey,
      "scope": "public"
    })
  }).then(response => {
    return response.json();
  }).then(key => {
    if (key != null || key.access_token != null) {
      osuOAuthKey = key.access_token
    }
  });
}

// Get basic beatmap information
function getBeatmap(id) {
  let headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${osuOAuthKey}`
  };
  console.log("GET https://osu.ppy.sh/api/v2/beatmaps/" + id)
  console.log(headers.Authorization)
  return fetch("https://osu.ppy.sh/api/v2/beatmaps/" + id, {
    method: "GET",
    headers,
  }).then(response => response.json());
}

// Get my user data
async function getUserJSON(user, mode = "osu") {
  const url = new URL(
    `https://osu.ppy.sh/api/v2/users/${user}/osu`
  );
  /*
    let params = {
      "key": user,
    };
    
    Object.keys(params)
      .forEach(key => url.searchParams.append(key, params[key]));
  */
  let headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${osuOAuthKey}`
  };

  let response = await fetch(url, {
    method: "GET",
    headers,
  });
  let data = await response.json();
  return data
}


async function getUserData(user, mode = "osu") {
  let jsonData = await getUserJSON(user, mode)
  let avatar = downloadImage(jsonData.avatar_url, "..\\img\\avatar.png")
  let flag = downloadImage(`https://www.countryflags.io/${jsonData.country_code}/shiny/64.png`,
    "..\\img\\flag.png")
  await Promise.all([avatar, flag]);
  console.log("Image download done, sending data...")
  return {
    username: jsonData.username,
    country: jsonData.country.name,
    global_rank: jsonData.statistics.global_rank,
    country_rank: jsonData.statistics.country_rank,
    pp: jsonData.statistics.pp
  }
}

async function downloadImage(url, dest) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  fs.writeFile(dest, buffer, () =>
    console.log('finished downloading!'));
}


async function login() {
  if (osuOAuthKey === '') {
    console.log("Already connected")
  } else {
    await connect()
    console.log("Sucessfully connected")
  }
}


module.exports = {
  login,
  getBeatmap,
  getUserJSON,
  getUserData
}