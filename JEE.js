console.log("JEE.js 1.5")


var jee
window.onload = () => jee = new Jee()

class JEE {
    static _ = {}
    objects = []
    objsId = 0
    #zList = []
    #frame = 0
    get frame() {
        return this.#frame
    }

    name = "JEE Game"

    /** 2.5D game */
    orderY = false
    fpsLimit = 63
    fullscreen = false
    autorun = true
    loadPause = 0.5
    border = {
        width: null,
        type: null,
        color: null,
        txtFnc: null,
        field: null,
    }

    view = new __JEEView(this)
    control = new __JEEControl(this)
    files = new __JEEResource(this)

    constructor() {
        this.init()

        this.view.__init()
        this.control.__init()

        setTimeout(() => this.#init(), 100)
    }

    #init() {
        for (const name in window) {
            const obj = window[name]
            if (obj && obj.prototype instanceof JEEObj) new obj(true)
        }

        let wait = setInterval(() => {
            this.view.curtainIn.innerHTML = `<b>JEE.js</b><br><small>${this.files.ok}/${this.files.all}</small>`
            if (this.files.all == this.files.ok) {
                clearInterval(wait)
                setTimeout(() => this.#startGame(), this.loadPause * 1000)
            }
        }, 100)
    }

    #fpsTime
    #fpsCount
    #startGame() {
        console.log("::: start jee")

        this.#fpsTime = 1000 / this.fpsLimit

        if (this.border.color || this.border.field || this.border.txtFnc || this.border.type || this.border.width)
            this.border.on = true

        // if (this.fullscreen && this.autorun === false)
        //		 this.#toggleFullScreen()
        this.view.curtainIn.innerHTML = ""
        // if (document.querySelector('.jee-plane')) // ??? фиг знает что это. может для редактора карты
        //		 document.querySelector('.jee-plane').style.display = 'block'
        this.view.resizeWin()
        this.RUN = true

        setTimeout(() => {
            this.view.curtain.style.display = "none"
            let now,
                elapsed,
                then = Date.now()
            const animate = () => {
                requestAnimationFrame(animate)
                now = Date.now()
                elapsed = now - then
                if (elapsed > this.#fpsTime) {
                    then = now - (elapsed % this.#fpsTime)
                    this.#loopGame()
                }
            }
            animate()
        }, 100)
    }

    /** Run in preload jee */
    init() { }
    /** Run in first frame */
    start() { }
    /** Run in every frame */
    update() { }

    getNewObjId() {
        return this.objsId++
    }

    #startFrame
    #loopGame() {
        if (this.inActPause) return
        if (this.inRunPause) return
        if (!this.RUN) return

        if (!this.#startFrame) {
            this.#startFrame = true
            this.start()
        }

        this.#loopUpdate()
        this.#loopDraw()

        this.#fpsCount++
        this.#frame++

        this.control.pressOut()
    }

    #loopUpdate() {
        let i = 0
        let md = []
        for (const obj of this.objects)
            if (obj instanceof JEEObj) {
                obj.__work()
                if (obj.toDelete) {
                    if (obj.stop) obj.stop()
                    md.push(i)
                }
                i++
            }

