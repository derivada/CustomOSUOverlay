/* osu! custom overlay by derivadas */

/*
    Dependencies used:
    - reconnecting-websocket.js (For socket management)
    - countUp.js (For regular counter updating)
    - odomtr.js (For smooth counter updating)
    - chart.js (For SR chart)
    - vibrant.js (For getting dynamic custom colors from images)
*/

/* Socket management */
let gosumemorySocket = new ReconnectingWebSocket("ws://127.0.0.1:24050/ws")
let playerDataSocket = new ReconnectingWebSocket("ws://127.0.0.1:24051/ws")

gosumemorySocket.onopen = () => {
    console.log("gosumemorySocket Successfully Connected")
}

gosumemorySocket.onclose = event => {
    console.log("gosumemorySocket Socket Closed Connection: ", event)
    gosumemorySocket.send("gosumemorySocket Client Closed!")
}

gosumemorySocket.onerror = error => {
    console.log("gosumemorySocket Socket Error: ", error)
}

playerDataSocket.onopen = () => {
    console.log("playerDataSocket Successfully Connected")
}

playerDataSocket.onclose = event => {
    console.log("playerDataSocket Socket Closed Connection: ", event)
    gosumemorySocket.send("playerDataSocket Client Closed!")
}

playerDataSocket.onerror = error => {
    console.log("playerDataSocket Socket Error: ", error)
}


/* DOM Variables */

// Acc section
let threehun = document.getElementById("300")
let hun = document.getElementById("100")
let fifty = document.getElementById("50")
let miss = document.getElementById("miss")
let sb = document.getElementById("sb")
let ur = document.getElementById("ur")
let grade = document.getElementById("grade")
let acc = document.getElementById("acc")
let accDecimals = document.getElementById("accDecimals")
let bg = document.getElementById("bg")
let accBG = document.getElementById("accBG")

// PP and Combo section
let pp = document.getElementById("pp")
let combo = document.getElementById("combo")

// Key section  
let xKey = document.getElementById("xKey")
let zKey = document.getElementById("zKey")
let x = document.getElementById("x")
let z = document.getElementById("z")

// Player Section 
let avatar = document.getElementById("avatar")
let playerName = document.getElementById("playerName")
let globalRank = document.getElementById("globalRank")
let countryFlag = document.getElementById("countryFlag")
let countryRank = document.getElementById("countryRank")



/* Temporal (last-updated) values */
let lastMapID = 0, lastMapStrains = [], lastMapBG = ""

let currentTime = 0, lastCompletionPercentage = 0, lastMapObjectsTime = 0

let lastAcc = 0, lastGrade = "D"

let lastPP = 0, lastCombo = 0

let last100Count = 0, last50Count = 0, lastMissCount = 0, lastSBCount = 0

let lastUR = 0

let lastK1Count = 0, lastK1State = "", lastK2Count = 0, lastK2State = ""

let lastPlayer = ""

/* CountUp animation objects */
// Syntax: new CountUp(target, startVal, endVal, decimals, duration, options)

let accAnimation = {
    acc: new CountUp('acc', 0, 0, 0, 0.1, {
        useEasing: false,
        useGrouping: false,
        separator: " ",
    }),
}
let accDecimalsAnimation = {
    acc: new CountUp('accDecimals', 0, 0, 0, 0.1, {
        useEasing: false,
        useGrouping: false,
        separator: " ",
        prefix: ".",
        suffix: " %"
    }),
}
let urAnimation = {
    ur: new CountUp('ur', 0, 0, 0, 1, {
        decimalPlaces: 2,
        useEasing: true,
        useGrouping: false,
        separator: " "
    }),
}

let ppAnimation = {
    pp: new CountUp('pp', 0, 0, 0, 1, {
        decimalPlaces: 2,
        useEasing: true,
        useGrouping: false,
        separator: " ",
        suffix: "pp"
    }),
}

let comboAnimation = {
    combo: new CountUp('combo', 0, 0, 0, 1, {
        decimalPlaces: 2,
        useEasing: true,
        useGrouping: false,
        separator: " ",
        suffix: "x"
    }),
}

/* SRChart initialization */
const CHART_DETAIL = 100
let SRChart
createChart()

