export const GAME_CONFIG = {
    BASE_DIMENSIONS: {
        width: 640,
        height: 960
    },
    
    PHYSICS: {
        friction: 0.8,
        frictionStatic: 0.8,
        frictionAir: 0,
        restitution: 0.3,
        wallPad: 64,
        // Fixed timestep configuration for framerate independence
        timestep: {
            delta: 1000 / 60,      // 60fps physics (16.67ms per frame)
            deltaMin: 1000 / 120,  // Minimum delta (8.33ms for 120fps)
            deltaMax: 1000 / 30,   // Maximum delta (33.33ms for 30fps)
            isFixed: true          // Enable fixed timestep mode
        }
    },
    
    UI: {
        statusBarHeight: 48,
        fontSize: {
            score: 84,
            endTitle: 48,
            statusValue: 24,
            statusLabel: 16,
            endLink: 24
        },
        spacing: {
            scorePadding: 16,
            statusMarginLeft: 24,
            statusMarginRight: 8,
            statusItemMarginRight: 32,
            endModalPadding: 32,
            endModalPaddingHorizontal: 48,
            endModalMarginTop: 16,
            endModalPadding2: 16
        },
        sizes: {
            nextFruitIcon: 24,
            endModalBorderRadius: 32,
            endModalBorderWidth: 5,
            endLinkBorderRadius: 16
        }
    },
    
    MENU: {
        backgroundSize: 512,
        fruitRadius: 48,
        circleRadius: 192,
        startButtonWidth: 512,
        startButtonHeight: 96,
        backgroundY: 0.4,  // percentage of screen height
        startButtonY: 0.75  // percentage of screen height
    },
    
    GAMEPLAY: {
        loseHeight: 84,
        previewBallHeight: 32,
        maxDropableSize: 5,  // max fruit size that can be dropped
        dropTimeoutFrames: 30 // frames before next fruit can be dropped (30 frames = 0.5s at 60fps)
    },
    
    FRUITS: [
        { radius: 24,  scoreValue: 1,  img: './assets/img/1_blueberry.png',    imgSize: 780 },
        { radius: 32,  scoreValue: 3,  img: './assets/img/2_strawberry.png',   imgSize: 780 },
        { radius: 40,  scoreValue: 6,  img: './assets/img/3_passionfruit.png', imgSize: 780 },
        { radius: 56,  scoreValue: 10, img: './assets/img/4_lime.png',         imgSize: 780 },
        { radius: 64,  scoreValue: 15, img: './assets/img/5_peach.png',        imgSize: 780 },
        { radius: 72,  scoreValue: 21, img: './assets/img/6_kiwifruit.png',    imgSize: 780 },
        { radius: 84,  scoreValue: 28, img: './assets/img/7_orange.png',       imgSize: 780 },
        { radius: 96,  scoreValue: 36, img: './assets/img/8_grapefruit.png',   imgSize: 780 },
        { radius: 128, scoreValue: 45, img: './assets/img/9_dragonfruit.png',  imgSize: 780 },
        { radius: 160, scoreValue: 55, img: './assets/img/10_rockmelon.png',   imgSize: 780 },
        { radius: 192, scoreValue: 66, img: './assets/img/11_watermelon.png',  imgSize: 780 }
    ],
    
    ASSETS: {
        sounds: {
            click: './assets/click.mp3',
            pop: Array.from({length: 11}, (_, i) => `./assets/pop${i}.mp3`)
        },
        images: {
            background: './assets/img/background.png',
            menuBackground: './assets/img/bg-menu.png',
            startButton: './assets/img/btn-start.png',
            popEffect: './assets/img/pop.png'
        }
    }
};

export const GAME_STATES = {
    MENU: 0,
    READY: 1,
    DROP: 2,
    LOSE: 3
};