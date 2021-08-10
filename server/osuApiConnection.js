const fetch = require('node-fetch')
const fs = require('fs')
require('dotenv').config();

// osu!api authorization
let osuOAuthKey, authHeader

async function connect() {
  if (!process.env.OSU_KEY) {
    throw Error("Login error! Couldn't find the private API key (read index.js comments)")
  }

  await fetch("https://osu.ppy.sh/oauth/token", {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "grant_type": "client_credentials",
      "client_id": 8942,
      "client_secret": process.env.OSU_KEY,
      "scope": "public"
    })
  }).then(response => {
    return response.json();
  }).then(key => {
    if (key && key.access_token) {
      osuOAuthKey = key.access_token
      authHeader = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${osuOAuthKey}`
      };
    } else {
      throw Error("Login error! The OAuth key wasn't received from the API.")
    }
  });
}

async function login() {
  if (osuOAuthKey === '') {
    console.log("Already connected to the osu!API")
  } else {
    await connect().then(() => {
      console.log("Successfully connected to the osu!API")
    }).catch(err => {
      console.log("Error while logging:", err)
    })
  }
}

// Get user JSON data
async function getUserJSON(user, mode = "osu") {
  const url = new URL(`https://osu.ppy.sh/api/v2/users/${user}/${mode}`);
  let response = await fetch(url, {
    method: "GET",
    headers: authHeader,
  });

  let data = await response.json();
  return data
}

// Get the specific user data that we use in the program, aswell as the avatar and country flag
async function getUserData(user, mode = "osu") {
  let jsonData = await getUserJSON(user, mode)

  /*
    For debugging
    
    fs.writeFile("debug.txt", JSON.stringify(jsonData, null, 4), function (err) {
      if (err) {
        console.log(err);
      }
    });
  
    console.log("Avatar URL:", jsonData.avatar_url)
    console.log("Flag URL:", `https://www.countryflags.io/${jsonData.country_code}/shiny/64.png`)
  */

  let avatar = downloadImage(jsonData.avatar_url, "..\\img\\avatar.png")
  let flag = downloadImage(`https://www.countryflags.io/${jsonData.country_code}/shiny/64.png`,
    "..\\img\\flag.png")
  await Promise.all([avatar, flag]);

  console.log("Image downloading done")

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
    console.log(`Downloaded ${dest.substring(dest.lastIndexOf("\\") + 1)}`));
}

module.exports = {
  login,
  getUserData
}