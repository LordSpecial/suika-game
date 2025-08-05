// const Matter = require('matter-js');

function mulberry32(a) {
	return function() {
		let t = a += 0x6D2B79F5;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	}
}

const rand = mulberry32(Date.now());

const {
	Engine, Render, Runner, Composites, Common, MouseConstraint, Mouse,
	Composite, Bodies, Events,
} = Matter;

const wallPad = 64;
const loseHeight = 84;
const statusBarHeight = 48;
const previewBallHeight = 32;
const friction = {
	friction: 0.006,
	frictionStatic: 0.006,
	frictionAir: 0,
	restitution: 0.1
};

const GameStates = {
	MENU: 0,
	READY: 1,
	DROP: 2,
	LOSE: 3,
};

const Game = {
	baseWidth: 640,
	baseHeight: 960,
	width: 640,
	height: 960,
	elements: {
		canvas: document.getElementById('game-canvas'),
		ui: document.getElementById('game-ui'),
		score: document.getElementById('game-score'),
		end: document.getElementById('game-end-container'),
		endTitle: document.getElementById('game-end-title'),
		statusValue: document.getElementById('game-highscore-value'),
		nextFruitImg: document.getElementById('game-next-fruit'),
		previewBall: null,
	},
	cache: { highscore: 0 },
	sounds: {
		click: new Audio('./assets/click.mp3'),
		pop0: new Audio('./assets/pop0.mp3'),
		pop1: new Audio('./assets/pop1.mp3'),
		pop2: new Audio('./assets/pop2.mp3'),
		pop3: new Audio('./assets/pop3.mp3'),
		pop4: new Audio('./assets/pop4.mp3'),
		pop5: new Audio('./assets/pop5.mp3'),
		pop6: new Audio('./assets/pop6.mp3'),
		pop7: new Audio('./assets/pop7.mp3'),
		pop8: new Audio('./assets/pop8.mp3'),
		pop9: new Audio('./assets/pop9.mp3'),
		pop10: new Audio('./assets/pop10.mp3'),
	},

	stateIndex: GameStates.MENU,

	score: 0,
	fruitsMerged: [],
	calculateScore: function () {
		const score = Game.fruitsMerged.reduce((total, count, sizeIndex) => {
			const value = Game.fruitSizes[sizeIndex].scoreValue * count;
			return total + value;
		}, 0);

		Game.score = score;
		Game.elements.score.innerText = Game.score;
	},

	fruitSizes: [
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
		{ radius: 192, scoreValue: 66, img: './assets/img/11_watermelon.png',  imgSize: 780 },
	],
	currentFruitSize: 0,
	nextFruitSize: 0,
	setNextFruitSize: function () {
		Game.nextFruitSize = Math.floor(rand() * 5);
		Game.elements.nextFruitImg.src = Game.fruitSizes[Game.nextFruitSize].img;
	},

	showHighscore: function () {
		Game.elements.statusValue.innerText = Game.cache.highscore;
	},
	loadHighscore: function () {
		const gameCache = localStorage.getItem('suika-game-cache');
		if (gameCache === null) {
			Game.saveHighscore();
			return;
		}

		Game.cache = JSON.parse(gameCache);
		Game.showHighscore();
	},
	saveHighscore: function () {
		Game.calculateScore();
		if (Game.score < Game.cache.highscore) return;

		Game.cache.highscore = Game.score;
		Game.showHighscore();
		Game.elements.endTitle.innerText = 'New Highscore!';

		localStorage.setItem('suika-game-cache', JSON.stringify(Game.cache));
	},

	initGame: function () {
		// Calculate sprite scales based on radius and image dimensions
		Game.fruitSizes.forEach(fruit => {
			fruit.scale = (fruit.radius * 2) / fruit.imgSize;
		});

		Render.run(render);
		Runner.run(runner, engine);

		Composite.add(engine.world, menuStatics);

		Game.loadHighscore();
		Game.elements.ui.style.display = 'none';
		Game.fruitsMerged = Array.apply(null, Array(Game.fruitSizes.length)).map(() => 0);

		const menuMouseDown = function () {
			if (mouseConstraint.body === null || mouseConstraint.body?.label !== 'btn-start') {
				return;
			}

			Events.off(mouseConstraint, 'mousedown', menuMouseDown);
			Game.startGame();
		}

		Events.on(mouseConstraint, 'mousedown', menuMouseDown);
	},

	startGame: function () {
		Game.sounds.click.play();

		Composite.remove(engine.world, menuStatics);
		Composite.add(engine.world, gameStatics);

		Game.calculateScore();
		Game.elements.endTitle.innerText = 'Game Over!';
		Game.elements.ui.style.display = 'block';
		Game.elements.end.style.display = 'none';
		Game.elements.previewBall = Game.generateFruitBody(Game.width / 2, previewBallHeight, 0, { isStatic: true });
		Composite.add(engine.world, Game.elements.previewBall);

		setTimeout(() => {
			Game.stateIndex = GameStates.READY;
		}, 250);

		Events.on(mouseConstraint, 'mouseup', function (e) {
			Game.addFruit(e.mouse.position.x);
		});

		Events.on(mouseConstraint, 'mousemove', function (e) {
			if (Game.stateIndex !== GameStates.READY) return;
			if (Game.elements.previewBall === null) return;

			Game.elements.previewBall.position.x = e.mouse.position.x;
		});

		Events.on(engine, 'collisionStart', function (e) {
			for (let i = 0; i < e.pairs.length; i++) {
				const { bodyA, bodyB } = e.pairs[i];

				// Skip if collision is wall
				if (bodyA.isStatic || bodyB.isStatic) continue;

				const aY = bodyA.position.y + bodyA.circleRadius;
				const bY = bodyB.position.y + bodyB.circleRadius;

				// Uh oh, too high!
				if (aY < loseHeight || bY < loseHeight) {
					Game.loseGame();
					return;
				}

				// Skip different sizes
				if (bodyA.sizeIndex !== bodyB.sizeIndex) continue;

				// Skip if already popped
				if (bodyA.popped || bodyB.popped) continue;

				let newSize = bodyA.sizeIndex + 1;

				// Go back to smallest size
				if (bodyA.circleRadius >= Game.fruitSizes[Game.fruitSizes.length - 1].radius) {
					newSize = 0;
				}

				Game.fruitsMerged[bodyA.sizeIndex] += 1;

				// Therefore, circles are same size, so merge them.
				const midPosX = (bodyA.position.x + bodyB.position.x) / 2;
				const midPosY = (bodyA.position.y + bodyB.position.y) / 2;

				bodyA.popped = true;
				bodyB.popped = true;

				Game.sounds[`pop${bodyA.sizeIndex}`].play();
				Composite.remove(engine.world, [bodyA, bodyB]);
				Composite.add(engine.world, Game.generateFruitBody(midPosX, midPosY, newSize));
				Game.addPop(midPosX, midPosY, bodyA.circleRadius);
				Game.calculateScore();
			}
		});
	},

	addPop: function (x, y, r) {
		const circle = Bodies.circle(x, y, r, {
			isStatic: true,
			collisionFilter: { mask: 0x0040 },
			angle: rand() * (Math.PI * 2),
			render: {
				sprite: {
					texture: './assets/img/pop.png',
					xScale: r / 384,
					yScale: r / 384,
				}
			},
		});

		Composite.add(engine.world, circle);
		setTimeout(() => {
			Composite.remove(engine.world, circle);
		}, 100);
	},

	loseGame: function () {
		Game.stateIndex = GameStates.LOSE;
		Game.elements.end.style.display = 'flex';
		runner.enabled = false;
		Game.saveHighscore();
	},

	// Returns an index, or null
	lookupFruitIndex: function (radius) {
		const sizeIndex = Game.fruitSizes.findIndex(size => size.radius == radius);
		if (sizeIndex === undefined) return null;
		if (sizeIndex === Game.fruitSizes.length - 1) return null;

		return sizeIndex;
	},

	generateFruitBody: function (x, y, sizeIndex, extraConfig = {}) {
		const size = Game.fruitSizes[sizeIndex];
		const circle = Bodies.circle(x, y, size.radius, {
			...friction,
			...extraConfig,
			render: { sprite: { texture: size.img, xScale: size.scale, yScale: size.scale } },
		});
		circle.sizeIndex = sizeIndex;
		circle.popped = false;

		return circle;
	},

	addFruit: function (x) {
		if (Game.stateIndex !== GameStates.READY) return;

		Game.sounds.click.play();

		Game.stateIndex = GameStates.DROP;
		const latestFruit = Game.generateFruitBody(x, previewBallHeight, Game.currentFruitSize);
		Composite.add(engine.world, latestFruit);

		Game.currentFruitSize = Game.nextFruitSize;
		Game.setNextFruitSize();
		Game.calculateScore();

		Composite.remove(engine.world, Game.elements.previewBall);
		Game.elements.previewBall = Game.generateFruitBody(render.mouse.position.x, previewBallHeight, Game.currentFruitSize, {
			isStatic: true,
			collisionFilter: { mask: 0x0040 }
		});

		setTimeout(() => {
			if (Game.stateIndex === GameStates.DROP) {
				Composite.add(engine.world, Game.elements.previewBall);
				Game.stateIndex = GameStates.READY;
			}
		}, 500);
	}
}

