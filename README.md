# JEE.js
Javascript easy engine


______

Проект находится в разработке

______

Цель: сделать максимально простой движок для создания игр. Запуск делается просто созданием файлов `index.html`, `game.js`, и подключения к ним `JEE.js` для использования двух классов для наследования `JEE` для игры, и `JEEObj` для создания юнитов. Не используется никакого специального js-подключения типа import или require, для появления подсказок при настройке наследуемых классов, надо просто чтобы в редакторе (VS Code) был открыт и файл `JEE.js`.

______

Пример:
```javascript
var Jee = class extends JEE {
    init() {
        this.name = 'Test game'
        this.view.bodyColor = '#234'
    }
}

var Star = class extends JEEObj {
    speed = 1
    dir = 1

    init() {
        this.pic.files = ['images/star.png', 'images/star2.png']
        this.x = this.jee.randomW(200)
        this.y = 300
        this.body.height = 50
        this.body.width = 50
        this.size = 2
    }

    start() {
        this.speed = this.jee.random(5, 10)
        this.dir = this.jee.random(-1)
        this.pic.num = this.jee.random(0, 1)
    }

    update() {
        this.y -= this.speed
        this.pic.rotation += this.speed * this.dir

        if (this.y < -300) {
            this.y = 300
            this.x = this.jee.randomW(200)
            this.speed = this.jee.random(1, 10)
            this.dir = this.jee.random(-1)
            this.pic.num = this.jee.random(0, 1)
        }
    }
}
```











