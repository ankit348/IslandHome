// Ankit Kumar
// CSS 451 A
// Final Project

if ( ! Detector.webgl ) {
	
	Detector.addGetWebGLMessage();
	document.getElementById( 'container' ).innerHTML = "";
	
}

//Initialize variables that will be used throughout the program
var container;
var light, lavaLight;
var camera, scene, renderer;
var sphere;
var morph, morphs = [];
var clock = new THREE.Clock();
var parameters = {
	width: 2000,
	height: 2000,
	widthSegments: 250,
	heightSegments: 250,
	depth: 1500,
	param: 4,
	filterparam: 1
}
var textureCounter = 0;
var waterNormals;
var controls, terrain, heightmap;
init();
animate();

// Initialize and implement GUI
var GuiText = function() {
	this.sunLight = 1;
	this.night = false;
	this.lavaLight = 0.5;
};

//Loads the gui fields and adds functionality to each one
window.onload = function() {
	var text = new GuiText();
	var gui = new dat.GUI();
	var intensity = gui.add(text, 'sunLight', 0, 5);
	intensity.onChange(function(value) {
		//Set intensity of HemisphereLight that represents the Sun
		light.intensity = value;
	});
	var night = gui.add(text, 'night');
	night.onChange(function(value) {
		if (value) {
			//If checked, create the night scene. Lower sunlight and introduce
			//new skybox
			light.intensity = 0.3;
			light.groundColor = 0x255255255;
			lavaLight.intensity = 1.5;
			createSky('assets/night-skybox.jpg');
		} else {
			//If not checked, resume the daytime scene by increasing sunlight and 
			//re-introducing day-time skybox
			light.intensity = 1;
			light.groundColor = 0x080820;
			lavaLight.intensity = 0.5;
			createSky('assets/skyboxsun25degtest.png');
		}
		//Create the skybox given an image url
		function createSky(url) {
			var cubeMap = new THREE.CubeTexture( [] );
			cubeMap.format = THREE.RGBFormat;
			cubeMap.flipY = false;
			
			var loader = new THREE.ImageLoader();
			loader.load( url, function ( image ) {
				
				var getSide = function ( x, y ) {
					
					var size = 1024;
					
					var canvas = document.createElement( 'canvas' );
					canvas.width = size;
					canvas.height = size;
					
					var context = canvas.getContext( '2d' );
					context.drawImage( image, - x * size, - y * size );
					
					return canvas;
					
				};
				
				cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
				cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
				cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
				cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
				cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
				cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
				cubeMap.needsUpdate = true;
				
			} );
			
			var cubeShader = THREE.ShaderLib['cube'];
			cubeShader.uniforms['tCube'].value = cubeMap;
			
			var skyBoxMaterial = new THREE.ShaderMaterial( {
				fragmentShader: cubeShader.fragmentShader,
				vertexShader: cubeShader.vertexShader,
				uniforms: cubeShader.uniforms,
				depthWrite: false,
				side: THREE.BackSide
			});
			
			var skyBox = new THREE.Mesh(
			new THREE.BoxGeometry( 1000000, 1000000, 1000000 ),
			skyBoxMaterial
			);
			
			scene.add( skyBox );
		}
	});
	var wave = gui.add(text, 'lavaLight', 0, 10);
	wave.onChange(function(value) {
		//Set intensity of PointLight that belongs to lava shader
		lavaLight.intensity = value;
	});
};