        for (let j = md.length - 1; j >= 0; j--)
            this.objects.splice(md[j], 1)
    }

    #loopDraw() {
        if (!this.noClear)
            this.view.context.clearRect(
                0, 0,
                this.view.canvas.width,
                this.view.canvas.height
            )

        let mas = []

        // тут потом сделать фильтр по видимости и настройкам
        for (const obj of this.objects) mas.push(obj)

        if (this.orderY) mas.sort(this.#orderY)

        for (const z of this.#zList)
            for (const obj of mas)
                if (obj instanceof JEEObj)
                    if (obj.z == z)
                        obj.pic.draw()
    }

    #orderY(a, b) {
        if (a.y < b.y) return 1
        if (a.y > b.y) return -1
        return 0
    }

    /** random(1) = 0.0 - 1.0; random(-1) = -1/1; random(true) = true/false; random(0, 100) = 0 - 100 */
    random(min, max) {
        if (min === 1 && max === undefined) {
            return Math.random()
        } else if (min === true && max === undefined) {
            if (Math.random() >= 0.5) return true
            else return false
        } else if (min == -1 && max === undefined) {
            if (Math.random() >= 0.5) return 1
            else return -1
        } else if (min !== undefined && max !== undefined) {
            return Math.floor(Math.random() * (max - min + 1)) + min
        }
    }

    randomW(s = 0) {
        return this.random(-this.view.hw + s, this.view.hw - s)
    }
    randomH(s = 0) {
        return this.random(-this.view.hh + s, this.view.hh - s)
    }

    getObj(key, prm) {
        for (const obj of this.objects)
            if (obj instanceof JEEObj && obj.active)
                if (obj[key] == prm) return obj
    }
    getObjs(key, prm) {
        let ot = []
        for (const obj of this.objects)
            if (obj instanceof JEEObj)
                if (obj.active && obj[key] == prm) ot.push(obj)

        return ot
    }

    atCameraFree() {
        for (const obj of this.objects)
            if (obj instanceof JEEObj) if (obj.cameraSnap) obj.cameraSnap = false
    }

    setZLayer(obj) {
        if (this.#zList.indexOf(obj.z) == -1) {
            this.#zList.push(obj.z)
            this.#zList.sort(function (a, b) {
                return a - b
            })
        }
    }

    angleXY(x1, y1, x2, y2) {
        let angle = (Math.atan2(x2 - x1, y2 - y1) * 180) / Math.PI
        if (angle > 180) angle -= 360
        if (angle < -180) angle += 360
        return angle
    }

    angleObj(obj1, obj2) {
        if (!obj1 || !obj2) return
        if (obj1.active === false) return
        if (obj2.active === false) return
        return this.angleXY(obj1.x, obj1.y, obj2.x, obj2.y)
    }

    distanceXY(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
    }

    distanceObj(obj1, obj2) {
        if (!obj1 || !obj2) return
        if (obj1.active === false) return
        if (obj2.active === false) return
        return this.distanceXY(obj1.x, obj1.y, obj2.x, obj2.y)
    }

    #physicsList = []
    physics = {
        gravity: 0,
        getList: () => {
            return this.#physicsList
        },
        add: (obj) => this.#physicsList.push(obj),
        remove: (obj) => {
            if (!(obj instanceof JEEObj)) return
            let i = 0
            for (const o of this.#physicsList)
                if (o instanceof JEEObj) {
                    if (o.id == obj.id) this.#physicsList.splice(i, 1)
                    i++
                }
        },
    }
}

class __JEEView {
    #jee
    camera = { x: 0, y: 0 }

    bodyColor = "#eee"
    textColor = "#555"
    textFont = "Verdana"
    textSize = 16
    tabIcon = ""
    curtainCss
    canvasColor
    cursorNone
    canvasCss = ""
    canvasRatio = 0
    canvasQuality = 1000

    constructor(jee) {
        if (jee instanceof JEE) this.#jee = jee
    }

    __init() {
        this.#initHTML()
        this.#initCanvas()
        this.resizeWin()
        window.onresize = () => this.resizeWin()
    }

    #consoleDiv
    #initHTML() {
        let viewPortTag = document.createElement("meta")
        viewPortTag.id = "viewport"
        viewPortTag.name = "viewport"
        viewPortTag.content =
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        document.head.appendChild(viewPortTag)

        document.body.style.cssText = `
            background-color: ${this.bodyColor};
            font-family: ${this.textFont};
            color: ${this.textColor};
            font-size: ${this.textSize};
            overflow: hidden;
            user-select: none;
            margin: 0px;
            `

        this.#consoleDiv = document.createElement("div") // ???
        this.#consoleDiv.style.cssText = `
            position: absolute ;
            z-index: 999 ;
            top: 0px ;
            left: 0px ;
            max-height: 50vh ;
            max-width: 50vw ;
            min-width: 150px;
            overflow-y: auto ;
            opacity: 0.7 ;
            display: ${this.log ? "block" : "none"};
            padding: 10px;
            font-size: 11px ;
            color: #000;
            background-color: #fffa;
            word-wrap: break-word;
            pointer-events: none;
            border-radius: 0 0 5px 0;
            `
        document.body.appendChild(this.#consoleDiv)

        if (this.#jee.name) document.title = this.#jee.name

        if (this.tabIcon) {
            let link = document.createElement("link")
            link.rel = "icon"
            link.href = this.tabIcon
            document.head.appendChild(link)
        }

        this.curtain = document.getElementById("mgmCurtain")
        if (!this.curtain) {
            this.curtain = document.createElement("div")
            this.curtain.id = "mgmCurtain"
            document.body.appendChild(this.curtain)
        }

        this.curtain.style.cssText += `
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background: ${document.body.style.backgroundColor};
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 300%;
            `
        this.curtainIn = document.createElement("div")
        this.curtain.appendChild(this.curtainIn)
        this.curtainIn.style.cssText = "text-align: center; padding: 30px;"
        if (this.curtainCss) this.curtainIn.style.cssText += this.curtainCss
        this.curtainIn.innerHTML = "<b>JEE.js</b><br><small>0/0</small>"
    }

    #initCanvas() {
        this.canvas = document.createElement("canvas")
        this.canvas.classList.add("jee-canvas")
        this.canvas.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            `