// On new data from the player data server. Data arrives every second if a replay is active
playerDataSocket.onmessage = event => {
    // Check player data example in server/exampleData.txt 
    // User avatar should be available at img/avatar.png and country flag at img/flag.png 
    let data = JSON.parse(event.data)
    if (!lastPlayer || (data && data.playerName && (data.playerName != lastPlayer || playerName.innerHTML != playerName))) {
        lastPlayer = data.playerName
        updatePlayerData(data)
    }
}

function updatePlayerData(data) {
    playerName.innerHTML = data.username
    globalRank.innerHTML = "#" + data.global_rank
    countryRank.innerHTML = "#" + data.country_rank
    avatar.setAttribute("src", `img/avatar.png?a=${Math.random(10000)}`)
    countryFlag.setAttribute("src", `img/flag.png?a=${Math.random(10000)}`)

    getColorPalette(`img/avatar.png?a=${Math.random(10000)}`).then(palette => {
        avatar.style.boxShadow = "2.5px 2.5px 5px " + getRGBAfromHEX(palette.darkvibrant, 0.8)
        let preFooterLine = document.getElementById("preFooterLine")
        let footerLine = document.getElementById("footerLine")
        preFooterLine.style.background = `linear-gradient(to left, ${palette.darkvibrant}, transparent)`
        footerLine.style.background = `linear-gradient(to right, ${palette.darkvibrant}, transparent)`

    }).catch(() => {
        console.log("Couldn't get user avatar custom color palette")
    })
}

