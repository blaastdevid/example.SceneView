//
// example.SceneView - controller for main view
//

var TextView = require('ui').TextView;

// PEngine is a simple engine for creating falling particles.
var PEngine  = require('../lib/p-engine').PEngine;

var app = this;

// Return a random number without the decimal part
function rand(n) {
	return Math.floor(Math.random() * n);
}

// Define names for the four layers used in this example
var sceneLayers = {
	gems: 0,
	particles: 1,
	dropping: 2,
	label: 3,
	count: 4
};

// Load event handler
exports[':load'] = function() {
	var i;

	// Main view has one SceneView control, in full screen. Get the handle.
	var scene = this.get('scene');

	// Set number of layers
	scene.setLayers(sceneLayers.count);

	// Load spritesheets using image files from res/
	// gems.png has a tile size of 30x30 pixels, particles are 8x8 pixels.
	scene.defineSpritesheet('gems', app.imageURL('gems.png'), 30, 30);
	scene.defineSpritesheet('particles', app.imageURL('particles.png'), 8, 8);		

	// Create a spritesheet procedurally. The function must return an Uint8Array data reference,
	// and contain enough data for the requested tile size, 8x8 pixels here.
	scene.defineSpritesheet('generated', function() {
		var data = new Uint8Array(8 * 8 * 4);

		for (var y = 0; y < 8; y++) {
			var checkboard = (y % 2) ? 255 : 0;
			var k          = (y * 8 * 4);

			for (var x = 0; x < (8 * 4); x += 4) {
				var f = ((x % 8) === 0) ? checkboard : 255-checkboard;
				data[k + x] = f;
				data[k + x + 1] = f;
				data[k + x + 2] = f;
				data[k + x + 3] = f;
			}
		}
		
		return data;
	}, 8, 8);

	// An example of using a TextView layer:
	// 1. Create a TextView
	var label = new TextView({
		label: 'Gems...',
		style: {
			border: '5 5 5 5',
			'background-color': 'white',
			color: 'black'
		}
	});

	// 2. Use setLayerControl to assign control to the layer
	scene.setLayerControl(sceneLayers.label, label);

	// 3. Position the layer using translate()
	scene.translate(3, 250, 10);

	// map holds 64 gems, and one gem is randomly picked out of seven colors
	var map = new Int32Array(64);

	for (i = 0; i < 64; i++) {
		map[i] = rand(7);
	}

	this.map = map;

	// objs holds sprite object references for the 64 gems
	this.objs = [];

	// add 64 gems to an 8 by 8 grid. Each grid cell is 30 by 30 pixels.
	for (i = 0; i < 64; i++) {
		var x = (i % 8) * 30;
		var y = Math.floor(i / 8) * 30;

		this.objs.push(scene.add({
			sprite: 'gems',
			x: x,
			y: y,
			layer: sceneLayers.gems,
			frame: map[i]
		}));
	}

	// Add the generated sprite as a background
	scene.add({
		sprite: 'generated',
		x: 4,
		y: 4,
		layer: sceneLayers.gems,
		frame: 0
	});

	// Instance of the particle engine
	this.p = new PEngine(scene);

	// Use dropOne() as the animation loop. It only needs to be called infrequently, twice a second.
	this.setAnimationLoop(this.dropOne, 500);
};

// Drop one random gem
exports.dropOne = function() {
	// Pick which gem to drop, out of the 64 gems
	var which = Math.floor(Math.random() * 64);
	var self  = this;

	if (this.map[which] >= 0) {
		this.map[which] = -1;

		var scene = this.get('scene');
		var obj   = this.objs[which];

		// Change the gem sprite to layer 2, to make it fall in front of other gems
		scene.change(obj, {
			layer: sceneLayers.dropping
		});

		var x = (which % 8) * 30;
		var y = Math.floor(which / 8) * 30;

		setTimeout(function() {
			// Add the chosen gem to the particle engine with a vertical velocity and acceleration.
			// This will make it fall down.
			self.p.add(obj, x, y, {
				y: { u: -100, a: 1000 }
			});
		}, 250);

		// Add 20 smaller sprites for some explosive particle graphics.
		var px = x + 14;
		var py = y + 20;

		for (var i = 0; i < 20; i++) {
			// Definition of the new particle. Start from px, py and layer 1.
			var pobj = {
				layer: sceneLayers.particles,
				x: px,
				y: py
			};

			// Use a sprite for the first ten particles only, other particles
			// will be just red colored rectangles of 2x2 pixels.
			if (i < 10) {
				pobj.sprite = 'particles';
				pobj.frame  = rand(7);
			} else {
				pobj.width  = 2;
				pobj.height = 2;
				pobj.color  = 'red';
			}

			// Add the sprite
			var p = scene.add(pobj);

			// Randomize horizontal direction
			var dir = !rand(2) ? -1 : 1;

			// Add the new sprite to the particle engine with some initial velocity and acceleration.
			this.p.add(p, px, py, {
				x: { u: (dir * rand(20)), a: (dir * 50) },
				y: { u: -(100 + rand(100)), a: 500 }
			});
		}
	}
};