        if (this.pixel)
            // ???
            // this.canvas.style.cssText += 'image-rendering: pixelated image-rendering: crisp-edges'
            this.canvas.style.cssText += "image-rendering: pixelated"

        this.__defCtxText = {
            textAlign: "left",
            fontColor: document.body.style.color,
            fontSize: this.textSize,
            fontFamily: this.textFont,
            fontWeight: "normal",
        }

        this.context = this.canvas.getContext("2d")
        if (this.canvasColor) this.canvas.style.backgroundColor = this.canvasColor
        if (this.cursorNone) this.canvas.style.cursor = "none"
        document.body.appendChild(this.canvas)

        if (this.canvasCss) this.canvas.style.cssText += this.canvasCss
    }

    // fullscreen() {
    //		 this.#toggleFullScreen()
    // }

    #toggleFullScreen() {
        // ???
        var doc = window.document
        var docEl = doc.documentElement

        var requestFullScreen =
            docEl.requestFullscreen ||
            docEl.mozRequestFullScreen ||
            docEl.webkitRequestFullScreen ||
            docEl.msRequestFullscreen
        var cancelFullScreen =
            doc.exitFullscreen ||
            doc.mozCancelFullScreen ||
            doc.webkitExitFullscreen ||
            doc.msExitFullscreen

        if (
            !doc.fullscreenElement &&
            !doc.mozFullScreenElement &&
            !doc.webkitFullscreenElement &&
            !doc.msFullscreenElement
        ) {
            requestFullScreen.call(docEl)
        } else {
            cancelFullScreen.call(doc)
        }
    }

    resizeWin() {
        let ratio = 1
        if (this.canvasRatio === 0) ratio = innerWidth / innerHeight
        else ratio = this.canvasRatio

        let height = innerHeight
        let width = innerHeight * ratio
        if (width > innerWidth) {
            height = innerWidth / ratio
            width = innerWidth
        }

        this.canvas.style.width = width + "px"
        this.canvas.style.height = height + "px"
        this.canvas.width = this.canvasQuality * ratio
        this.canvas.height = this.canvasQuality
        this.kfHeight = height / this.canvasQuality
        this.hw = this.canvas.width / 2
        this.hh = this.canvas.height / 2
        this.canvas.cpos = this.canvas.getBoundingClientRect()
        document.body.style.fontSize = this.fontRatio * (height / 40) + "px"
        this.context.font = // чтобы задать шрифт, надо перезадать размер канвасу
            this.__defCtxText.fontWeight +
            " " + 
            this.__defCtxText.fontSize +
            "px " +
            this.__defCtxText.fontFamily
        // console.log(this.context.font)

        const cpos = this.canvas.cpos
        const kh = cpos.height / this.canvasQuality
    }
}









class __JEEControl {
    #jee
    mouse = { x: 0, y: 0, px: 0, py: 0, cx: 0, cy: 0 }

    constructor(jee) {
        if (jee instanceof JEE) this.#jee = jee
    }

    __init() {
        this.#initMouse()
        this.#initKeys()
    }

    #initMouse() {
        if (this.isMobile) return