// On new data from gosumemory. Data arrives every 100ms
gosumemorySocket.onmessage = event => {
    // Data JSON example: https://github.com/l3lackShark/gosumemory/wiki/JSON-values
    // Game States list: https://github.com/Piotrekol/ProcessMemoryDataFinder/blob/99e2014447f6d5e5ba3943076bc8210b6498db5c/OsuMemoryDataProvider/OsuMemoryStatus.cs#L3

    let data = JSON.parse(event.data),
        menu = data.menu,
        map = menu.bm,
        gameplay = data.gameplay,
        hdfl = (data.menu.mods.str.includes("HD") || data.menu.mods.str.includes("FL") ? true : false)

    // Map ID
    update(map.id, lastMapID, (newValue) => {
        if (lastMapStrains !== menu.pp.strains) {
            lastMapStrains = menu.pp.strains
            refreshChart(lastMapStrains)
        }
    })

    // Time and completion percentage
    if (lastMapObjectsTime !== map.time.full - map.time.firstObj) {
        lastMapObjectsTime = map.time.full - map.time.firstObj
    }
    if (currentTime !== map.time.current) {
        currentTime = map.time.current
        let completionTemp = parseFloat((currentTime / lastMapObjectsTime).toFixed(3))
        if (completionTemp > 1.0)
            completionTemp = 1.0
        if (completionTemp < 0.0)
            completionTemp = 0.0
        if (completionTemp !== lastCompletionPercentage) {
            lastCompletionPercentage = completionTemp
            SRChart.update()
        }
    }

    // Background image
    update(map.path.full, lastMapBG, (newValue) => {
        let fixedImg = newValue.replace(/#/g, '%23').replace(/%/g, '%25')

        // Not sure what the ?a= part is doing
        // Now I know! It's for the browser to always detect a change in the image!
        let path = `http://127.0.0.1:24050/Songs/${fixedImg}?a=${Math.random(10000)}`
        accBG.setAttribute('src', path)
        setCustomColors(path)
    })

    // Accuracy
    update(gameplay.accuracy, lastAcc, (newValue) => {
        accAnimation.acc.update(Math.floor(newValue))
        accDecimalsAnimation.acc.update(((newValue % 1) * 100).toFixed(0))
    })
    // Play grade (SS, S, A...)
    update(gameplay.hits.grade.current, lastGrade, (newValue) => {
        grade.innerHTML = newValue
        updateGradeStyle(newValue, hdfl)
    })

    // Hits
    update(gameplay.hits[100], last100Count, (newValue) => hun.innerHTML = newValue)
    update(gameplay.hits[50], last50Count, (newValue) => fifty.innerHTML = newValue)
    update(gameplay.hits[0], lastMissCount, (newValue) => miss.innerHTML = newValue)
    update(gameplay.hits.sliderBreaks, lastSBCount, (newValue) => sb.innerHTML = newValue)

    // PP and Combo
    update(gameplay.pp.current, lastPP, ppAnimation.pp.update)
    update(gameplay.combo.current, lastCombo, comboAnimation.combo.update)

    // UR
    update(gameplay.hits.unstableRate, lastUR, urAnimation.ur.update)

    // Keys
    //updateKeys(gameplay.keyOverlay)
}

function update(newValue, savedValue, callback) {
    // Update a variable with a new value and call the function on it
    if (newValue != savedValue) {
        savedValue = newValue
        callback(savedValue)
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
                /* PP Chart WIP set opacity to 1 to show */
                data: [1, 2, 3],
                fill: false,
            },
            {
                label: 'SR',
                backgroundColor: function (context) {
                    const chart = context.chart
                    const {
                        ctx,
                        chartArea
                    } = chart

                    if (!chartArea) {
                        // This case happens on initial chart load
                        return null
                    }
                    return getChartGradient(ctx, chartArea)
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
        lastNonZero = values.length - 1

    while (values[firstNonZero] === 0 || values[lastNonZero] === 0) {
        if (values[firstNonZero] === 0)
            firstNonZero++
        if (values[lastNonZero] === 0)
            lastNonZero--
    }

    let trimmedLength = lastNonZero - firstNonZero
    let trimmedValues = []
    let labels = []

    for (let k = 0; k < trimmedLength; k++) {
        trimmedValues[k] = values[k + firstNonZero]
        labels[k] = k
    }

    // Smooth out chart by removing points. We don't want super spiky charts for marathon maps.
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

function getChartGradient(ctx, chartArea,
    completedColor = 'rgba(230, 230, 230, 0.5)',
    notCompletedColor = 'rgba(230, 230, 230, 0.2)') {

    let gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
    gradient.addColorStop(0, completedColor)
    gradient.addColorStop(Math.min(lastCompletionPercentage, 1.0), completedColor)
    gradient.addColorStop(Math.min(lastCompletionPercentage, 1.0), notCompletedColor)
    gradient.addColorStop(1.0, notCompletedColor)
    return gradient
}

function updateKeys(keyData) {
    // Checks if key is pressed to change the styling
    if (keyData.k1.isPressed !== lastK1State) {
        lastK1State = keyData.k1.isPressed
        if (lastK1State) {
            xKey.style.backgroundColor = "#10637c"
            xKey.style.color = "#e0e0e0"
        } else {
            xKey.style.backgroundColor = "#e0e0e0"
            xKey.style.color = "#10637c"
        }
    }
    if (keyData.k2.isPressed !== lastK2State) {
        lastK2State = keyData.k2.isPressed
        if (lastK2State) {
            zKey.style.backgroundColor = "#10637c"
            zKey.style.color = "#e0e0e0"
        } else {
            zKey.style.backgroundColor = "#e0e0e0"
            zKey.style.color = "#10637c"
        }
    }

    // Updates key count
    if (lastK1Count !== keyData.k1.count) {
        lastK1Count = keyData.k1.count
        x.innerHTML = lastK1Count
    }
    if (lastK2Count !== keyData.k2.count) {
        lastK2Count = keyData.k2.count
        z.innerHTML = lastK2Count
    }
}

/* Find predominant color in image using the Vibrant.js library and apply it to the UI */
function setCustomColors(path) {
    getColorPalette(path).then(palette => {
        let accSection = document.getElementById("accSection")
        if (accSection != null) {
            accSection.style.borderColor = palette.darkvibrant
        }
        let chartHR = document.getElementById("chart").getElementsByTagName('hr')[0]
        if (chartHR != null) {
            chartHR.style.backgroundColor = palette.vibrant
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
            const chart = context.chart
            const {
                ctx,
                chartArea
            } = chart

            if (!chartArea) {
                // This case happens on initial chart load
                return null
            }
            return getChartGradient(ctx, chartArea, palette.muted, palette.darkMuted)
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
            console.log("Returning default palette")
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
    if (hexString.length != 7 || !hexString.startsWith("#")) {
        throw new Error("Not a valid string")
    }

    let r = parseInt(hexString.substring(1, 3), 16)
    let g = parseInt(hexString.substring(3, 5), 16)
    let b = parseInt(hexString.substring(5, 7), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        throw new Error("Not a valid string")
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity}) `
}