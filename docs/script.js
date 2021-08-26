/*Game object which holds the current state of the game*/
var game = {
    drawing: false,
    playing: false,
    recording: false,
    drop: 0,
    menu: "",
    canvas: document.createElement("canvas"),
    init(){
        document.getElementById("content").appendChild(this.canvas)
        this.context = this.canvas.getContext("2d")
        this.canvas.id = "canvas"
        this.canvas.addEventListener("mousedown", e => {game.drawing = true; mouse(e)})
        this.canvas.addEventListener("mousemove", e => {if (game.drawing === true) {mouse(e)}})
        this.canvas.addEventListener("mouseup", e => {if (game.drawing === true){game.drawing = false}})
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        document.getElementById("canvas.width").value = window.innerWidth
        document.getElementById("canvas.height").value = window.innerHeight
        this.cells = new Map()
        this.encoder = new APNGencoder(this.canvas);
    },
    reset(){
        this.peakCells = 0
        this.cells.clear()
        this.cellSize = document.getElementById('cellSize').value
        this.columns = Math.floor(this.canvas.width / this.cellSize)
        this.rows = Math.floor(this.canvas.height / this.cellSize)
        this.manipulations = 0
        this.generations = 0
        document.getElementById('generations').innerHTML = this.generations
        document.getElementById('manipulations').innerHTML = this.manipulations
        document.getElementById('fps').innerHTML = 0
        document.getElementById('cells').innerHTML = 0
        this.context.fillStyle = 'black'
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
       /*Center Line*/
        let x = Math.floor(this.columns / 2) * this.cellSize
        let c = this.canvas.height - (5 * this.cellSize)
        for(y = 5 * this.cellSize; y < c; y += +this.cellSize){
            let cell = (y / this.cellSize) * this.columns + (x / this.cellSize)
            this.cells.set(cell, [x, y, true, false, false])
            this.context.fillStyle = 'green'
            this.context.fillRect(x, y, this.cellSize, this.cellSize)
        }
    },
    neighbours(value){
        let sum = 0
        let columnInital = value[0] / this.cellSize
        let rowInital = value[1] / this.cellSize
        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                if(r === 0 && c === 0){continue;}
                let column = columnInital + c
                let row = rowInital + r
                if(column < 0){column = this.columns - 1} //Left
                else if(column > this.columns - 1){column = 0} //Right
                if(row < 0){row = this.rows} //Top
                else if(row > this.rows){row = 0} //Bottom
                let neighbour = row * this.columns + column
                let getNeighbour = this.cells.get(neighbour)
                if(getNeighbour && getNeighbour[2]){sum++}
                else if(!getNeighbour && !value[3]){
                    let x = column * this.cellSize
                    let y = row * this.cellSize
                    this.cells.set(neighbour, [x, y, false, true, false])
                }
            }
        }
        return sum
    },
    redraw(value){
        value[4] = false
        if(value[2]){
            value[2] = false
            this.context.fillStyle = 'black'
            this.context.fillRect(value[0], value[1], this.cellSize, this.cellSize)
        }else{
            value[2] = true
            this.context.fillStyle = 'green'
            this.context.fillRect(value[0], value[1], this.cellSize, this.cellSize)
        }
    }
}

/*Initiate game*/
function start(){
    game.init()
    game.reset()
}