const engine = Engine.create();
const runner = Runner.create();
const render = Render.create({
	element: Game.elements.canvas,
	engine,
	options: {
		width: Game.width,
		height: Game.height,
		wireframes: false,
		background: './assets/img/background.png'
	}
});

let menuStatics = [
	Bodies.rectangle(Game.width / 2, Game.height * 0.4, 512, 512, {
		isStatic: true,
		render: { sprite: { texture: './assets/img/bg-menu.png' } },
	}),

	// Add each fruit in a circle
	...Array.apply(null, Array(Game.fruitSizes.length)).map((_, index) => {
		const x = (Game.width / 2) + 192 * Math.cos((Math.PI * 2 * index)/12);
		const y = (Game.height * 0.4) + 192 * Math.sin((Math.PI * 2 * index)/12);
		const r = 64;

		return Bodies.circle(x, y, r, {
			isStatic: true,
			render: {
				sprite: {
					texture: Game.fruitSizes[index].img,
					xScale: (r ) / Game.fruitSizes[index].imgSize,
					yScale: (r ) / Game.fruitSizes[index].imgSize,
				},
			},
		});
	}),

	Bodies.rectangle(Game.width / 2, Game.height * 0.75, 512, 96, {
		isStatic: true,
		label: 'btn-start',
		render: { sprite: { texture: './assets/img/btn-start.png' } },
	}),
];

