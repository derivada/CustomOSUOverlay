/* osu! custom overlay by derivadas */
/*
    Dependencies used:
    - reconnecting-websocket.js (For socket management)
    - countUp.js (For regular counter updating)
    - odomtr.js (For smooth counter updating)
    - chart.js (For SR chart)
*/

/* Socket management */

let socket = new ReconnectingWebSocket("ws://127.0.0.1:24050/ws")
socket.onopen = () => {
    console.log("Successfully Connected")
}

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event)
    socket.send("Client Closed!")
}

socket.onerror = error => {
    console.log("Socket Error: ", error)
}

/* HTML Elements */

// Game state
let state = document.getElementById("state")

// Map data
let mapid = document.getElementById("mapid")
let bg = document.getElementById("bg")
let title = document.getElementById("title")
let artist = document.getElementById("artist")
let diff = document.getElementById("diff")
let cs = document.getElementById("cs")
let ar = document.getElementById("ar")
let od = document.getElementById("od")
let hp = document.getElementById("hp")
let mods = document.getElementById("mods")
let sr = document.getElementById("sr")
let fcPP = document.getElementById("fcPP")
let accBG = document.getElementById("accBG")

// Acc section counters
let threehun = document.getElementById("300")
let hun = document.getElementById("100")
let fifty = document.getElementById("50")
let miss = document.getElementById("miss")
let sb = document.getElementById("sb")
let ur = document.getElementById("ur")
let grade = document.getElementById("grade")
let acc = document.getElementById("acc")
let accDecimals = document.getElementById("accDecimals")

// PP and Combo section counters
let pp = document.getElementById("pp")
let combo = document.getElementById("combo")

// CountUp animation objects
// var CountUp = function(target, startVal, endVal, decimals, duration, options)

let accAnimation = {
    acc: new CountUp('acc', 0, 100, 0, 0.1, {
        useEasing: false,
        useGrouping: false,
        separator: " ",
        
    }),
};
let accDecimalsAnimation = {
    acc: new CountUp('accDecimals', 0, 100, 0, 0.1, {
        useEasing: false,
        useGrouping: false,
        separator: " ",
        prefix: ".",
        suffix: " %"
    }),
};
let urAnimation = {
    ur: new CountUp('ur', 0, 100, 0, 1, {
        decimalPlaces: 2,
        useEasing: true,
        useGrouping: false,
        separator: " ",
        formattingFn: (n) => "a"
    }),
}

let ppAnimation = {
    pp: new CountUp('pp', 0, 100, 0, 1, {
        decimalPlaces: 2,
        useEasing: true,
        useGrouping: false,
        separator: " ",
        suffix: "pp"
    }),
}

let comboAnimation = {
    combo: new CountUp('combo', 0, 100, 0, 1, {
        decimalPlaces: 2,
        useEasing: true,
        useGrouping: false,
        separator: " ",
        suffix: "x"
    }),
}

/* Key section backgrounds */
let xKey = document.getElementById("xKey")
let zKey = document.getElementById("zKey")

/* Key section counters */
let x = document.getElementById("x")
let z = document.getElementById("z")

// Mod Icons
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

// Temporal (last-updated) values
let imgValue // Background image
let titleValue
let artistValue
let csValue
let arValue
let odValue
let hpValue
let modsValue
let srValue // Full map Star Rating
let stateValue
let diffValue
let gradeValue
let accValue
let urValue

let ppValue
let comboValue
let strainsValues
let modsValues

let value100 = 0
let value50 = 0
let valueMiss = 0
let valueSB = 0

let completion = 0
let completionTemp = 0
let mapTime
let lastTime

let valueUR = 0

let k1Count, k1State
let k2Count, k2State

// Initialize Star Rating chart
let SRChart
createChart()
const CHART_DETAIL = 100

// Packet number for current replay
let packetNumber = 0

