let socket = new ReconnectingWebSocket("ws://127.0.0.1:24050/ws");
let mapid = document.getElementById('mapid');

let bg = document.getElementById("bg");
let title = document.getElementById("title");
let currentPP = document.getElementById("currentPP");
let ifFC = document.getElementById("ifFC");
let state = document.getElementById("state");
let hun = document.getElementById("100");
let fifty = document.getElementById("50");
let miss = document.getElementById("miss");
let cs = document.getElementById("cs");
let ar = document.getElementById("ar");
let od = document.getElementById("od");
let hp = document.getElementById("hp");
let mods = document.getElementById("mods");
const modsImgs = {
    'ez': './static/easy.png',
    'nf': './static/nofail.png',
    'ht': './static/halftime.png',
    'hr': './static/hardrock.png',
    'sd': './static/suddendeath.png',
    'pf': './static/perfect.png',
    'dt': './static/doubletime.png',
    'nc': './static/nightcore.png',
    'hd': './static/hidden.png',
    'fl': './static/flashlight.png',
    'rx': './static/relax.png',
    'ap': './static/autopilot.png',
    'so': './static/spunout.png',
    'at': './static/autoplay.png',
    'cn': './static/cinema.png',
    'v2': './static/v2.png',
}

socket.onopen = () => {
    console.log("Successfully Connected");
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!")
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};
let tempImg;
let tempCs;
let tempAr;
let tempOd;
let tempHp;
let tempTitle;
let tempMods;
let gameState;

let packetsReceived = 0;
socket.onmessage = event => {
    packetsReceived++;
    let data = JSON.parse(event.data);
    if (packetsReceived == 1) {
        console.log(`Received packet ${packetsReceived}`);
        console.log('\nDATA:\n');
        traverseJSONPacket(data);
    }
    if (tempImg !== data.menu.bm.path.full) {

        tempImg = data.menu.bm.path.full
        let img = data.menu.bm.path.full.replace(/#/g, '%23').replace(/%/g, '%25')
        // No entiendo para que es el random del ?a, lleva a la misma imagen literalmente
        bg.setAttribute('src', `http://127.0.0.1:24050/Songs/${img}?a=${Math.random(10000)}`)

        /* 
        console.log('img path: ' + data.menu.bm.path.full.replace(/#/g, '%23').replace(/%/g, '%25'))
        console.log('attribute set: ' + `http://127.0.0.1:24050/Songs/${img}?a=${Math.random(10000)}`)
        */
    }
    // Estados: https://github.com/Piotrekol/ProcessMemoryDataFinder/blob/99e2014447f6d5e5ba3943076bc8210b6498db5c/OsuMemoryDataProvider/OsuMemoryStatus.cs#L3
    if (gameState !== data.menu.state) {
        gameState = data.menu.state
        if (gameState === 2 || gameState === 7 || gameState === 14) {
            state.style.transform = "translateY(0)"
        } else {
            state.style.transform = "translateY(-50px)"
        }
    }

    // Titulo Cancion
    if (tempTitle !== data.menu.bm.metadata.artist + ' - ' + data.menu.bm.metadata.title) {
        output.style.fontSize = '30px';
        tempTitle = data.menu.bm.metadata.artist + ' - ' + data.menu.bm.metadata.title;
        title.innerHTML = tempTitle
        resize_to_fit()
    }

    // CS
    if (data.menu.bm.stats.CS != tempCs) {
        tempCs = data.menu.bm.stats.CS
        cs.innerHTML = `CS: ${Math.round(tempCs * 10) / 10} <hr>`
    }

    // AR
    if (data.menu.bm.stats.AR != tempAr) {
        tempAr = data.menu.bm.stats.AR
        ar.innerHTML = `AR: ${Math.round(tempAr * 10) / 10} <hr>`
    }
    
    // OD
    if (data.menu.bm.stats.OD != tempOd) {
        tempOd = data.menu.bm.stats.OD
        od.innerHTML = `OD: ${Math.round(tempOd * 10) / 10} <hr>`
    }

    // HP
    if (data.menu.bm.stats.HP != tempHp) {
        tempHp = data.menu.bm.stats.HP
        hp.innerHTML = `HP: ${Math.round(tempHp * 10) / 10} <hr>`
    }

    // PP
    if (data.gameplay.pp.current != '') {
        let ppData = data.gameplay.pp.current
        currentPP.innerHTML = Math.round(ppData)
    } else {
        currentPP.innerHTML = 0
    }

    // If FC
    if (data.gameplay.pp.fc != '') {
        let ppData = data.gameplay.pp.fc
        ifFC.innerHTML = Math.round(ppData)
    } else {
        ifFC.innerHTML = 0
    }

    // Hits
    if (data.gameplay.hits[100] > 0) {
        hun.innerHTML = data.gameplay.hits[100]
    } else {
        hun.innerHTML = 0
    }

    if (data.gameplay.hits[50] > 0) {
        fifty.innerHTML = data.gameplay.hits[50]
    } else {
        fifty.innerHTML = 0
    }

    if (data.gameplay.hits[0] > 0) {
        miss.innerHTML = data.gameplay.hits[0]
    } else {
        miss.innerHTML = 0
    }

    // MODS
    if (tempMods != data.menu.mods.str) {
        tempMods = data.menu.mods.str
        if (tempMods == "" || tempMods == "NM") {
            mods.innerHTML = '';
        } else {
            mods.innerHTML = '';
            let modsApplied = tempMods.toLowerCase();

            if (modsApplied.indexOf('nc') != -1) {
                modsApplied = modsApplied.replace('dt', '')
            }
            if (modsApplied.indexOf('pf') != -1) {
                modsApplied = modsApplied.replace('sd', '')
            }
            let modsArr = modsApplied.match(/.{1,2}/g);
            for (let i = 0; i < modsArr.length; i++) {
                let mod = document.createElement('div');
                mod.setAttribute('class', 'mod');
                let modImg = document.createElement('img');
                modImg.setAttribute('src', modsImgs[modsArr[i]]);
                mod.appendChild(modImg);
                mods.appendChild(mod);
            }
        }
    }
}

// Debug paquetes JSON
var callback = console.log;

function traverseJSONPacket(obj) {
    if (obj instanceof Array) {
        for (var i = 0; i < obj.length; i++) {
            if (typeof obj[i] == "object" && obj[i]) {
                callback(i);
                traverseJSONPacket(obj[i]);
            } else {
                callback(i, obj[i])
            }
        }
    } else {
        for (var prop in obj) {
            if (typeof obj[prop] == "object" && obj[prop]) {
                callback(prop);
                traverseJSONPacket(obj[prop]);
            } else {
                callback(prop, obj[prop]);
            }
        }
    }
}