const wallProps = {
	isStatic: true,
	render: { fillStyle: '#FFEEDB' },
	...friction,
};

let gameStatics = [
	// Left
	Bodies.rectangle(-(wallPad / 2), Game.height / 2, wallPad, Game.height, wallProps),

	// Right
	Bodies.rectangle(Game.width + (wallPad / 2), Game.height / 2, wallPad, Game.height, wallProps),

	// Bottom
	Bodies.rectangle(Game.width / 2, Game.height + (wallPad / 2) - statusBarHeight, Game.width, wallPad, wallProps),
];

// add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
	mouse: mouse,
	constraint: {
		stiffness: 0.2,
		render: {
			visible: false,
		},
	},
});
render.mouse = mouse;

Game.initGame();

const resizeCanvas = () => {
	const screenWidth = document.body.clientWidth;
	const screenHeight = document.body.clientHeight;

	// Calculate optimal game dimensions maintaining min 1.5:1 aspect ratio
	let gameWidth, gameHeight;
	
	if (screenWidth / screenHeight < 1.5) {
		// Screen is taller than 1.5:1, use screen width as base
		gameWidth = screenWidth;
		gameHeight = Math.max(screenWidth * 1.5, screenHeight);
	} else {
		// Screen is wider than 1.5:1, use 1.5:1 ratio
		gameHeight = screenHeight;
		gameWidth = gameHeight / 1.5;
	}

	// Update game dimensions
	Game.width = gameWidth;
	Game.height = gameHeight;

	// Update render dimensions
	render.options.width = gameWidth;
	render.options.height = gameHeight;
	render.canvas.width = gameWidth;
	render.canvas.height = gameHeight;

	render.canvas.style.width = `${gameWidth}px`;
	render.canvas.style.height = `${gameHeight}px`;

	// Update UI overlay to match canvas exactly
	Game.elements.ui.style.width = `${gameWidth}px`;
	Game.elements.ui.style.height = `${gameHeight}px`;
	Game.elements.ui.style.transform = 'none';

	// Recreate physics world with new dimensions
	recreatePhysicsWorld();
};

const recreatePhysicsWorld = () => {
	// Clear existing static bodies
	Composite.clear(engine.world, false);
	
	// Recreate walls with new dimensions
	const wallProps = {
		isStatic: true,
		render: { fillStyle: '#FFEEDB' },
		...friction,
	};

	const newGameStatics = [
		// Left wall
		Bodies.rectangle(-(wallPad / 2), Game.height / 2, wallPad, Game.height, wallProps),
		// Right wall  
		Bodies.rectangle(Game.width + (wallPad / 2), Game.height / 2, wallPad, Game.height, wallProps),
		// Bottom wall
		Bodies.rectangle(Game.width / 2, Game.height + (wallPad / 2) - statusBarHeight, Game.width, wallPad, wallProps),
	];

	// Recreate menu statics with new dimensions  
	const newMenuStatics = [
		Bodies.rectangle(Game.width / 2, Game.height * 0.4, 512, 512, {
			isStatic: true,
			render: { sprite: { texture: './assets/img/bg-menu.png' } },
		}),

		// Add each fruit in a circle
		...Array.apply(null, Array(Game.fruitSizes.length)).map((_, index) => {
			const x = (Game.width / 2) + 192 * Math.cos((Math.PI * 2 * index)/12);
			const y = (Game.height * 0.4) + 192 * Math.sin((Math.PI * 2 * index)/12);
			const r = 64;

			return Bodies.circle(x, y, r, {
				isStatic: true,
				render: {
					sprite: {
						texture: Game.fruitSizes[index].img,
						xScale: (r ) / Game.fruitSizes[index].imgSize,
						yScale: (r ) / Game.fruitSizes[index].imgSize,
					},
				},
			});
		}),

		Bodies.rectangle(Game.width / 2, Game.height * 0.75, 512, 96, {
			isStatic: true,
			label: 'btn-start',
			render: { sprite: { texture: './assets/img/btn-start.png' } },
		}),
	];

	// Store references to the new statics
	gameStatics.length = 0;
	gameStatics.push(...newGameStatics);
	
	menuStatics.length = 0;
	menuStatics.push(...newMenuStatics);

	// Add appropriate statics based on current game state
	if (Game.stateIndex === GameStates.MENU) {
		Composite.add(engine.world, menuStatics);
	} else {
		Composite.add(engine.world, gameStatics);
	}
};

document.body.onload = resizeCanvas;
document.body.onresize = resizeCanvas;
