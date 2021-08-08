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

// PP and Combo section counters
let pp = document.getElementById("pp")
let combo = document.getElementById("combo")

// CountUp animation objects
let accAnimation = {
    acc: new CountUp('acc', 0, 100, 2, 0.1, {
        decimalPlaces: 2,
        useEasing: false,
        useGrouping: false,
        separator: " ",
        decimal: ".",
        suffix: " %"
    }),
};

let urAnimation = {
    ur: new CountUp('ur', 0, 100, 0, 1, {
        decimalPlaces: 2,
        useEasing: true,
        useGrouping: false,
        separator: " "
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

/* Backgrounds */
let xKey = document.getElementById("xKey")
let zKey = document.getElementById("zKey")
/* Numbers */
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


let completion = 0
let completionTemp = 0
let mapTime
let lastTime

let k1Count, k1State
let k2Count, k2State

// Initialize Star Rating chart
let SRChart
createChart()
const CHART_DETAIL = 100

// On new data
socket.onmessage = event => {
    let data = JSON.parse(event.data),
        menu = data.menu,
        map = menu.bm,
        hdfl = (data.menu.mods.str.includes("HD") || data.menu.mods.str.includes("FL") ? true : false)

    // Game States list: https://github.com/Piotrekol/ProcessMemoryDataFinder/blob/99e2014447f6d5e5ba3943076bc8210b6498db5c/OsuMemoryDataProvider/OsuMemoryStatus.cs#L3
    if (stateValue !== menu.state) {
        stateValue = menu.state
        // if (tempState === 2 || tempState === 7 || tempState === 14) {
        //     state.style.transform = "translateY(0)"
        // } else {
        //     state.style.transform = "translateY(-50px)"
        // }
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
    updateKeys(data.gameplay.keyOverlay);

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

    /* PP if FC
    if (data.gameplay.pp.fc != '') {
        //fcPP.innerHTML = Math.round(data.gameplay.pp.fc)
    } else {
        //fcPP.innerHTML = 0
    }
    */
    // Current PP
    if (data.gameplay.pp.current != ppValue) {
        ppValue = data.gameplay.pp.current
        ppAnimation.pp.update(ppValue)
    }

    // Current combo
    if (data.gameplay.combo.current != comboValue) {
        comboValue = data.gameplay.combo.current
        comboAnimation.combo.update(comboValue)
    }
    // Hits: 300, 100, 50, miss, sliderbreak
    /*
    if (data.gameplay.hits[300] > 0) {
        threehun.innerHTML = data.gameplay.hits[300]
    } else {
        threehun.innerHTML = 0
    }
    */
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
    if (data.gameplay.hits.sliderBreaks > 0) {
        sb.innerHTML = data.gameplay.hits[50]
    } else {
        sb.innerHTML = 0
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
        accAnimation.acc.update(accValue)
    }

    // UR
    if (data.gameplay.hits.unstableRate != '') {
        urAnimation.ur.update(data.gameplay.hits.unstableRate)
    } else {
        urAnimation.ur.update(0)
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
            borderColor: 'rgba(230, 230, 230, 0.6)',
            data: [1, 2, 3],
            fill: true,

        }]
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
                    borderWidth: 0
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

    // Update the chart
    SRChart.data.labels = labels
    SRChart.data.datasets.forEach((dataset) => {
        dataset.data = smoothValues
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
    getColorPalette(imgPath).then(palette => hexPalette = palette).then(
        palette => {
            hexPalette = palette
            let accSection = document.getElementById("accSection")
            if (accSection != null) {
                accSection.style.borderColor = hexPalette.darkvibrant
            }
            let graphHR = document.getElementById("graph").getElementsByTagName('hr')[0]
            if (graphHR != null) {
                graphHR.style.backgroundColor = hexPalette.vibrant
            }
            let ppSection = document.getElementById("ppSection")
            if (ppSection != null) {
                ppSection.style.backgroundColor = hexPalette.darkmuted
            }
            let comboSection = document.getElementById("comboSection")
            if (comboSection != null) {
                comboSection.style.backgroundColor = hexPalette.darkmuted
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
                return getGradient(ctx, chartArea, hexPalette.muted, hexPalette.darkMuted);
            }

            SRChart.data.datasets.forEach((dataset) => {
                dataset.backgroundColor = bgFunc
            })
        }
    )
}

function getColorPalette(imgPath) {
    return new Promise(function (resolve, reject) {
        Vibrant.from(imgPath).getPalette().then(function (palette) {
            resolve({
                vibrant: palette.Vibrant.getHex(),
                muted: palette.Muted.getHex(),
                darkvibrant: palette.DarkVibrant.getHex(),
                darkmuted: palette.DarkMuted.getHex(),
                lightvibrant: palette.LightVibrant.getHex()
            })

        }).catch(err => {
            console.log("No se pudo obtener la paleta de colores del BG")
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