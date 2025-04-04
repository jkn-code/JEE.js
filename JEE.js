console.log("JEE.js 1.5")

var jee
setTimeout(() => (jee = new Jee()), 10)

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
            if (this.files.all == this.files.ok) {
                clearInterval(wait)
                this.#startGame()
            }
        }, 300)
    }

    #fpsTime
    #fpsCount
    #startGame() {
        console.log("::: start jee")

        this.#fpsTime = 1000 / this.fpsLimit

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

        // if (this.log) {
        //		 this.#consoleDiv.style.display = 'block'
        //		 this.#consoleDiv.innerHTML = ''
        // } else this.#consoleDiv.style.display = 'none'

        // this.#mouseLjmgmp()
        // this.#touchLjmgmp()

        this.#loopUpdate()
        this.#loopDraw()

        // if (this.log) this.#ljmgmpLog()

        this.#fpsCount++
        this.#frame++

        this.control.pressOut()
        // if (!this.isMobile) for (const k in this.press) this.press[k] = false
        // else for (const k in this.touchS) this.touchS[k] = false
    }

    #loopUpdate() {
        let i = 0
        let md = []
        for (const obj of this.objects)
            if (obj instanceof JEEObj) {
                obj.__work()
                if (obj.toDelete) {
                    if (obj.stop) obj.stop()
                    // obj.active = false
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
                0,
                0,
                this.view.canvas.width,
                this.view.canvas.height
            )

        let mas = []

        // тут потом сделать фильтр по видимости и настройкам
        for (const obj of this.objects) mas.push(obj)

        if (this.orderY) mas.sort(this.#orderY)

        for (const z of this.#zList)
            for (const obj of mas) if (obj.z == z) obj.__draw()
    }

    #orderY(a, b) {
        if (a.y < b.y) return 1
        if (a.y > b.y) return -1
        return 0
    }

    /** random(1) = 0.0 - 1.0 random(-1) = -1/1 random(true) = true/false random(0, 100) = 0 - 100 */
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
            if (obj instanceof JEEObj) if (obj.atCamera) obj.atCamera = false
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

        this.curtain.style.cssText +=
            `
            position: absolute ;
            top: 0 ;
            left: 0 ;
            height: 100% ;
            width: 100% ;
            background: ${document.body.style.backgroundColor};
            z-index: 9999 ;
            display: flex ;
            align-items: center ;
            justify-content: center;
            line-height: 300%;
            `
        this.curtainIn = document.createElement("div")
        this.curtain.appendChild(this.curtainIn)
        this.curtainIn.style.cssText = "text-align: center padding: 30px"
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
        // this.context.textAlign = this.__defCtxText.textAlign
        // this.context.font = '130px Arial'
        // this.context.font = this.__defCtxText.fontWeight + ' ' +
        //		 this.__defCtxText.fontSize + ' ' +
        //		 this.__defCtxText.fontFamily
        // console.log(this.context.font)

        if (this.canvasCss) this.canvas.style.cssText += this.canvasCss
        // this.canvas.style.filter = this.canvasCss
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
        this.context.font =
            this.__defCtxText.fontWeight +
            " " + // чтобы задать шрифт, надо перезадать размер канвасу
            this.__defCtxText.fontSize +
            "px " +
            this.__defCtxText.fontFamily
        // console.log(this.context.font)

        const cpos = this.canvas.cpos
        const kh = cpos.height / this.canvasQuality
        /*
        document.querySelectorAll('.jee').forEach(el => {
        el.style.position = 'absolute'
        if (getComputedStyle(el).zIndex == 'auto') el.style.zIndex = 1
        if (getComputedStyle(el).boxSizing == '')
        el.style.boxSizing = 'border-box'
        
        let left = parseFloat(el.getAttribute('jee-left'))
        let right = parseFloat(el.getAttribute('jee-right'))
        let top = parseFloat(el.getAttribute('jee-top'))
        let bottom = parseFloat(el.getAttribute('jee-bottom'))
        let x = parseFloat(el.getAttribute('jee-x'))
        let y = parseFloat(el.getAttribute('jee-y'))
        let w = parseFloat(el.getAttribute('jee-width'))
        let h = parseFloat(el.getAttribute('jee-height'))
        
        if (!isNaN(w)) el.style.width = (w * kh) + 'px'
        if (!isNaN(h)) el.style.height = (h * kh) + 'px'
        if (isNaN(x) && isNaN(right) && isNaN(left)) left = 0
        if (isNaN(y) && isNaN(bottom) && isNaN(top)) top = 0
        
        const elPos = el.getBoundingClientRect()
        if (!isNaN(left)) el.style.left = (cpos.left + left * kh) + 'px'
        if (!isNaN(right)) el.style.right = (right * kh + innerWidth - cpos.width - cpos.left) + 'px'
        if (!isNaN(top)) el.style.top = (cpos.top + top * kh) + 'px'
        if (!isNaN(bottom)) el.style.bottom = (bottom * kh + innerHeight - cpos.height - cpos.top) + 'px'
        if (!isNaN(x)) el.style.left = (cpos.left + this.hw * kh + x * kh) + 'px'
        if (!isNaN(y)) el.style.top = (cpos.top + this.hh * kh - y * kh) + 'px'
        
        if (getComputedStyle(el).padding != '') {
        if (!el.mgmPadding)
        el.mgmPadding = parseInt(getComputedStyle(el).padding.replace('px', ''))
        el.style.padding = (el.mgmPadding * kh) + 'px'
        }
        })
        
        this.#touchBtns.forEach(btn => {
        const cpos = btn.el.getBoundingClientRect()
        const left = cpos.left - this.canvas.cpos.left
        const top = cpos.top - this.canvas.cpos.top
        btn.x1 = left
        btn.y1 = top
        btn.x2 = left + cpos.width
        btn.y2 = top + cpos.height
        })
        
        this.#touchSticks.forEach(stick => {
        const cpos = stick.el.getBoundingClientRect()
        const left = cpos.left - this.canvas.cpos.left
        const top = cpos.top - this.canvas.cpos.top
        stick.x1 = left
        stick.y1 = top
        stick.x2 = left + cpos.width
        stick.y2 = top + cpos.height
        stick.px = left + 60
        stick.py = top + 60
        })
        */
        // if (this.objectsId > 0) this.#ljmgmpDraw()
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

        // this.#jee.view.canvas.mouseenter = e => {
        //		 console.log(e)
        // }
    }

    #initKeys() {
        const keyNames = {
            backspace: false,
            enter: false,
            shift: false,
            ctrl: false,
            escape: false,
            space: false,
            left: false,
            up: false,
            right: false,
            down: false,
            n0: false,
            n1: false,
            n2: false,
            n3: false,
            n4: false,
            n5: false,
            n6: false,
            n7: false,
            n8: false,
            n9: false,
            a: false,
            b: false,
            c: false,
            d: false,
            e: false,
            f: false,
            g: false,
            h: false,
            i: false,
            j: false,
            k: false,
            l: false,
            m: false,
            n: false,
            o: false,
            p: false,
            q: false,
            r: false,
            s: false,
            t: false,
            u: false,
            v: false,
            w: false,
            x: false,
            y: false,
            z: false,
        }
        this.keys = { ...keyNames }
        this.press = { ...keyNames }
        this.pressK = {}
        const keyNums = {
            38: "up",
            40: "down",
            37: "left",
            39: "right",
            32: "space",
            13: "enter",
            27: "escape",
            16: "shift",
            17: "ctrl",
            8: "backspace",
            65: "a",
            66: "b",
            67: "c",
            68: "d",
            69: "e",
            70: "f",
            71: "g",
            72: "h",
            73: "i",
            74: "j",
            75: "k",
            76: "l",
            77: "m",
            78: "n",
            79: "o",
            80: "p",
            81: "q",
            82: "r",
            83: "s",
            84: "t",
            85: "u",
            86: "v",
            87: "w",
            88: "x",
            89: "y",
            90: "z",
            48: "n0",
            49: "n1",
            50: "n2",
            51: "n3",
            52: "n4",
            53: "n5",
            54: "n6",
            55: "n7",
            56: "n8",
            57: "n9",
        }
        // for (const j in keyNums) this.keys[keyNums[j]] = false
        // for (const j in keyNums) this.press[keyNums[j]] = false
        // let a = {}
        // for (const j in keyNums) a[keyNums[j]] = false
        // console.log(JSON.stringify(a))

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

    pressOut() {
        // ???
        if (!this.isMobile) for (const k in this.press) this.press[k] = false
        // else for (const k in this.touchS) this.touchS[k] = false
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
    z = 0
    active = true
    hidden = false
    /** Array url images */
    pics = []
    picsData = []
    picNum = 0
    imgX = 0
    imgY = 0
    rotation = 0
    angle = 0
    size = 1
    alpha = 1
    width
    height
    isClone = false
    cameraZ = 1
    border = {
        width: undefined,
        type: undefined,
        color: undefined,
        txtFnc: undefined,
        field: undefined,
    }
    flipX = false
    flipY = false
    atCamera = false
    nonContact

    collider = new __JEEObjCollider(this)
    view = new __JEEObjView(this)
    physics = new __JEEObjPhysics(this)

    #parent
    #ready = false

    constructor(parent) {
        if (jee && jee instanceof JEE) this.jee = jee ///
        this.jee.objects.push(this)
        this.id = this.jee.getNewObjId()

        if (parent === true) this.#initOrig()
        if (parent && parent instanceof JEEObj) this.#initClone(parent)
    }

    #initOrig() {
        this.name = this.constructor.name
        console.log(">>>>>>> ORIG >>>>>>>>>>", this.name)

        this.init()

        for (let pic of this.pics) this.picsData.push(this.jee.files.load(pic))

        this.#ready = true
    }

    #initClone(parent) {
        // console.log(parent)
        // console.log('|||||| CLONE ||||||')

        if (parent instanceof JEEObj) this.#parent = parent
        else return

        this.collider = new __JEEObjCollider(this)
        this.view = new __JEEObjView(this)
        this.physics = new __JEEObjPhysics(this)

        for (let v in this.#parent) {
            // console.log(v, this.#parent[v])
            if (v == "collider") {
                // console.log(this.#parent[v])
                for (const c in this.#parent[v]) {
                    // console.log(c)
                    this.collider[c] = this.#parent[v][c]
                }
            } else if (v == "physics") {
                this.physics.mass = this.#parent.physics.mass
                this.physics.type = this.#parent.physics.type
                // console.log(this.#parent[v])
                // for (const c in this.#parent[v]) {
                //		 console.log(c, this.#parent[v][c])
                //		 this.physics[c] = this.#parent[v][c]
                // }
            } else if (v != "view" && v != "id" && v != "jee") {
                // console.log(v, this.#parent[v])
                if (v == "pics" || v == "picsData" || v == "border")
                    this[v] = this.#parent[v]
                else if (this.#parent[v])
                    this[v] = JSON.parse(JSON.stringify(this.#parent[v]))
            }
        }

        this.isClone = true
        this.#ready = true
    }

    /** Run before load. For original object, no for clones. */
    init() { }
    /** Run in first frame before update() */
    start() { }
    /** Run in every frame */
    update() { }

    clone() {
        // console.log(this.name, this.constructor);
        if (this instanceof JEEObj)
            return new this.constructor(this)
    }

    #startFrame
    __work() {
        if (!this.#ready) return
        // console.log('========' + this.name + '=========')
        if (!this.#startFrame) {
            this.#startFrame = true
            this.start()
        }
        // else
        this.update()

        this.#waitsWork()
        this.#setSize()
        // this.collider.work()
        this.collider.setCollider()
        // console.log(this.name, this.physics)

        this.physics.__work()
        this.jee.setZLayer(this)
        if (this.anglePic) this.rotation = this.angle
        if (this.atCamera) {
            this.jee.view.camera.x = this.x
            this.jee.view.camera.y = this.y
        }
    }

    __draw() {
        if (!this.#ready) return
        // if (this.toDelete) return

        this.view.draw()
    }

    getPic() {
        return this.picsData[this.picNum]
    }

    #width = 0
    #height = 0
    #oldSizes = {}
    #setSize() {
        let pic = this.getPic()

        if (
            this.#oldSizes.w == this.width &&
            this.#oldSizes.h == this.height &&
            this.#oldSizes.s == this.size &&
            this.#oldSizes.p == pic
        )
            return

        if (this.width !== undefined) this.#width = this.width * this.size
        else if (pic && pic.width) this.#width = pic.width * this.size

        if (this.height !== undefined) this.#height = this.height * this.size
        else if (pic && pic.height) this.#height = pic.height * this.size

        this.#oldSizes.w = this.width
        this.#oldSizes.h = this.height
        this.#oldSizes.s = this.size
        this.#oldSizes.p = pic
        // console.log(this.#oldSizes)
    }

    getSizes() {
        return {
            // picWidth: this.#picWidth,
            // picHeight: this.#picHeight,
            width: this.#width,
            height: this.#height,
        }
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

        // if (keys.w || keys.s || keys.a || keys.d) this.stepA(speed, angle)
        if (angle) this.stepA(speed, angle)

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
            // console.log(wait.n, this.name)
            if (wait.n == 0) {
                if (wait.repeat) wait.n = wait.frames - 1
                else delete this.#wait[j]
                wait.func()
            } else wait.n--
        }
    }

    /** Do func() after few frames. Set name if you need to stop, or set name = ''. To stop set name and frames = null. */
    wait(name, frames, func) {
        // зачем имя? Может останавливать?
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
        let res = this.collider.contact(key, val, false)
        if (res instanceof JEEObj) return res
    }

    contactIn(key, val) {
        let res = this.collider.contact(key, val, true)
        if (res instanceof JEEObj) return res
    }

    contacts(key, val) {
        return this.collider.contacts(key, val, false)
    }

    contactsIn(key, val) {
        return this.collider.contacts(key, val, true)
    }
}

class __JEEObjView {
    #obj
    #jee

    image
    picFiles

    constructor(obj) {
        if (obj instanceof JEEObj) this.#obj = obj
        if (jee && jee instanceof JEE) this.#jee = jee
    }

    #cameraZx
    #cameraZy
    draw() {
        if (!this.#obj.active) return
        if (this.#obj.hidden) return

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
        if (obj.rotation != 0) context.rotate((obj.rotation * Math.PI) / 180)
        const flip = obj.getFlip()
        context.scale(flip[0], flip[1])
        if (obj.effect) context.filter = obj.effect // ???

        let image = obj.getPic()
        let sizes = obj.getSizes()
        if (image) {
            let w = obj.imgW || sizes.width
            let h = obj.imgH || sizes.height
            context.drawImage(
                image,
                -w / 2 + obj.imgX * obj.size,
                -h / 2 - obj.imgY * obj.size,
                w,
                h
            )
        }

        // this.drawPrimitives(1)

        context.restore()

        this.boardsShow()
        // if (jee.params.borders && !this.nocont) this.#boardsShow(jee.params.borders)
    }

    dot(x, y, col = "#ff0") {
        this.#jee.view.context.fillStyle = col
        this.#jee.view.context.fillRect(x - 1, y - 1, 3, 3)
    }

    boardsShow() {
        // if (!this.#obj.border) return
        const brd = this.#obj.border
        if (!brd.color && !brd.width && !brd.type && !brd.field && !brd.txtFnc)
            return
        if (!brd.color) brd.color = "yellow"
        if (!brd.width) brd.width = 1
        if (!brd.type) brd.type = "line"

        let view = this.#jee.view
        let context = view.context
        let collider = this.#obj.collider
        let scope = collider.getScope()
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
        // if (border[2] && border[2] == 'name') {
        // jee.context.fillText(this.name, left, bottom)
        // context.fillText(JSON.stringify(this.#obj.getSizes()), left, top - 20)
        // context.fillText(this.#obj.name + "|" + this.#obj.x + "|" + this.#obj.y, left, top - 20)
        if (brd.txtFnc) {
            context.fillStyle = brd.color
            context.fillText(brd.txtFnc(this.#obj), left, top - 10)
        }
        if (brd.field) {
            context.fillStyle = brd.color
            context.fillText(this.#obj[brd.field], left, top - 10)
        }
        // }
    }

    // log(txt) {
    //		 jee.view.context.fillText(txt, this.obj.x, this.obj.y + 50)
    // }
}

class __JEEObjCollider {
    #obj
    #jee
    x
    y
    width
    height
    /** undefined / 'unit' / 'wall' */
    // #physics
    // set physics(val) {
    //		 this.#physics = val
    //		 this.#jee.physics.add(this.#obj)
    // }
    // get physics() { return this.#physics }

    constructor(obj) {
        if (obj instanceof JEEObj) this.#obj = obj
        if (jee && jee instanceof JEE) this.#jee = jee
    }

    #left
    #right
    #top
    #bottom
    #width = 0
    #height = 0
    #x = 0
    #y = 0
    setCollider() {
        // надобы разделить на изменение размера и просто смену координат
        // if (this.#obj.nonContact) return

        let sizes = this.#obj.getSizes()

        this.#width = sizes.width
        this.#height = sizes.height
        if (this.width !== undefined) this.#width = this.width * this.#obj.size
        if (this.height !== undefined) this.#height = this.height * this.#obj.size

        if (this.x != undefined) this.#x = this.x
        if (this.y != undefined) this.#y = this.y

        // console.log(this.#x, _imgWidth, this.picX)

        this.#left = this.#obj.x - this.#width / 2 + this.#x
        this.#right = this.#obj.x + this.#width / 2 + this.#x
        this.#top = this.#obj.y + this.#height / 2 + this.#y
        this.#bottom = this.#obj.y - this.#height / 2 + this.#y
    }

    getScope() {
        return {
            top: this.#top,
            bottom: this.#bottom,
            left: this.#left,
            right: this.#right,
        }
    }

    work() {
        this.setCollider()
    }

    contactObj(_obj, inside, key, val) {
        if (!(_obj instanceof JEEObj)) return
        if (_obj.nonContact) return
        if (this.#obj.id == _obj.id) return
        if (!this.#obj.nonContact) return
        if (!this.#obj.active) return
        if (this.#obj.hidden) return

        if (key)
            if (!(key instanceof JEEObj)) {
                if (_obj[key] != val) return
            } else if (_obj.id == key.id) return

        const coll2 = _obj.collider.getScope()

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
}

class __JEEObjPhysics {
    #obj
    #jee
    onGround = false
    gravVel = 0

    constructor(obj) {
        if (obj instanceof JEEObj) this.#obj = obj
        if (jee && jee instanceof JEE) this.#jee = jee
    }

    #type
    /** undefined / 'wall' / 'unit' / 'free' */
    set type(val) {
        this.#type = val
        if (val) this.#jee.physics.add(this.#obj)
        else this.#jee.physics.remove(this.#obj)
    }
    get type() {
        return this.#type
    }

    mass = 0

    __work() {
        if (!this.#type || this.#type != "unit") return
        if (!this.#obj.active) return
        if (this.#obj.hidden) return

        const self = this.#obj
        let coll1 = self.collider.getScope()

        if (this.mass) {
            self.y += this.mass * this.gravVel
            self.collider.setCollider()
        }

        this.onGround = false
        const backs = []
        const collsGrnd = []

        // вроде оно не только сталкивания проверяет, но еще величину захода, и компенсирует ее
        // но еще и выталкивает к ближней стороне при попадании одного на другого
        for (const obj of this.#jee.physics.getList())
            if (obj instanceof JEEObj &&
                this.#obj.id != obj.id &&
                obj.active && !obj.hidden &&
                (obj.physics.type == "wall" || obj.physics.type == "unit")
            ) {
                const coll2 = obj.collider.getScope()
                if (
                    coll1.right > coll2.left &&
                    coll1.left < coll2.right &&
                    coll1.top > coll2.bottom
                ) {
                    if (coll1.bottom < coll2.top) {
                        let vxRight = coll2.left - coll1.right
                        let vxLeft = coll2.right - coll1.left
                        let vyTop = coll2.bottom - coll1.top
                        let vyBottom = coll2.top - coll1.bottom
                        if (Math.abs(vxRight) < Math.abs(vxLeft)) vxLeft = 0
                        else vxRight = 0
                        if (Math.abs(vyTop) < Math.abs(vyBottom)) vyBottom = 0
                        else vyTop = 0
                        let backX = vxRight + vxLeft
                        let backY = vyTop + vyBottom
                        if (Math.abs(backX) < Math.abs(backY)) backY = 0
                        else backX = 0
                        backs.push([backX, backY, obj.name])
                    }
                    if (coll1.bottom - 1 < coll2.top) collsGrnd.push(coll2)
                }
            }

        if (backs.length > 0) {
            let nxR = 0,
                nxL = 0,
                nyT = 0,
                nyB = 0
            for (const m of backs) {
                if (m[0] < nxR) nxR = m[0]
                if (m[0] > nxL) nxL = m[0]
                if (m[1] < nyT) nyT = m[1]
                if (m[1] > nyB) nyB = m[1]
            }
            // const obj = this.#obj
            const nx = self.x + nxL + nxR
            const ny = self.y + nyT + nyB
            if (nx != self.x || ny != self.y) {
                self.x += nxL + nxR
                self.y += nyT + nyB
                self.collider.setCollider()
            }
        }
        // console.log(colls.length)

        coll1 = self.collider.getScope()
        for (const coll2 of collsGrnd) {
            if (
                coll1.right - 1 > coll2.left &&
                coll1.left + 1 < coll2.right &&
                coll1.top > coll2.bottom &&
                coll1.bottom - 1 < coll2.top
            ) {
                this.onGround = true
                // this.gravVel = 0
                // console.log('xxxxxx')
            }
        }

        if (this.mass) {
            // console.log(collsGrnd.length, this.onGround, this.gravVel)
            if (!this.onGround) this.gravVel -= 0.5
            else this.gravVel = 0
        }
    }

    jump(val) {
        // console.log("JUMP")
        if (this.onGround) this.gravVel = val
    }
}

class __JEEObjMove {
    #obj

    constructor(obj) {
        if (obj instanceof JEEObj) this.#obj = obj
    }
}
