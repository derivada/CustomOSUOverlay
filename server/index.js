/* 
 * This node.js "backend" listens to WebSocket data streamed from gosumemory! (port 24050). When it detects a player (upon entering
 * a replay) it logs in to the osu!API and sends a request to get detailed data from the user (username, avatar, country, 
 * global rank, country rank and pp). This is done because this data is not streamed from gosumemory! since it needs
 * osu!API authentication.
 *
 * The avatar and country glag are fetched and saved at the img/ folder.
 * The data is sent from the server through port 24051 to the frontend that was registered before. 
 *
 * In order to connect to the osu!API one must specify its private API key in a .env file at this golder,
 * this should be of the format OSU_KEY=usd9f87JSFojuf908FJLSKFJ 
 */

const WebSocket = require('ws')
const osu = require("./osuApiConnection.js")

const inputURL = "ws://127.0.0.1:24050/ws"
const inputSocket = new WebSocket(inputURL) // data from gosumemory!

let client // The frontend UI client
const server = new WebSocket.Server({
  port: 24051
});
let lastPlayer = ''
let playerData

const sendRate = 1000
let dataSender
let packetsSent = 0

let lastMapID

inputSocket.onmessage = (e) => {
  let data = JSON.parse(e.data),
    gameplay = data.gameplay,
    menu = data.menu

  /*
  TODO if leaderboard is implemented
  if (menu.bm.id != lastMapID) {
    console.log("New beatmap detected, fetching leadeboard")
    lastMapID = menu.bm.id
    osu.login().then((info) => {
      console.log(info)
      osu.getBeatmapScores(lastMapID)
    }).then(data => {
      console.log("Leaderboard ready")
    }).catch(err => console.log("Error fetching leaderboards:", err))
  }*/

  if (gameplay.name != lastPlayer) {
    if (dataSender) {
      // Stop sending data while we fetch the new one
      clearInterval(dataSender)
      packetsSent = 0
      console.log("Stopped sending data, fetching new player...")
    }
    lastPlayer = gameplay.name
    if (lastPlayer != '') {
      console.log("New player:", gameplay.name)
      // Do API request
      osu.login().then(() => osu.getUserData(gameplay.name)).then(userData => {
        // Send sample data to frontend client
        console.log("Sending data...")
        // Send the fresh data every second. I'm bad at naming
        playerData = JSON.stringify(userData)
        dataSender = setInterval(sendData, sendRate);
      }).catch(err => console.log(err.message))
    } else {
      console.log('End of replay, player dissappeared...')
    }
  }
}

function sendData() {
  try {
    // Make sure data is a valid JSON string
    JSON.parse(playerData);
    if (client) {
      client.send(playerData)
      packetsSent++
      process.stdout.write(`${lastPlayer} data sent (${packetsSent})\r`);
      //console.log(`Sent data (${packetsSent})`)
    }
  } catch (e) {
    console.log("Can't send data, not valid JSON");
    console.log(playerData)
  }
}

// We are only allowing one client, could be changed if needed 
server.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('Received message:', message);
  });

  console.log('Client connected');
  client = ws
});