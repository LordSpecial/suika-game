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
        { radius: 30,  scoreValue: 1,  img: './assets/img/realFruits/1_blueberry.png',    imgSize: 780 },
        { radius: 40,  scoreValue: 3,  img: './assets/img/realFruits/2_strawberry.png',   imgSize: 780 },
        { radius: 50,  scoreValue: 6,  img: './assets/img/realFruits/3_passionfruit.png', imgSize: 780 },
        { radius: 70,  scoreValue: 10, img: './assets/img/realFruits/4_lime.png',         imgSize: 780 },
        { radius: 80,  scoreValue: 15, img: './assets/img/realFruits/5_peach.png',        imgSize: 780 },
        { radius: 90,  scoreValue: 21, img: './assets/img/realFruits/6_kiwifruit.png',    imgSize: 780 },
        { radius: 105, scoreValue: 28, img: './assets/img/realFruits/7_orange.png',       imgSize: 780 },
        { radius: 120, scoreValue: 36, img: './assets/img/realFruits/8_grapefruit.png',   imgSize: 780 },
        { radius: 160, scoreValue: 45, img: './assets/img/realFruits/9_dragonfruit.png',  imgSize: 780 },
        { radius: 200, scoreValue: 55, img: './assets/img/realFruits/10_rockmelon.png',   imgSize: 780 },
        { radius: 240, scoreValue: 66, img: './assets/img/realFruits/11_watermelon.png',  imgSize: 780 }
    ],
    
    ASSETS: {
        sounds: {
            click: './assets/click.mp3',
            pop: Array.from({length: 11}, (_, i) => `./assets/pop${i}.mp3`)
        },
        images: {
            background: './assets/img/backgrounds/background.png',
            menuBackground: './assets/img/bg-menu.png',
            startButton: './assets/img/btn-start.png',
            popEffect: './assets/img/pop.png'
        }
    },
    
    THEMES: {
        BALLS: {
            realFruits: {
                name: 'Real Fruits',
                items: [
                    { radius: 24,  scoreValue: 1,  img: './assets/img/realFruits/1_blueberry.png',    imgSize: 780 },
                    { radius: 32,  scoreValue: 3,  img: './assets/img/realFruits/2_strawberry.png',   imgSize: 780 },
                    { radius: 40,  scoreValue: 6,  img: './assets/img/realFruits/3_passionfruit.png', imgSize: 780 },
                    { radius: 56,  scoreValue: 10, img: './assets/img/realFruits/4_lime.png',         imgSize: 780 },
                    { radius: 64,  scoreValue: 15, img: './assets/img/realFruits/5_peach.png',        imgSize: 780 },
                    { radius: 72,  scoreValue: 21, img: './assets/img/realFruits/6_kiwifruit.png',    imgSize: 780 },
                    { radius: 84,  scoreValue: 28, img: './assets/img/realFruits/7_orange.png',       imgSize: 780 },
                    { radius: 96,  scoreValue: 36, img: './assets/img/realFruits/8_grapefruit.png',   imgSize: 780 },
                    { radius: 128, scoreValue: 45, img: './assets/img/realFruits/9_dragonfruit.png',  imgSize: 780 },
                    { radius: 160, scoreValue: 55, img: './assets/img/realFruits/10_rockmelon.png',   imgSize: 780 },
                    { radius: 192, scoreValue: 66, img: './assets/img/realFruits/11_watermelon.png',  imgSize: 780 }
                ]
            },
            cartoonFruits: {
                name: 'Cartoon Fruits',
                items: [
                    { radius: 24,  scoreValue: 1,  img: './assets/img/cartoonFruits/circle0.png',  imgSize: 1024 },
                    { radius: 32,  scoreValue: 3,  img: './assets/img/cartoonFruits/circle1.png',  imgSize: 1024 },
                    { radius: 40,  scoreValue: 6,  img: './assets/img/cartoonFruits/circle2.png',  imgSize: 1024 },
                    { radius: 56,  scoreValue: 10, img: './assets/img/cartoonFruits/circle3.png',  imgSize: 1024 },
                    { radius: 64,  scoreValue: 15, img: './assets/img/cartoonFruits/circle4.png',  imgSize: 1024 },
                    { radius: 72,  scoreValue: 21, img: './assets/img/cartoonFruits/circle5.png',  imgSize: 1024 },
                    { radius: 84,  scoreValue: 28, img: './assets/img/cartoonFruits/circle6.png',  imgSize: 1024 },
                    { radius: 96,  scoreValue: 36, img: './assets/img/cartoonFruits/circle7.png',  imgSize: 1024 },
                    { radius: 128, scoreValue: 45, img: './assets/img/cartoonFruits/circle8.png',  imgSize: 1024 },
                    { radius: 160, scoreValue: 55, img: './assets/img/cartoonFruits/circle9.png',  imgSize: 1024 },
                    { radius: 192, scoreValue: 66, img: './assets/img/cartoonFruits/circle10.png', imgSize: 1024 }
                ]
            },
            planets: {
                name: 'Planets',
                items: [
                    { radius: 24,  scoreValue: 1,  img: './assets/img/planets/1_pluto.png',    imgSize: 512 },
                    { radius: 32,  scoreValue: 3,  img: './assets/img/planets/2_moon.png',     imgSize: 512 },
                    { radius: 40,  scoreValue: 6,  img: './assets/img/planets/3_mercury.png',  imgSize: 512 },
                    { radius: 56,  scoreValue: 10, img: './assets/img/planets/4_mars.png',     imgSize: 512 },
                    { radius: 64,  scoreValue: 15, img: './assets/img/planets/5_venus.png',    imgSize: 512 },
                    { radius: 72,  scoreValue: 21, img: './assets/img/planets/6_earth.png',    imgSize: 512 },
                    { radius: 84,  scoreValue: 28, img: './assets/img/planets/7_neptune.png',  imgSize: 512 },
                    { radius: 96,  scoreValue: 36, img: './assets/img/planets/8_uranus.png',   imgSize: 512 },
                    { radius: 128, scoreValue: 45, img: './assets/img/planets/9_saturn.png',   imgSize: 512 },
                    { radius: 160, scoreValue: 55, img: './assets/img/planets/10_jupiter.png', imgSize: 512 },
                    { radius: 192, scoreValue: 66, img: './assets/img/planets/11_sun.png',     imgSize: 512 }
                ]
            }
        },
        BACKGROUNDS: {
            default: {
                name: 'Default',
                background: './assets/img/backgrounds/background.png',
                menuBackground: './assets/img/bg-menu.png'
            },
            space: {
                name: 'Space',
                background: './assets/img/backgrounds/BG3.png',
                menuBackground: './assets/img/bg-menu.png'
            },
            chalky: {
                name: 'Chalky',
                background: './assets/img/backgrounds/Chalky.jpg',
                menuBackground: './assets/img/bg-menu.png'
            },
            patches: {
                name: 'Patches',
                background: './assets/img/backgrounds/Patches.jpg',
                menuBackground: './assets/img/bg-menu.png'
            },
            paua: {
                name: 'Paua',
                background: './assets/img/backgrounds/Paua.jpg',
                menuBackground: './assets/img/bg-menu.png'
            },
            rainbow: {
                name: 'Rainbow',
                background: './assets/img/backgrounds/Rainbow.jpg',
                menuBackground: './assets/img/bg-menu.png'
            },
            skelly: {
                name: 'Skelly',
                background: './assets/img/backgrounds/Skelly.jpg',
                menuBackground: './assets/img/bg-menu.png'
            },
            stars: {
                name: 'Stars',
                background: './assets/img/backgrounds/Stars.jpg',
                menuBackground: './assets/img/bg-menu.png'
            },
            cottonee: {
                name: 'Cottonee',
                background: './assets/img/backgrounds/cottonee.jpg',
                menuBackground: './assets/img/bg-menu.png'
            },
            fishies: {
                name: 'Fishies',
                background: './assets/img/backgrounds/fishies.jpg',
                menuBackground: './assets/img/bg-menu.png'
            },
            whimsigoth: {
                name: 'Whimsigoth',
                background: './assets/img/backgrounds/whimsigoth.jpg',
                menuBackground: './assets/img/bg-menu.png'
            }
        },
        SOUNDS: {
            default: {
                name: 'Default',
                click: './assets/click.mp3',
                pop: Array.from({length: 11}, (_, i) => `./assets/pop${i}.mp3`)
            }
        }
    },
    
    PHYSICS_PRESETS: {
        BOUNCINESS: [
            { restitution: 0.05, name: 'Low' },     // Very low bounce - fruits settle quickly
            { restitution: 0.2, name: 'Medium' },   // Default/Medium bounce (unchanged)
            { restitution: 0.6, name: 'High' }      // Very bouncy - fruits bounce a lot
        ],
        GRAVITY: [
            { scale: 0.0003, name: 'Low' },    // Light gravity - floaty
            { scale: 0.001, name: 'Medium' },  // Normal gravity (Matter.js default)
            { scale: 0.003, name: 'High' }     // Heavy gravity - noticeably faster
        ],
        FRICTION: [
            { friction: 0.1, frictionStatic: 0.1, name: 'Low' },     // Very slippery - fruits slide a lot
            { friction: 0.8, frictionStatic: 0.8, name: 'Medium' },  // Default/Medium (unchanged)
            { friction: 1.5, frictionStatic: 1.5, name: 'High' }     // Very grippy - fruits stick strongly
        ]
    }
};

export const GAME_STATES = {
    MENU: 0,
    SETTINGS: 1,
    READY: 2,
    DROP: 3,
    LOSE: 4
};