        this.#jee.view.canvas.onmousemove = (e) => {
            this.mouse.px = e.pageX - this.#jee.view.canvas.cpos.left
            this.mouse.py = e.pageY - this.#jee.view.canvas.cpos.top
            this.mouse.cx = this.mouse.px / this.kfHeight - this.#jee.view.hw
            this.mouse.cy = -this.mouse.py / this.kfHeight + this.#jee.view.hh
        }

        this.#jee.view.canvas.onmousedown = (e) => {
            this.mouse.down = true
            this.mouse.up = false
            this.mouse.which = e.which
        }

        this.#jee.view.canvas.onmouseup = (e) => {
            this.mouse.down = false
            this.mouse.up = true
            this.mouse.which = e.which
        }
    }

    #initKeys() {
        const keyNames = { backspace: false, enter: false, shift: false, ctrl: false, escape: false, space: false, left: false, up: false, right: false, down: false, n0: false, n1: false, n2: false, n3: false, n4: false, n5: false, n6: false, n7: false, n8: false, n9: false, a: false, b: false, c: false, d: false, e: false, f: false, g: false, h: false, i: false, j: false, k: false, l: false, m: false, n: false, o: false, p: false, q: false, r: false, s: false, t: false, u: false, v: false, w: false, x: false, y: false, z: false, }
        this.keys = { ...keyNames }
        this.press = { ...keyNames }
        this.pressK = {}
        const keyNums = { 38: "up", 40: "down", 37: "left", 39: "right", 32: "space", 13: "enter", 27: "escape", 16: "shift", 17: "ctrl", 8: "backspace", 65: "a", 66: "b", 67: "c", 68: "d", 69: "e", 70: "f", 71: "g", 72: "h", 73: "i", 74: "j", 75: "k", 76: "l", 77: "m", 78: "n", 79: "o", 80: "p", 81: "q", 82: "r", 83: "s", 84: "t", 85: "u", 86: "v", 87: "w", 88: "x", 89: "y", 90: "z", 48: "n0", 49: "n1", 50: "n2", 51: "n3", 52: "n4", 53: "n5", 54: "n6", 55: "n7", 56: "n8", 57: "n9", }

        document.onkeydown = (e) => {
            e = e || window.event
            const k = keyNums[e.keyCode]
            this.keys[k] = true

            if (!this.pressK[k]) {
                this.press[k] = true
                this.pressK[k] = true
                setTimeout(() => (this.pressK[k] = false), 100)
            }
        }

        document.onkeyup = (e) => {
            e = e || window.event
            this.keys[keyNums[e.keyCode]] = false
        }
    }
}





class __JEEResource {
    all = 0
    ok = 0

    load(src) {
        this.all++
        const img = new Image()
        img.src = src
        img.onload = () => {
            this.ok++
        }
        return img
    }
}


















class JEEObj {
    id
    /** If need set another Jee */
    jee
    name = "JEE Obj"
    x = 0
    y = 0
    #z = 0
    set z(val) {
        this.#z = val
        this.jee.setZLayer(this)
    }
    get z() { return this.#z }
    active = true
    hidden = false
    size = 1
    isClone = false
    cameraZ = 1
    border = {
        width: null,
        type: null,
        color: null,
        txtFnc: null,
        field: null,
    }

    cameraSnap = false
    nonContact

    body = new __JEEObjBody(this)
    pic = new __JEEObjPic(this)

    #parent
    ready = false

    constructor(parent) {
        if (jee && jee instanceof JEE) this.jee = jee
        this.jee.objects.push(this)
        this.id = this.jee.getNewObjId()

        if (parent === true) this.#initOrig()
        if (parent && parent instanceof JEEObj) this.#initClone(parent)
    }

    #initOrig() {
        this.name = this.constructor.name
        // console.log(">>>>>>> ORIG >>>>>>>>>>", this.name)

        this.init()
        this.jee.setZLayer(this)
        this.pic.__init()

        this.ready = true
    }

