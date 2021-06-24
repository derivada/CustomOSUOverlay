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

// Play data
let currentPP = document.getElementById("currentPP")
let threehun = document.getElementById("300")
let hun = document.getElementById("100")
let fifty = document.getElementById("50")
let miss = document.getElementById("miss")
let sb = document.getElementById("sb")
let ur = document.getElementById("ur")
let grade = document.getElementById("grade")
let acc = document.getElementById("acc")

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

let strainsValues
let modsValues


let completion = 0
let completionTemp = 0
let mapTime
let lastTime

// Initialize Star Rating chart
let SRChart
createChart()

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
    if (mapTime !== map.time.mp3) {
        mapTime = map.time.mp3
    }
    if (lastTime !== map.time.current) {
        lastTime = map.time.current
        completionTemp = parseFloat((lastTime / mapTime).toFixed(3))
        if (completionTemp > 1.0)
            completionTemp = 1.0
        if (completionTemp !== completion) {
            completion = completionTemp
            SRChart.update()
        }
    }


    // Background image
    if (imgValue !== map.path.full) {
        imgValue = map.path.full
        let img = map.path.full.replace(/#/g, '%23').replace(/%/g, '%25')

        // Not sure what the ?a= part is doing
        //bg.setAttribute('src', `http://127.0.0.1:24050/Songs/${img}?a=${Math.random(10000)}`)
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

    // PP if FC
    if (data.gameplay.pp.fc != '') {
        //fcPP.innerHTML = Math.round(data.gameplay.pp.fc)
    } else {
        //fcPP.innerHTML = 0
    }

    // Current PP
    if (data.gameplay.pp.current != '') {
        //currentPP.innerHTML = Math.round(data.gameplay.pp.current)
    } else {
        //currentPP.innerHTML = 0
    }

    // Hits: 300, 100, 50, miss, sliderbreak
    if (data.gameplay.hits[300] > 0) {
        //threehun.innerHTML = data.gameplay.hits[300]
    } else {
        //threehun.innerHTML = 0
    }

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
        acc.innerHTML = Math.round(accValue * 100) / 100
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
    let i = 0,
        j = values.length - 1;
    while (values[i] === 0 || values[j] === 0) {
        if (values[i] === 0)
            i++;
        if (values[j] === 0)
            j--;
    }

    let valuesTrim = []

    let k

    for (k = 0; k < j - i; k++) {
        valuesTrim[k] = values[k + i]
    }

    for (k; k < values.length - i; k++) {
        valuesTrim[k] = 5
    }

    let labels = []
    for (let k = 0; k <= valuesTrim.length; k++) {
        labels[k] = k
    }

    SRChart.data.labels = labels
    SRChart.data.datasets.forEach((dataset) => {

        dataset.data = valuesTrim
    })
    SRChart.update()
}




function getGradient(ctx, chartArea) {
    let width, height, gradient
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    if (gradient === null || width !== chartWidth || height !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        width = chartWidth;
        height = chartHeight;
        gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
        gradient.addColorStop(0, 'rgba(230, 230, 230, 0.5)')
        gradient.addColorStop(completion, 'rgba(230, 230, 230, 0.5)')
        gradient.addColorStop(completion, 'rgba(230, 230, 230, 0.2)')
        gradient.addColorStop(1, 'rgba(230, 230, 230, 0.2)')
    }
    return gradient
}