//initializes all on-screen components and objects
function init() {	
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	
	scene = new THREE.Scene();
	
	camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.5, 3000000 );
	camera.position.set( 7000, 5000, 5000 );
	
	controls = new THREE.FirstPersonControls( camera, renderer.domElement );
	controls.movementSpeed = 3000;
	controls.lookSpeed = 0.05;
	
	//Create Sun
	light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
	light.position.set( - 1, 1, - 1 );
	scene.add( light );
	
	//Create lava light
	lavaLight = new THREE.PointLight( 0xFF0000, 0.5, 10000 );
	lavaLight.position.y += 100;
	lavaLight.position.x += 500;
	scene.add( lavaLight );
	
	//Create ocean effects
	waterNormals = new THREE.ImageUtils.loadTexture( 'assets/waternormals.jpg' );
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
	
	water = new THREE.Water( renderer, camera, scene, {
		textureWidth: 512,
		textureHeight: 512,
		waterNormals: waterNormals,
		alpha: 	1.0,
		sunDirection: light.position.clone().normalize(),
		sunColor: 0xffffff,
		waterColor: 0x001e0f,
		distortionScale: 300.0,
	} );
	
	//Add mirror effect to water
	mirrorMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry( parameters.width * 500, parameters.height * 500 ), water.material);
	
	mirrorMesh.add( water );
	mirrorMesh.rotation.x = - Math.PI * 0.5;
	scene.add( mirrorMesh );
	
	
	// Create skybox
	var cubeMap = new THREE.CubeTexture( [] );
	cubeMap.format = THREE.RGBFormat;
	cubeMap.flipY = false;
	//Load skybox image
	var loader = new THREE.ImageLoader();
	loader.load( 'assets/skyboxsun25degtest.png', function ( image ) {
		
		var getSide = function ( x, y ) {
			
			var size = 1024;
			
			var canvas = document.createElement( 'canvas' );
			canvas.width = size;
			canvas.height = size;
			
			var context = canvas.getContext( '2d' );
			context.drawImage( image, - x * size, - y * size );
			return canvas;
		};
		cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
		cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
		cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
		cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
		cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
		cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
		cubeMap.needsUpdate = true;
	} );
	
	var cubeShader = THREE.ShaderLib['cube'];
	cubeShader.uniforms['tCube'].value = cubeMap;
	
	var skyBoxMaterial = new THREE.ShaderMaterial( {
		fragmentShader: cubeShader.fragmentShader,
		vertexShader: cubeShader.vertexShader,
		uniforms: cubeShader.uniforms,
		depthWrite: false,
		side: THREE.BackSide
	});
	var skyBox = new THREE.Mesh(
	new THREE.BoxGeometry( 1000000, 1000000, 1000000 ),
	skyBoxMaterial
	);
	
	scene.add( skyBox );
	
	//Create lava effect for island mountain
	var geometry = new THREE.SphereGeometry( 60, 80, 150 );
	var material = new THREE.MeshBasicMaterial( {map: THREE.ImageUtils.loadTexture('models/lava/lava.jpg')} );
	sphere = new THREE.Mesh( geometry, material );
	sphere.scale.set(35, 35, 35);
	sphere.rotation.y += -Math.PI / 2;
	sphere.position.y += 450;
	scene.add( sphere );
	
	var loader = new THREE.ObjectLoader(); // loader util
	
	//House model
	loader.load('models/house/house.json', function (obj) {
		var material = new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('models/house/brick.jpg')});
		var mesh = new THREE.Mesh(obj.geometry, material);
		mesh.position.y += 350;
		mesh.position.x += 12000;
		mesh.scale.set(4, 4, 4);
		scene.add(mesh);
	});
	
	//Bench model
	loader.load('models/house/bench.json', function (obj) {
		// create a new material
		obj.position.y += 550;
		obj.position.x += 13000;
		obj.position.z += 300;
		obj.rotation.y += Math.PI / 2;
		obj.scale.set(3, 3, 3);
		scene.add(obj);
	});
	
	//Campfire model
	loader.load('models/house/fire.json', function (obj) {
		obj.position.y += 475;
		obj.position.x += 13500;
		scene.add(obj);
		
	});
	
	//Ship model
	loader.load('models/ship/ship.json', function (obj) {
		obj.position.x += 25000;
		obj.position.y += 350;
		obj.rotation.y += -Math.PI / 2;
		obj.scale.set(50, 50, 50);
		scene.add(obj);
	});
	
	//Pier model
	loader.load('models/pier/pier.json', function (obj) {
		obj.position.y += 350;
		obj.position.x += 22000;
		obj.rotation.y += -Math.PI / 2;
		obj.scale.set(4, 4, 4);
		scene.add(obj);
	});
	
	//Soccer field model
	loader.load('models/field/field.json', function (obj) {
		// create a new material
		obj.position.y += 720;
		obj.position.z += 22000;
		obj.rotation.y += -Math.PI / 2;
		scene.add(obj);
		
	});
	
	//Adds bird mesh to scene depending on given cordinates
	function addMorph( geometry, speed, duration, x, y, z ) {
		
		var material = new THREE.MeshLambertMaterial( { color: 0xffaa55, morphTargets: true, vertexColors: THREE.FaceColors } );
		
		var meshAnim = new THREE.MorphAnimMesh( geometry, material );
		
		meshAnim.speed = speed;
		meshAnim.duration = duration;
		meshAnim.time = 600 * Math.random();
		
		meshAnim.position.set( x, y, z );
		meshAnim.rotation.y = Math.PI/2;
		
		meshAnim.castShadow = true;
		meshAnim.receiveShadow = false;
		
		scene.add( meshAnim );
		
		morphs.push( meshAnim );
		
	}
	
	//Maps color to bird geometry
	function morphColorsToFaceColors( geometry ) {
		
		if ( geometry.morphColors && geometry.morphColors.length ) {
			
			var colorMap = geometry.morphColors[ 0 ];
			
			for ( var i = 0; i < colorMap.colors.length; i ++ ) {
				
				geometry.faces[ i ].color = colorMap.colors[ i ];
				
			}
			
		}
		
	}
	
	var loaderJSON = new THREE.JSONLoader();
	var startX = -10000;
	//Create parrot model
	loaderJSON.load( "models/animated/parrot.js", function( geometry ) {
		
		morphColorsToFaceColors( geometry );
		addMorph( geometry, 250, 500, startX - Math.random() * 10000, 500, 7000 );
		addMorph( geometry, 250, 500, startX - Math.random() * 10000, 500, -200 );
		addMorph( geometry, 250, 500, startX - Math.random() * 10000, 500, 200 );
		addMorph( geometry, 250, 500, startX - Math.random() * 10000, 400, 1000 );
		addMorph( geometry, 250, 500, startX - Math.random() * 10000, 500, -1000 );
		addMorph( geometry, 250, 500, startX - Math.random() * 10000, 350, 2000 );
		addMorph( geometry, 250, 500, startX - Math.random() * 10000, 500, -2000 );
		
	} );
	
	//Create flamingo model
	loaderJSON.load( "models/animated/flamingo.js", function( geometry ) {
		
		morphColorsToFaceColors( geometry );
		addMorph( geometry, 500, 1000, startX - Math.random() * 10000, 350, 20000 );
		addMorph( geometry, 500, 1000, startX - Math.random() * 10000, 600, -20000 );
		addMorph( geometry, 500, 1000, startX - Math.random() * 10000, 350, 10000 );
		
	} );
	
	//Create stork model
	loaderJSON.load( "models/animated/stork.js", function( geometry ) {
		
		morphColorsToFaceColors( geometry );
		addMorph( geometry, 350, 1000, startX - Math.random() * 10000, 350, -30000 );
		addMorph( geometry, 350, 1000, startX - Math.random() * 10000, 350, 30000 );
		addMorph( geometry, 350, 1000, startX - Math.random() * 10000, 400, 3000 );
		
	} );
	
	load_terrain('assets/map.jpg', 0, -1300, 0);
	
}