    #initClone(parent) {
        // console.log(parent)
        // console.log('|||||| CLONE ||||||')
        this.#parent = parent
        if (!(this.#parent instanceof JEEObj)) return 

        this.body = new __JEEObjBody(this)
        this.pic = new __JEEObjPic(this)

        for (let v in this.#parent)
            if (v != "id" &&
                v != "jee") {
                // console.log(v, this.#parent[v])
                if (v == 'body' ||
                    v == 'pic' ||
                    v == 'border'
                ) {
                    for (const c in this.#parent[v]) {
                        // if (this.name == 'Flower')
                        //     console.log(v, c, this.#parent[v][c])

                        this[v][c] = this.#parent[v][c]
                    }

                    if (v == 'body') // get set
                        this.body.type = this.#parent.body.type

                    if (v == 'pic') {
                        if (this.#parent.pic.animName) {
                            this.pic.animName = this.#parent.pic.animName
                            this.pic.animSpeed = this.#parent.pic.animSpeed
                        }
                    }
                }
                else {
                    if (this.#parent[v] !== undefined)
                        this[v] = JSON.parse(JSON.stringify(this.#parent[v]))
                }
            }

        this.isClone = true
        this.ready = true
    }

    /** Run before load. For original object, no for clones. */
    init() { }
    /** Run in first frame before update() */
    start() { }
    /** Run in every frame */
    update() { }

    clone() { // ,,,
        // console.log(this.name, this.constructor);
        if (this instanceof JEEObj)
            return new this.constructor(this)
    }

    #startFrame
    __work() {
        if (!this.ready) return
        // console.log('========' + this.name + '=========')
        if (!this.#startFrame) {
            this.#startFrame = true
            this.start()
        }
        // else
        this.update()

        this.#waitsWork()
        this.body.__work()

        // if (this.anglePic) this.rotation = this.angle
        if (this.cameraSnap) {
            this.jee.view.camera.x = this.x
            this.jee.view.camera.y = this.y
        }
    }

    __draw() {
        // if (!this.ready) return
        // if (this.toDelete) return

        this.pic.draw()
    }

    getFlip() {
        let ot = [1, 1]

        if (this.flipX)
            if (this.angle > 0) ot[0] = 1
            else ot[0] = -1
        if (this.flipY)
            if (this.angle > 0 && this.angle < 90)
                // ???
                ot[1] = 1
            else ot[1] = -1

        return ot
    }




    // MOVE

    wasd(speed) {
        if (jee.control.keys.d) this.x += speed
        if (jee.control.keys.a) this.x -= speed
        if (jee.control.keys.w) this.y += speed
        if (jee.control.keys.s) this.y -= speed
    }

    step(speed) {
        const rad = (this.angle * Math.PI) / 180
        this.x += speed * Math.sin(rad)
        this.y += speed * Math.cos(rad)
    }

    stepA(speed, angle = 0) {
        this.angle = angle
        const rad = (angle * Math.PI) / 180
        this.x += speed * Math.sin(rad)
        this.y += speed * Math.cos(rad)
    }

    wasdA(speed = 0) {
        let angle
        let keys = this.jee.control.keys

        if (keys.w) angle = 0
        if (keys.s) angle = 180
        if (keys.d) angle = 90
        if (keys.a) angle = -90
        if (keys.w && keys.d) angle = 45
        if (keys.w && keys.a) angle = -45
        if (keys.s && keys.d) angle = 135
        if (keys.s && keys.a) angle = -135

        if (angle !== undefined) this.stepA(speed, angle)

        return angle
    }

    arrows(speed = 0) {
        if (this.jee.control.keys.right) this.x += speed
        if (this.jee.control.keys.left) this.x -= speed
        if (this.jee.control.keys.up) this.y += speed
        if (this.jee.control.keys.down) this.y -= speed
    }
    /*
    moveTo(obj, speed) {
    let obj2 = obj
    if (typeof obj == 'string') obj2 = this.jee.getObj(obj)
    if (this.x == obj.x && this.y == obj.y) return true
    
    const d = this.distanceTo(obj2)
    
    if (d >= speed) {
    this.angle = this.angleTo(obj)
    this.step(speed)
    } else {
    this.positionTo(obj2)
    }
    }
    */





    // WAIT

    #wait = {}
    #waitsWork() {
        for (const j in this.#wait) {
            const wait = this.#wait[j]
            if (wait.n == 0) {
                if (wait.repeat) wait.n = wait.frames - 1
                else delete this.#wait[j]
                wait.func()
            } else wait.n--
        }
    }

    /** Do func() after few frames. Set name if you need to stop, or set name = ''. To stop set name and frames = null. */
    wait(name, frames, func) {
        if (frames == null) delete this.#wait[name]
        else if (!this.#wait[name]) {
            this.#wait[name] = {}
            const wait = this.#wait[name]
            wait.frames = Math.round(frames)
            wait.n = wait.frames - 1
            wait.repeat = false
            wait.func = func
        }
    }

    /** Do func() every few frames. Set name if you need to stop, or set name = ''.	To stop set name and frames = null.*/
    repeat(name, frames, func) {
        if (frames == null) delete this.#wait[name]
        else {
            if (!this.#wait[name]) {
                this.#wait[name] = {}
                const wait = this.#wait[name]
                wait.frames = Math.round(frames)
                wait.n = wait.frames - 1
                wait.repeat = true
                wait.func = func
                func()
            }
        }
    }

    delete() {
        this.toDelete = true
        this.active = false
        if (this.physics.type) this.physics.type = undefined
    }

    contact(key, val) {
        let res = this.body.contact(key, val, false)
        if (res instanceof JEEObj) return res
    }

    contactIn(key, val) {
        let res = this.body.contact(key, val, true)
        if (res instanceof JEEObj) return res
    }

    contacts(key, val) {
        return this.body.contacts(key, val, false)
    }

    contactsIn(key, val) {
        return this.body.contacts(key, val, true)
    }



}















class __JEEObjPic {
    #obj
    #jee

    flipX = false
    flipY = false
    alpha = 1
    rotation = 0
    width
    height

    /** List parts of image. Format: [[x, y, width, height, picNum = 0],...] */
    parts = []

    constructor(obj) {
        if (obj instanceof JEEObj) this.#obj = obj
        if (jee && jee instanceof JEE) this.#jee = jee
    }

    __init() {
        for (const f of this.files)
            this.filesData.push(this.#jee.files.load(f))
    }

    #cameraZx
    #cameraZy
    draw() {
        if (!this.#obj.active) return
        if (this.#obj.hidden) return

        this.#animaWork()

        let obj = this.#obj
        let context = this.#jee.view.context

        if (obj.onCamera === undefined) {
            // это флаг нахождения в поле оtрисовки (вроде)
            this.#cameraZx = -this.#jee.view.camera.x * obj.cameraZ
            this.#cameraZy = this.#jee.view.camera.y * obj.cameraZ
        } else {
            this.#cameraZx = 0
            this.#cameraZy = 0
        }

        // console.log(obj.name, obj.x + this.#jee.view.hw + this.#cameraZx)

        context.save()
        context.translate(
            obj.x + this.#jee.view.hw + this.#cameraZx,
            -obj.y + this.#jee.view.hh + this.#cameraZy
        )

        // this.drawPrimitives(2)

        if (obj.alpha !== undefined) context.globalAlpha = obj.alpha
        else context.globalAlpha = 1
        if (this.rotation != 0) context.rotate((this.rotation * Math.PI) / 180)
        const flip = obj.getFlip()
        context.scale(flip[0], flip[1])
        if (obj.effect) context.filter = obj.effect // ???

        // const pic = this.getPic()
        const sizes = this.getSizes()
        if (this.parts.length == 0) {
            const pic = this.filesData[this.num]
            if (pic)
                context.drawImage(pic,
                    -sizes.width / 2 + this.x * obj.size,
                    -sizes.height / 2 - this.y * obj.size,
                    sizes.width, sizes.height
                )
        }
        else {
            const picPrm = this.parts[this.num]
            let n = 0
            if (picPrm.length == 5) n = picPrm[4]
            const pic = this.filesData[n]
            if (pic) {
                const w = picPrm[2]
                const h = picPrm[3]
                // console.log(this.num, picPrm);

                context.drawImage(pic,
                    picPrm[0], picPrm[1],
                    w, h,
                    -w / 2 + this.x * obj.size,
                    -h / 2 - this.y * obj.size,
                    w, h
                )
            }
        }
        // this.drawPrimitives(1)

        context.restore()

        this.boardsShow()
    }

    dot(x, y, col = "#ff0") {
        this.#jee.view.context.fillStyle = col
        this.#jee.view.context.fillRect(x - 1, y - 1, 3, 3)
    }

    boardsShow() {
        let brd = this.#obj.border
        if (this.#jee.border.on) brd = this.#jee.border
        if (!brd.color && !brd.width && !brd.type && !brd.field && !brd.txtFnc)
            return

        if (!brd.color) brd.color = "yellow"
        if (!brd.width) brd.width = 1
        if (!brd.type) brd.type = "line"

        let view = this.#jee.view
        let context = view.context
        let body = this.#obj.body
        let scope = body.getScope()
        const left = scope.left + view.hw + this.#cameraZx
        const right = scope.right + view.hw + this.#cameraZx
        const top = -scope.top + view.hh + this.#cameraZy
        const bottom = -scope.bottom + view.hh + this.#cameraZy

        const x = this.#obj.x + view.hw + this.#cameraZx
        const y = -this.#obj.y + view.hh + this.#cameraZy

        this.dot(x, y)

        if (brd.type == "dots") {
            this.dot(left, top, brd.color)
            this.dot(right, top, brd.color)
            this.dot(left, bottom, brd.color)
            this.dot(right, bottom, brd.color)
        }
        if (brd.type == "line") {
            // поменять на rect
            context.beginPath()
            context.lineWidth = brd.width
            context.strokeStyle = brd.color
            context.moveTo(left, top)
            context.lineTo(right, top)
            context.lineTo(right, bottom)
            context.lineTo(left, bottom)
            context.lineTo(left, top)
            context.stroke()
        }
        if (brd.txtFnc) {
            context.fillStyle = brd.color
            context.fillText(brd.txtFnc(this.#obj), left, top - 10)
        }
        if (brd.field) {
            context.fillStyle = brd.color
            context.fillText(this.#obj[brd.field], left, top - 10)
        }
    }

    /** List url image files */
    files = []
    filesData = []
    num = 0
    x = 0
    y = 0
    parts = []
    genParts = ([x, y], [width, height], [stepX, stepY], count, picNum = 0) => {
        const parts = []
        for (let i = 0; i < count; i++)
            parts.push([
                x + stepX * i,
                y + stepY * i,
                width, height,
                picNum
            ])
    }

    getSizes() {
        const pic = this.filesData[this.num]
        let w = 0, h = 0

        if (pic) {
            if (pic.width) w = pic.width
            if (pic.height) h = pic.height
        }
        if (this.width !== undefined) w = this.width
        if (this.height !== undefined) h = this.height

        w *= this.#obj.size
        h *= this.#obj.size

        return { width: w, height: h }
    }


    /** Animation. Format: {name: [list pic numbers of files or parts]} */
    anim = {}

    #anima = {
        name: '',
        num: 0,
        frame: 0,
        speed: 1,
        pics: [],
        length: 0,
    }
    set animName(val) {
        if (this.#anima.name == val) return
        if (!this.anim[val]) return

        this.#anima.name = val
        this.#anima.frame = 0
        this.#anima.pics = this.anim[val]
        this.#anima.length = this.anim[val].length
        this.#anima.num = this.#anima.speed
        this.num = this.#anima.pics[this.#anima.frame]
    }
    get animName() { return this.#anima.name }
    set animSpeed(val) { this.#anima.speed = val }
    get animSpeed() { return this.#anima.speed }
    #animaWork() {
        if (!this.#anima.name) return

        if (this.#anima.num == 0) {
            this.#anima.num = this.#anima.speed
            this.#anima.frame++
            if (this.#anima.frame >= this.#anima.length) this.#anima.frame = 0
            this.num = this.#anima.pics[this.#anima.frame]
        } else this.#anima.num--
    }




}













class __JEEObjBody {
    #obj
    #jee
    x = 0
    y = 0
    width
    height
    angle = 0


    constructor(obj) {
        if (obj instanceof JEEObj) this.#obj = obj
        if (jee && jee instanceof JEE) this.#jee = jee
    }

    getSizes() {
        const s = this.#obj.pic.getSizes()
        let w = s.width, h = s.height
        if (this.width !== undefined) w = this.width * this.#obj.size
        if (this.height !== undefined) h = this.height * this.#obj.size
        return { width: w, height: h }
    }

    #left
    #right
    #top
    #bottom
    #oldPrm = { x: null, y: null, size: null }
    setCollider() {
        // if (this.#obj.nonContact) return

        // перезадавать если сменились:
        // x,y,size
        // по остальным пока пофиг. Можно указать, что 
        // надо при изменении параметров body в update()
        // вызывать setCollider()
        const obj = this.#obj
        let re = false
        if (this.#oldPrm.x != obj.x) re = true
        if (this.#oldPrm.y != obj.y) re = true
        if (this.#oldPrm.size != obj.size) re = true
        if (!re) return

        let sizes = this.getSizes()

        this.#left = obj.x - sizes.width / 2 + this.x
        this.#right = obj.x + sizes.width / 2 + this.x
        this.#top = obj.y + sizes.height / 2 + this.y
        this.#bottom = obj.y - sizes.height / 2 + this.y

        // без этого спотыкается об углы на ровной стене из кубиков
        // а с ним немного трясется при скольжении, но не застревает
        // this.#left = parseInt(this.#left)
        // this.#right = parseInt(this.#right)
        // this.#top = parseInt(this.#top)
        // this.#bottom = parseInt(this.#bottom)

        // this.#left = parseFloat(this.#left.toFixed(3))
        // this.#right = parseFloat(this.#right.toFixed(3))
        // this.#top = parseFloat(this.#top.toFixed(3))
        // this.#bottom = parseFloat(this.#bottom.toFixed(3))

        this.#left = Math.round(this.#left * 1000) / 1000
        this.#right = Math.round(this.#right * 1000) / 1000
        this.#top = Math.round(this.#top * 1000) / 1000
        this.#bottom = Math.round(this.#bottom * 1000) / 1000

        this.#oldPrm.x = obj.x
        this.#oldPrm.y = obj.y
        this.#oldPrm.size = obj.size
    }

    getScope() {
        return {
            top: this.#top,
            bottom: this.#bottom,
            left: this.#left,
            right: this.#right,
        }
    }



    __work() {
        this.setCollider()
        this.#physicsWork()
    }

    contactObj(_obj, inside, key, val) {
        if (!(_obj instanceof JEEObj)) return
        if (_obj.nonContact) return
        if (this.#obj.id == _obj.id) return
        if (this.#obj.nonContact) return
        if (!this.#obj.active) return
        if (this.#obj.hidden) return

        if (key)
            if (!(key instanceof JEEObj)) {
                if (_obj[key] != val) return
            } else if (_obj.id == key.id) return

        const coll2 = _obj.body.getScope()

        if (
            !inside &&
            _obj.active &&
            !_obj.hidden &&
            this.#top + 1 > coll2.bottom &&
            this.#bottom - 1 < coll2.top &&
            this.#right + 1 > coll2.left &&
            this.#left - 1 < coll2.right
        )
            return _obj

        if (
            inside &&
            _obj.active &&
            !_obj.hidden &&
            this.#bottom > coll2.bottom &&
            this.#top < coll2.top &&
            this.#left > coll2.left &&
            this.#right < coll2.right
        )
            return _obj
    }

    contact(key, val, inside) {
        let res

        if (this.#obj.nonContact) return

        for (const obj of jee.objects)
            if ((res = this.contactObj(obj, inside, key, val))) return res
    }

    contacts(key, val, inside) {
        let ot = [],
            res

        if (this.#obj.nonContact) return

        for (const obj of jee.objects)
            if ((res = this.contactObj(obj, inside, key, val))) ot.push(res)

        return ot
    }






    // PHYSICS

    onGround = false
    gravVel = 0
    mass = 0

    #type
    /** undefined / 'wall' / 'unit' / 'free' */
    set type(val) {
        this.#type = val
        if (val) this.#jee.physics.add(this.#obj)
        else this.#jee.physics.remove(this.#obj)
    }
    get type() { return this.#type }

    #physicsWork() {
        if (!this.#type || this.#type != "unit") return
        if (!this.#obj.active) return
        if (this.#obj.hidden) return

        const self = this.#obj
        let coll1 = self.body.getScope()

        if (this.mass) {
            self.y += this.mass * this.gravVel
            self.body.setCollider()
        }

        this.onGround = false
        const backs = []
        const collsGrnd = []

        for (const obj of this.#jee.physics.getList())
            if (obj instanceof JEEObj &&
                this.#obj.id != obj.id &&
                obj.active && !obj.hidden &&
                (obj.body.type == "wall" || obj.body.type == "unit")) {

                const coll2 = obj.body.getScope()
                if (coll1.right > coll2.left &&
                    coll1.left < coll2.right &&
                    coll1.top > coll2.bottom) {

                    if (coll1.bottom < coll2.top) {
                        let diffXR = coll2.left - coll1.right
                        let diffXL = coll2.right - coll1.left
                        let diffYT = coll2.bottom - coll1.top
                        let diffYB = coll2.top - coll1.bottom
                        if (Math.abs(diffXR) < Math.abs(diffXL)) diffXL = 0
                        else diffXR = 0
                        if (Math.abs(diffYT) < Math.abs(diffYB)) diffYB = 0
                        else diffYT = 0
                        let backX = diffXR + diffXL
                        let backY = diffYT + diffYB
                        if (Math.abs(backX) < Math.abs(backY)) backY = 0
                        else backX = 0
                        backs.push([backX, backY])
                    }

                    if (coll1.bottom - 1 < coll2.top) collsGrnd.push(coll2)
                }
            }

        // console.log(JSON.stringify(backs));

        if (backs.length > 0) {
            let nxR = 0, nxL = 0, nyT = 0, nyB = 0
            for (const m of backs) {
                if (m[0] < nxR) nxR = m[0]
                if (m[0] > nxL) nxL = m[0]
                if (m[1] < nyT) nyT = m[1]
                if (m[1] > nyB) nyB = m[1]
            }

            const nx = self.x + nxL + nxR
            const ny = self.y + nyT + nyB
            if (nx != self.x || ny != self.y) {
                self.x += nxL + nxR
                self.y += nyT + nyB
                self.body.setCollider()
            }
        }

        coll1 = self.body.getScope()
        for (const coll2 of collsGrnd) {
            if (coll1.right - 1 > coll2.left &&
                coll1.left + 1 < coll2.right &&
                coll1.top > coll2.bottom &&
                coll1.bottom - 1 < coll2.top) {
                this.onGround = true
            }
        }

        if (this.mass) {
            if (!this.onGround) this.gravVel -= 0.5
            else this.gravVel = 0
        }
    }

    jump(val) {
        if (this.onGround) this.gravVel = val
    }



    
}