// On new data
socket.onmessage = event => {

    // Data JSON example: https://github.com/l3lackShark/gosumemory/wiki/JSON-values
    // Game States list: https://github.com/Piotrekol/ProcessMemoryDataFinder/blob/99e2014447f6d5e5ba3943076bc8210b6498db5c/OsuMemoryDataProvider/OsuMemoryStatus.cs#L3
    let data = JSON.parse(event.data),
        menu = data.menu,
        map = menu.bm,
        gameplay = data.gameplay,
        hdfl = (data.menu.mods.str.includes("HD") || data.menu.mods.str.includes("FL") ? true : false)

    if (menu.state == 2) {
        packetNumber++
    } else {
        packetNumber = 0
    }
    // Map ID
    if (mapid !== map.id) {
        // Debug packet data
        console.log('\nNEW MAPA DATA:\n')
        traverseJSONPacket(data)

        mapid = map.id

        // SR Graph (heavy comparison, only checking after Map ID change, may not update when switching difficulties)
        if (strainsValues !== menu.pp.strains) {
            strainsValues = menu.pp.strains
            refreshChart(strainsValues)
        }
    }

    // Time Management
    if (mapTime !== map.time.full - map.time.firstObj) {
        mapTime = map.time.full - map.time.firstObj
    }
    if (lastTime !== map.time.current) {
        lastTime = map.time.current
        completionTemp = parseFloat((lastTime / mapTime).toFixed(3))
        if (completionTemp > 1.0)
            completionTemp = 1.0
        if (completionTemp < 0.0)
            completionTemp = 0.0
        if (completionTemp !== completion) {
            completion = completionTemp
            SRChart.update()
        }
    }

    // Update keys 
    updateKeys(gameplay.keyOverlay);

    // Background image
    if (imgValue !== map.path.full) {
        imgValue = map.path.full
        let img = map.path.full.replace(/#/g, '%23').replace(/%/g, '%25')

        // Not sure what the ?a= part is doing
        let imgPath = `http://127.0.0.1:24050/Songs/${img}?a=${Math.random(10000)}`
        accBG.setAttribute('src', imgPath)
        setCustomColors(imgPath)
    }

    // Song title
    if (titleValue !== map.metadata.title) {
        titleValue = map.metadata.title
        //title.innerHTML = titleValue
    }

    // Song artist
    if (artistValue !== map.metadata.artist) {
        artistValue = map.metadata.artist
        //artist.innerHTML = artistValue
    }

    // Map difficulty
    if (diffValue !== map.metadata.difficulty) {
        diffValue = map.metadata.difficulty
        //diff.innerHTML = diffValue
    }

    // SR
    if (map.stats.fullSR != srValue) {
        srValue = map.stats.fullSR
        console.log('SR: ' + srValue)
        //sr.innerHTML = srValue
    }
    // CS
    if (map.stats.CS != csValue) {
        csValue = map.stats.CS
        //cs.innerHTML = Math.round(csValue * 10) / 10
    }

    // AR
    if (map.stats.AR != arValue) {
        arValue = map.stats.AR
        //ar.innerHTML = Math.round(arValue * 10) / 10
    }

    // OD
    if (map.stats.OD != odValue) {
        odValue = map.stats.OD
        //od.innerHTML = Math.round(odValue * 10) / 10
    }

    // HP
    if (map.stats.HP != hpValue) {
        hpValue = map.stats.HP
        //hp.innerHTML = Math.round(hpValue * 10) / 10
    }

    // Current PP
    if (gameplay.pp.current != ppValue) {
        ppValue = data.gameplay.pp.current
        ppAnimation.pp.update(ppValue)
    }

    // Current combo
    if (gameplay.combo.current != comboValue) {
        comboValue = data.gameplay.combo.current
        comboAnimation.combo.update(comboValue)
    }

    // Hits: 100, 50, miss, sliderbreak
    if (gameplay.hits[100] != value100) {
        value100 = gameplay.hits[100]
        hun.innerHTML = value100
    }

    if (gameplay.hits[50] != value50) {
        value50 = gameplay.hits[50]
        hun.innerHTML = value50
    }

    if (gameplay.hits[0] != valueMiss) {
        valueMiss = gameplay.hits[0]
        hun.innerHTML = valueMiss
    }

    if (gameplay.hits.sliderBreaks != valueSB) {
        valueSB = gameplay.hits.sliderBreaks
        hun.innerHTML = valueSB
    }

    // Play grade (SS, S, A...)
    if (data.gameplay.hits.grade.current !== gradeValue) {
        gradeValue = data.gameplay.hits.grade.current
        grade.innerHTML = gradeValue
        updateGradeStyle(gradeValue, hdfl)
    }

    // Accuracy
    if (data.gameplay.accuracy !== accValue) {
        accValue = data.gameplay.accuracy
        accAnimation.acc.update(Math.floor(accValue))
        accDecimalsAnimation.acc.update(((accValue % 1) * 100).toFixed(0))
    }

    // UR
    if (data.gameplay.hits.unstableRate != valueUR) {
        valueUR = data.gameplay.hits.unstableRate
        urAnimation.ur.update(valueUR)
    }

    // Mods
    /*
    if (modsValues != menu.mods.str) {
        modsValues = menu.mods.str
        if (modsValues == "" || modsValues == "NM") {
            mods.innerHTML = ''
        } else {
            mods.innerHTML = ''
            let modsApplied = modsValues.toLowerCase()

            if (modsApplied.indexOf('nc') != -1) {
                modsApplied = modsApplied.replace('dt', '')
            }
            if (modsApplied.indexOf('pf') != -1) {
                modsApplied = modsApplied.replace('sd', '')
            }
            let modsArr = modsApplied.match(/.{1,2}/g)
            for (let i = 0; i < modsArr.length; i++) {
                let mod = document.createElement('div')
                mod.setAttribute('class', 'mod')
                let modImg = document.createElement('img')
                modImg.setAttribute('src', modsImgs[modsArr[i]])
                mod.appendChild(modImg)
                mods.appendChild(mod)
            }
        }
    }
    */
}

// Debug JSON packets
function traverseJSONPacket(obj) {
    if (obj instanceof Array) {
        for (var i = 0; i < obj.length; i++) {
            if (typeof obj[i] == "object" && obj[i]) {
                console.log(i)
                traverseJSONPacket(obj[i])
            } else {
                console.log(i, obj[i])
            }
        }
    } else {
        for (var prop in obj) {
            if (typeof obj[prop] == "object" && obj[prop]) {
                console.log(prop)
                traverseJSONPacket(obj[prop])
            } else {
                console.log(prop, obj[prop])
            }
        }
    }
}

// Update the play grade styling (SSH/SH white, SS/S yellow, A green...)
function updateGradeStyle(hitGrade, hdfl) {
    let color, shadow
    switch (hitGrade) {
        case "SS":
        case "S":
            color = (hdfl ? "#e0e0e0" : "#d6c253")
            shadow = (hdfl ? "0 0 0.5rem #e0e0e0" : "0 0 0.5rem #d6c253")
            break
        case "A":
            color = "#7ed653"
            shadow = "0 0 0.5rem #7ed653"
            break
        case "B":
            color = "#53d4d6"
            shadow = "0 0 0.5rem #53d4d6"
            break
        case "C":
            color = "#d6538e"
            shadow = "0 0 0.5rem #d6538e"
            break
        case "D":
            color = "#f04848"
            shadow = "0 0 0.5rem #f04848"
            break
        default:
            color = (hdfl ? "#ffffff" : "#d6c253")
            shadow = (hdfl ? "0 0 0.5rem #ffffff" : "0 0 0.5rem #d6c253")
            break
    }
    grade.style.color = color
    grade.style.textShadow = shadow
}

// Create the SR chart
function createChart() {
    // Dataset properties
    let data = {
        labels: [1, 2, 3],
        datasets: [{
                label: 'PP',
                borderColor: 'rgba(255, 0, 0, 0)',
                /* PP Graph WIP set opacity to 1 to show */
                data: [1, 2, 3],
                fill: false,
            },
            {
                label: 'SR',
                backgroundColor: function (context) {
                    const chart = context.chart;
                    const {
                        ctx,
                        chartArea
                    } = chart;

                    if (!chartArea) {
                        // This case happens on initial chart load
                        return null;
                    }
                    return getGradient(ctx, chartArea);
                },
                borderColor: 'rgba(0, 0, 0, 0)',
                data: [1, 2, 3],
                fill: true,

            },

        ]
    }

    // Config
    let config = {
        type: 'line',
        data: data,
        options: {
            interaction: {
                intersect: false
            },
            elements: {
                point: {
                    radius: 0,
                },
                line: {
                    borderWidth: 2
                }
            },
            plugins: {
                tooltip: {
                    enabled: false,
                },
                legend: {
                    display: false,
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    display: false,
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    display: false,
                }
            },

        },

    }

    SRChart = new Chart(
        document.getElementById('srchart'),
        config
    )
}

// Refresh the SR Chart
function refreshChart(values) {
    // Trim 0s from the array ends
    let firstNonZero = 0,
        lastNonZero = values.length - 1;

    while (values[firstNonZero] === 0 || values[lastNonZero] === 0) {
        if (values[firstNonZero] === 0)
            firstNonZero++;
        if (values[lastNonZero] === 0)
            lastNonZero--;
    }

    let trimmedLength = lastNonZero - firstNonZero
    let trimmedValues = []
    let labels = []

    for (let k = 0; k < trimmedLength; k++) {
        trimmedValues[k] = values[k + firstNonZero]
        labels[k] = k
    }

    // Smooth out graph by removing points. We don't want super spiky graphs for marathon maps.
    // We will only leave points that satisfy (n mod floor(valuesTrim.length/CHART_DETAIL) is congruent to 0)
    // This guarantees the array will not be bigger than CHART_DETAIL * 2
    let smoothValues = []
    if (trimmedValues.length > CHART_DETAIL * 2) {
        console.log(trimmedValues)
        let mod = Math.floor(trimmedValues.length / CHART_DETAIL)
        for (let n = 0; n <= trimmedValues.length; n++) {
            if (n % mod == 0)
                smoothValues.push(trimmedValues[n])
        }
        console.log(smoothValues)

    } else {
        smoothValues = trimmedValues
    }

    let max = Math.max(...smoothValues)
    let example = []
    for (let i = 0; i < smoothValues.length / 2; i++) {
        example[i] = max * (i / smoothValues.length)
    }

    // Update the chart
    SRChart.data.labels = labels
    SRChart.data.datasets.forEach((dataset) => {
        if (dataset.label == 'SR')
            dataset.data = smoothValues
        if (dataset.label == 'PP')
            dataset.data = example
    })

    SRChart.update()
}



function getGradient(ctx, chartArea,
    completedColor = 'rgba(230, 230, 230, 0.5)',
    notCompletedColor = 'rgba(230, 230, 230, 0.2)') {

    let gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
    gradient.addColorStop(0, completedColor)
    gradient.addColorStop(Math.min(completion, 1.0), completedColor)
    gradient.addColorStop(Math.min(completion, 1.0), notCompletedColor)
    gradient.addColorStop(1.0, notCompletedColor)
    return gradient
}

function updateKeys(keyData) {
    // KEYS (X/Z)
    // Check if key is pressed to change the styling
    if (keyData.k1.isPressed !== k1State) {
        k1State = keyData.k1.isPressed
        if (k1State) {
            xKey.style.backgroundColor = "#10637c";
            xKey.style.color = "#e0e0e0";
        } else {
            xKey.style.backgroundColor = "#e0e0e0";
            xKey.style.color = "#10637c";
        }
    }
    if (keyData.k2.isPressed !== k2State) {
        k2State = keyData.k2.isPressed
        if (k2State) {
            zKey.style.backgroundColor = "#10637c";
            zKey.style.color = "#e0e0e0";
        } else {
            zKey.style.backgroundColor = "#e0e0e0";
            zKey.style.color = "#10637c";
        }
    }
    // Update keys count
    if (k1Count !== keyData.k1.count) {
        k1Count = keyData.k1.count
        x.innerHTML = k1Count
    }
    if (k2Count !== keyData.k2.count) {
        k2Count = keyData.k2.count
        z.innerHTML = k2Count
    }
}

/* Find predominant color in image using the Vibrant.js library and apply it to the UI */
function setCustomColors(imgPath) {
    getColorPalette(imgPath).then(palette => {
        let accSection = document.getElementById("accSection")
        if (accSection != null) {
            accSection.style.borderColor = palette.darkvibrant
        }
        let graphHR = document.getElementById("graph").getElementsByTagName('hr')[0]
        if (graphHR != null) {
            graphHR.style.backgroundColor = palette.vibrant
        }
        let hrPP = ppSection.getElementsByTagName("hr")[0]
        if (ppSection != null) {
            hrPP.style.borderTop = "solid " + getRGBAfromHEX(palette.vibrant, 0.8)
            hrPP.style.boxShadow = "0 0px 10px " + getRGBAfromHEX(palette.vibrant, 1)
        }

        let hrCombo = comboSection.getElementsByTagName("hr")[0]
        if (comboSection != null) {
            hrCombo.style.borderTop = "solid " + getRGBAfromHEX(palette.vibrant, 0.8)
            hrCombo.style.boxShadow = "0 0px 10px " + getRGBAfromHEX(palette.vibrant, 1)
        }

        let upwardsGlow = document.getElementsByClassName("upwardsGlow")
        for (let glow of upwardsGlow) {
            glow.style.backgroundImage = `linear-gradient(${getRGBAfromHEX(palette.vibrant, 0)}, ${getRGBAfromHEX(palette.vibrant, 1)})`
        }
        
        let bgFunc = function (context) {
            const chart = context.chart;
            const {
                ctx,
                chartArea
            } = chart;

            if (!chartArea) {
                // This case happens on initial chart load
                return null;
            }
            return getGradient(ctx, chartArea, palette.muted, palette.darkMuted);
        }

        SRChart.data.datasets.forEach((dataset) => {
            dataset.backgroundColor = bgFunc
        })
    })
}

/*
    Gets a Palette object containing predominant color codes from an image using Vibrant.js
    returns: palette { vibrant, muted, darkvibrant, darkmuted, lightvibrant } every value is in hex "#123456" RGB format

    Resolves to default palette (grayscale) if we can't get the palette from the image
*/
function getColorPalette(imgPath) {
    return new Promise(function (resolve) {
        Vibrant.from(imgPath).getPalette().then(function (palette) {
            resolve({
                vibrant: palette.Vibrant.getHex(),
                muted: palette.Muted.getHex(),
                darkvibrant: palette.DarkVibrant.getHex(),
                darkmuted: palette.DarkMuted.getHex(),
                lightvibrant: palette.LightVibrant.getHex()
            })

        }).catch(err => {
            console.log("Couldn't get color palette from map BG image at: " + imgPath)
            console.log(err)
            resolve({
                vibrant: "#ffffff",
                muted: "#777777",
                darkvibrant: "#555555",
                darkmuted: "#333333",
                lightvibrant: "#cccccc"
            })
        })
    })
}

function getRGBAfromHEX(hexString, opacity) {
    // idk why im manually coding this

    if (hexString.length != 7 || !hexString.startsWith("#")) {
        throw new Error("Not a valid string")
    }

    let r = parseInt(hexString.substring(1, 3), 16)
    let g = parseInt(hexString.substring(3, 5), 16)
    let b = parseInt(hexString.substring(5, 7), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)){
        throw new Error("Not a valid string")
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity}) `
}