/*Main Controls*/
function update(){
    if(game.recording){game.encoder.addFrame();}
    let start = performance.now()
    /*Count Neighbours & Apply Game of Life Rules*/
    for(let [cell, value] of game.cells){
        let state = value[2]
        let neighbours = game.neighbours(value)
        if(!state && neighbours == 0){game.cells.delete(cell)}
        else if(!state && neighbours == 3){value[4] = true}
        else if(state && neighbours > 3){value[4] = true}
        else if(state && neighbours < 2){value[4] = true}
    }
    /*Redraw Changes*/
    for(let [cell, value] of game.cells){
        if(value[3]){value[3] = false}
        if(value[4]){game.redraw(value)}
    }
    /*Update Score Area*/
    let fps = Math.floor(1 / ((performance.now() - start) / 1000))
    let fr = document.getElementById('frame_rate').value
    if(fr < fps){fps = fr}else{game.drop++}
    document.getElementById('fps').innerHTML = fps
    game.generations++
    document.getElementById('generations').innerHTML = game.generations
    if(game.generations === 450){play()}
}
function play(){
    if(!game.playing){  /*Start*/
        game.playing = true
        document.getElementById("play").style.background = "red"
        let delay = Math.round(1 / document.getElementById("frame_rate").value * 1000)
        game.intervalID = window.setInterval(update, delay)
        game.drop = 0
    }else if(game.playing){  /*Stop*/
        game.playing = false
        window.clearInterval(game.intervalID)
        document.getElementById("play").style.background = ''
        document.getElementById('score').style.opacity = 1
        console.log(game.drop)
    }   
}
function reset(){
    game.canvas.width = document.getElementById("canvas.width").value
    game.canvas.height = document.getElementById("canvas.height").value
    game.reset()
}
function record(){
    if(!game.recording){
        game.recording = true
        game.encoder.start()
        document.getElementById("record").style.background = 'red'
    }else if(game.recording){
        game.recording = false
        game.encoder.addFrame()
        game.encoder.finish()
        var base64Out = bytesToBase64(game.encoder.stream().bin);
        document.getElementById('animation').src = "data:image/png;base64," + base64Out;
        document.getElementById("record").style.background = ''
    }
}
function screenshot(){
    if(!game.recording){record();record()}
}
function menu(which){
    if(game.menu === ""){
        document.getElementById(which).style.display = 'block'
        document.getElementById('main').style.opacity = 0.3
        game.menu = which
    }
    else if(game.menu === which){
        document.getElementById(which).style.display = 'none'
        document.getElementById('main').style.opacity = 1
        game.menu = ""
    }else{
        document.getElementById(game.menu).style.display = 'none'
        document.getElementById(which).style.display = 'block'
        game.menu = which
    }
}

/*Menu Controls*/
function apply(){
    menu('displaySettings')
    reset()
}
function cancel(){
    menu('displaySettings')
    document.getElementById("canvas.width").value = game.canvas.width
    document.getElementById("canvas.height").value = game.canvas.height
    document.getElementById("cellSize").value = game.cellSize
}

/*Miscellaneous functions*/
function mouse(event){
    let column = Math.floor((event.clientX - ((window.innerWidth - game.canvas.width) / 2)) / game.cellSize)
    let row = Math.floor((event.clientY - ((window.innerHeight - game.canvas.height) / 2)) / game.cellSize)
    let x = column * game.cellSize
    let y = row * game.cellSize
    let cell = row * game.columns + column
    let exist = game.cells.has(cell)
    if(!exist && event.type !== 'mousemove'  && event.shiftKey == false){
        game.cells.set(cell, [x, y, true, false, false])
        game.context.fillStyle = 'green'
        game.context.fillRect(x, y, game.cellSize, game.cellSize)
    }else if(exist && event.type !== 'mousemove' && event.shiftKey == false){
        game.context.fillStyle = 'black'
        game.context.fillRect(x, y, game.cellSize, game.cellSize)
        game.cells.delete(cell)
    }else if(!exist && event.type == 'mousemove' && event.shiftKey == false){
        game.cells.set(cell, [x, y, true, false, false])
        game.context.fillStyle = 'green'
        game.context.fillRect(x, y, game.cellSize, game.cellSize)
    }else if(exist && event.type == 'mousemove' && event.shiftKey == true){
        game.context.fillStyle = 'black'
        game.context.fillRect(x, y, game.cellSize, game.cellSize)
        game.cells.delete(cell)
    }
}
function downloadPNG(link){
    if (typeof game.encoder === 'undefined' || game.encoder.stream() == null || game.encoder.closeStream==false) {
      alert("Please call start method and add frames and call finish method before calling download"); 
      return 0;
    }
    var out = game.encoder.stream();
    var href= URL.createObjectURL(new Blob([new Uint8Array(out.bin)], {type : "image/png" } ));
    link.href = href;
    link.download = "animation.png";   // filename
}

/*Keyboard event listener*/
document.addEventListener('keydown', (e) => {
    if(e.key === "u"){update();}
    else if(e.key === "p"){play();}
    else if(e.key === "r"){reset();}
    else if(e.key === "d"){menu('displayAnimation');}
    else if(e.key === "s"){menu('displaySettings');}
    else if(e.key === "i"){menu('displayInfo');}
    else if(e.key === "c"){
        if(document.getElementById('control_score').style.display === 'block'){
            document.getElementById('control_score').style.display = "none"
        }else{
            document.getElementById('control_score').style.display = "block"
        }
    }
});