//Using the given texture image, creates a heightmap using ShaderTerrain
function build_terrain(tex) {
	var detailTexture = THREE.ImageUtils.loadTexture("assets/sand.jpg", null, loadTextures);
	//defines how the terrain is rendered
	var terrainShader = THREE.ShaderTerrain[ "terrain" ];
	var uniformsTerrain = THREE.UniformsUtils.clone(terrainShader.uniforms);

	uniformsTerrain[ "tNormal" ].value = tex;
	uniformsTerrain[ "uNormalScale" ].value = 3.5;
	
	uniformsTerrain[ "tDisplacement" ].value = tex;
	uniformsTerrain[ "uDisplacementScale" ].value = 4000;
	
	uniformsTerrain[ "tDiffuse1" ].value = tex;
	uniformsTerrain[ "tDiffuse2" ].value = detailTexture;
	uniformsTerrain[ "tDetail" ].value = detailTexture;
	uniformsTerrain[ "enableDiffuse1" ].value = true;
	uniformsTerrain[ "enableDiffuse2" ].value = true;
	
	uniformsTerrain[ "uRepeatOverlay" ].value.set( 6,6 );
	var material = new THREE.ShaderMaterial({
		uniforms:       uniformsTerrain,
		vertexShader:   terrainShader.vertexShader,
		fragmentShader: terrainShader.fragmentShader,
		lights:         true,
		fog:            false,
	});
	// we use a plane to render terrain
	var geometry = new THREE.PlaneBufferGeometry(tex.image.width + 70000, tex.image.height + 70000, 256, 256);
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	geometry.computeTangents();
	return new THREE.Mesh(geometry, material);
}

//Given an image, creates a terrain and adds it to the scene
function load_terrain(url, xPos, yPos, zPos) {
	heightmap = url;

	var tex = THREE.ImageUtils.loadTexture(
	heightmap, undefined,
	function() {
		terrain = build_terrain( tex );
		terrain.rotation.x = -Math.PI / 2;
		terrain.position.y += yPos;
		scene.add( terrain );
	}
	);
}

//Loads the texture
function loadTextures() {
	textureCounter += 1;
	if ( textureCounter == 3 )	{
		terrain.visible = true;
	}
}

function animate() {
	
	requestAnimationFrame( animate );
	render();
	
}

function render() {
	
	var delta = clock.getDelta();
	water.material.uniforms.time.value += 0.1; //Controls wave speed
	controls.update(delta);
	water.render();
	sphere.rotation.z += 0.005;
	for ( var i = 0; i < morphs.length; i ++ ) {
		morph = morphs[ i ];
		morph.updateAnimation( 1000 * delta );
		morph.position.x += morph.speed * delta;
		morph.position.y = 3000;
		if ( morph.position.x  > 20000 )  {
			morph.position.x = -3500 - Math.random() * 500;
		}
	}
	
	renderer.render( scene, camera );
	
}
