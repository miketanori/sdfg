// Detect if WebGL is supported
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

// Vector for motion
const ARMS_SPEED = 0.45;
var armsMovement = [ -ARMS_SPEED, -ARMS_SPEED ]

var statsEnabled = true, container, stats;
var camera, controls, renderer, scene;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

const GLOBAL_UPSCALE = 5;
const CAT_COLOR = 0xFFFFFF;
const PAWS_COLOR = 0xFE9BA1

// AUDIO
// Create an AudioListener to use sounds.
const listener = new THREE.AudioListener();
// Create a global audio source.
const sound = new THREE.Audio( listener );
// Create a second global audio source.
const sound1 = new THREE.Audio( listener );
// Load a sound and set it as the Audio object's buffer.
const audioLoader = new THREE.AudioLoader();

// TEXTURES
// create an TextureLoader to use textures.
const loader = new THREE.TextureLoader();
loader.setCrossOrigin('');
var cat, body, ears, arms, eyes, smile, bongos, legs, table, house, lamppost;

init();
animate();

function init() {
  // CONTAINER
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  // SCENE
  // Create a new Three.js scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xd8b365 );
  scene.fog = new THREE.Fog( 0xd8b365, 300, 1800 );

  // CAMERA
  // Create a camera so we can view the scene
  camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 80, -100, 150 );

  // LIGHTS
  // Add initial ambient light to set the tone for the scene.
  const ambientLight = new THREE.AmbientLight( 0xEAEAEA );
  // A bit less intese to make it appear a bit dark (starting sunset).
  ambientLight.intensity = 0.75;
  scene.add( ambientLight );

  const sunlight = new THREE.DirectionalLight( 0xff0000, 1 );
  sunlight.position.set( 220, 250, -300 );
  sunlight.intensity = 2.5;
  sunlight.castShadow = true;
  // Quick way to put light further apart.
  sunlight.position.multiplyScalar( 2.3 );
  // Measurements used to define a (invisible) box which
  // is where light will be able to hit.
  sunlight.shadow.camera.left = -1200;
  sunlight.shadow.camera.right = 1200;
  sunlight.shadow.camera.top = 800;
  sunlight.shadow.camera.bottom = - 500;
  sunlight.shadow.camera.far = 2800;
  scene.add( sunlight );

  buildObjects();
  // RENDERER
  // Create the Three.js renderer and attach it to our canvas
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  // Set the viewport size
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio( window.devicePixelRatio );
  // renderer.outputEncoding = THREE.sRGBEncoding;
  // Turn on shadows
  renderer.shadowMap.enabled = true;
  // Attach the Three.js renderer
  container.appendChild( renderer.domElement );

  // MONITOR
  if ( statsEnabled ) {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    stats.domElement.style.right = 'calc(50% - 35px)';
    container.appendChild( stats.domElement );
  }

  // CONTROLS
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  // Set the target Y component a bit high, so it looks more directly into the cat's body.
  controls.target.set( 0, 0.5, 0 );
  // Leave the camera as smooth as possible without adding anything else.
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minDistance = 300;
  controls.maxDistance = 1050;
  controls.update();
}

/*
 * ANIMATION AND RENDER
 * Functions used animate and render the scene.
 */

// Function to let the animations work correctly.
function animate() {
  // Do the animation each frame.
  requestAnimationFrame( animate );
  // Render the scene.
  render();
  // Show stats if they are enabled (Debugging purpouses).
  if ( statsEnabled ) stats.update();
}

// Function to render the scene
function render() {
  camera.lookAt( scene.position );
  // Handle arm0 movement.
  movement(0);
  // // Handle arm1 movement.
  movement(1);
  // Render the scene.
  renderer.render( scene, camera );
}

// Helper function to do the movement of an arm;
function movement(index) {
  const lowerPosition = Math.PI * 0.5;
  const upperPosition = 0.4;

  // Just to check if it exists.
  if(arms) {
    // Move the arm by incrementing (positively or negatively) the rotation in the X axis,
    // until it reaches the limit established.
    if(arms[index].rotation.x <= lowerPosition && arms[index].rotation.x >= upperPosition) {
      arms[index].rotation.x += armsMovement[index];
    }

    // Once it reaches below the limit established keep it there no matter what.
    if(arms[index].rotation.x < upperPosition) {
      arms[index].rotation.x = upperPosition;
    } else if(arms[index].rotation.x > lowerPosition) {
      arms[index].rotation.x = lowerPosition;
    }
  }
}

/*
 * BUILD
 * Functions used to build the objects and do any transformations required
 * to fit the entire scene.
 */

// Function to create each object to be used in the scene.
function buildObjects() {
  buildGround();
  buildTrees();
  buildLamppost();
  buildCat();
  buildTable();
  buildBongos();
  transformObjects();
}

// Function to transform each object to be used in the scene,
// accordingly to its special needs.
// Translates all the objects in the right position.
// Scales all the objects to look in a good size due the camera distance.
function transformObjects() {
  scaleObject(table, GLOBAL_UPSCALE);
  scaleObject(cat, GLOBAL_UPSCALE);
  scaleObject(bongos, GLOBAL_UPSCALE);
  scaleObject(lamppost, GLOBAL_UPSCALE);
  lamppost.position.x = 130;
}

// Helper function to scale an object by an amount;
function scaleObject(object, amount) {
  if(object) {
    object.scale.multiplyScalar(amount);
  }
}


/*
 * CAT
 * Functions used to create the cat. These are used only with primitive figures and pure color.
 */
      
function buildCat() { 
  cat = new THREE.Object3D();
  buildBody();
  buildArms();
  buildLegs();
  buildEars();
  buildEyes();
  buildSmile();
  scene.add(cat);
}

function buildBody() {
  let points = [];
  // The Egg Ecuation
  // x coordinate should be greater than zero to avoid degenerate triangles; it is not in this formula.
  // References: 
  // - http://nyjp07.com/index_egg_E.html
  // - https://stackoverflow.com/a/37107107/9483156
  for ( let deg = 0; deg <= 180; deg += 4 ) {
    let rad = Math.PI * deg / 180;
    let x = (( 0.94 + .02 * Math.cos( rad ) ) * Math.sin( rad ));
    let y = - Math.cos( rad ) * 1.1;
    let point = new THREE.Vector2( x * 6, y * 6 );
    points.push( point );
  }
  const geometry = new THREE.LatheBufferGeometry( points, 32 );
  const material = new THREE.MeshLambertMaterial( { color: CAT_COLOR } );
  body = new THREE.Mesh( geometry, material );
  body.position.set(0, 0, 0);
  // body.receiveShadow = true;
  body.castShadow = true;
  cat.add(body);
}

function buildEars() {
  ears = [];
  // Using cones for the ears.
  const geometry = new THREE.ConeGeometry( 1.2, 1.3, 32, true );
  const material = new THREE.MeshLambertMaterial( { color: CAT_COLOR } );
  ears.push( new THREE.Mesh( geometry, material ) );
  // Set the ear at the perfect spot.
  ears[0].position.set(-2.7, 6.1, 0);
  ears[0].rotation.z = 0.4;
  // ears[0].receiveShadow = true;
  ears[0].castShadow = true;
  // After cloning the ear set it to the other side.
  ears.push( ears[0].clone() )
  ears[1].position.set(2.7, 6.1, 0);
  ears[1].rotation.z = -0.42;
  cat.add(ears[0]);
  cat.add(ears[1]);
}

function buildLimb() {
  // Using cylinders for arms and legs.
  const geometry = new THREE.CylinderGeometry( 1.2, 1.6, 4, 32 );
  const material = new THREE.MeshLambertMaterial( { color: CAT_COLOR } );
  const sleeve = new THREE.Mesh( geometry, material );
  // sleeve.receiveShadow = true;
  sleeve.castShadow = true;
  return sleeve;
}

function buildLimbSmallEnd() {
  // A half sphere to be used to close the limb.
  const geometry = new THREE.SphereGeometry( 1.2, 32, 32, 0, Math.PI );
  const material = new THREE.MeshLambertMaterial( { color: CAT_COLOR } );
  const hand = new THREE.Mesh( geometry, material );
  hand.rotation.x = Math.PI * 1.5  ;
  hand.position.y = 2;
  // hand.receiveShadow = true;
  hand.castShadow = true;
  return hand;
}

function buildLimbBigEnd() {
   // A half sphere to be used to close the limb.
  const geometry = new THREE.SphereGeometry( 1.6, 32, 32, 0, Math.PI );
  const material = new THREE.MeshLambertMaterial( { color: CAT_COLOR } );
  const elbow = new THREE.Mesh( geometry, material );
  elbow.rotation.x = Math.PI * 0.5  ;
  elbow.position.y = -2;
  // elbow.receiveShadow = true;
  elbow.castShadow = true;
  return elbow;
}

function buildPaws() {
  // Encapsulte all the geometry for a paw inside a 3D object.
  const paws = [ new THREE.Object3D(), new THREE.Object3D() ];
  let geometry = new THREE.SphereGeometry( 0.55, 32, 32, 0, Math.PI );
  const material = new THREE.MeshLambertMaterial( { color: PAWS_COLOR, side: THREE.DoubleSide } );
  let sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(0, 2, 0.8);
  sphere.scale.x = 0.9;
  paws[0].add( sphere );
  // paws[0].receiveShadow = true;
  paws[0].castShadow = true;
  // Make each part with different dimensions to make it look less symetrical.
  geometry = new THREE.SphereGeometry( 0.35, 32, 32, 0, Math.PI );
  sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(0, 2.7, 0.7);
  sphere.rotation.x = -Math.PI*0.25;
  sphere.scale.x = 0.9;
  paws[0].add( sphere );
  geometry = new THREE.SphereGeometry( 0.28, 32, 32, 0, Math.PI );
  sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(-0.5, 2.4, 0.8);
  sphere.rotation.x = -Math.PI*0.25;
  sphere.scale.x = 0.9;
  paws[0].add( sphere );
  geometry = new THREE.SphereGeometry( 0.28, 32, 32, 0, Math.PI );
  sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(0.5, 2.4, 0.8);
  sphere.rotation.x = -Math.PI*0.25;
  sphere.scale.x = 0.9;
  paws[0].add( sphere );
  return paws;
}

function buildPawsBottom() {
  // Encapsulte all the geometry for a paw inside a 3D object.
  const paws = [ new THREE.Object3D(), new THREE.Object3D() ];
  let geometry = new THREE.SphereGeometry( 1, 32, 32, 0, Math.PI );
  const material = new THREE.MeshLambertMaterial( { color: PAWS_COLOR, side: THREE.DoubleSide } );
  let sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(0, -2.7, -0.2);
  sphere.scale.x = 1.1;
  sphere.rotation.x = Math.PI*0.5;
  paws[0].add( sphere );
  // paws[0].receiveShadow = true;
  paws[0].castShadow = true;
  // Make each part with different dimensions to make it look less symetrical.
  geometry = new THREE.SphereGeometry( 0.65, 32, 32, 0, Math.PI );
  sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(0, -2.90, 0.42);
  sphere.rotation.x = -Math.PI*0.25;
  sphere.rotation.x = Math.PI*0.5;
  sphere.scale.x = 1.1;
  paws[0].add( sphere );
  geometry = new THREE.SphereGeometry( 0.55, 32, 32, 0, Math.PI );
  sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(-0.5, -2.95, 0.3);
  sphere.rotation.x = -Math.PI*0.25;
  sphere.rotation.x = Math.PI*0.5;
  sphere.scale.x = 0.9;
  paws[0].add( sphere );
  geometry = new THREE.SphereGeometry( 0.55, 32, 32, 0, Math.PI );
  sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(0.5, -2.95, 0.3);
  sphere.rotation.x = -Math.PI*0.25;
  sphere.rotation.x = Math.PI*0.5;
  sphere.scale.x = 0.9;
  paws[0].add( sphere );
  return paws;
}

function buildArms() {
  // Wrap all the parts for an arm in a 3D object, 
  // so it can be manipulated togheter later.
  const x = 4;
  const y = 1;
  const z = 2.5;
  const xRotation = 0.4;
  const zRotation = -0.08;
  arms = []
  arms.push( new THREE.Object3D() );
  arms[0].position.set(x, y, z);
  arms[0].rotation.x = xRotation;
  arms[0].rotation.z = -zRotation;
  arms[0].add(buildLimb());
  arms[0].add(buildLimbSmallEnd());
  arms[0].add(buildLimbBigEnd());
  const paws = buildPaws();
  arms[0].add( paws[0] );
  arms[0].scale.z = 0.8;
  arms[0].scale.y = 1;
  // Given that to move an arm the pivot to rotate it should be at the top of it,
  // instead of doing a composed transformation at once, first we move the parts from
  // the center, so when it rotates it's from the top.
  arms[0].children.map((x) => {
    x.position.y += 2;
  });
  arms.push( arms[0].clone() );
  arms[1].position.x = -x;
  arms[1].rotation.z = zRotation;
  cat.add(arms[0]);
  cat.add(arms[1]);
}

function buildLegs() {
  // Wrap all the parts for a leg in a 3D object, 
  // so it can be manipulated togheter later.
  const x = 3.5;
  const y = -5.5;
  const z = 4.5;
  const xRotation = Math.PI * 1.50;
  const zRotation = -0.5;
  legs = []
  legs.push( new THREE.Object3D() );
  legs[0].position.set(x, y, z);
  legs[0].rotation.x = xRotation;
  legs[0].rotation.z = -zRotation;
  legs[0].add(buildLimb());
  legs[0].add(buildLimbSmallEnd());
  legs[0].add(buildLimbBigEnd());
  const paws = buildPawsBottom();
  legs[0].add( paws[0] );
  legs[0].scale.z = 1;
  legs[0].scale.y = 1;
  // Given that to move a leg the pivot to rotate it should be at the top of it,
  // instead of doing a composed transformation at once, first we move the parts from
  // the center, so when it rotates it's from the bottom.
  legs[0].children.map((x) => {
    x.position.y += 2;
  });
  legs.push( legs[0].clone() );
  legs[1].position.x = -x;
  legs[1].rotation.z = zRotation;
  cat.add( legs[0] );
  cat.add( legs[1] ); 
}

function buildEyes() {
  // Use half spheres for the eyes.
  const x = -1.5;
  const y = 3.5;
  const z = 4.2;
  eyes = new THREE.Object3D();
  const geometry = new THREE.SphereGeometry( 0.36, 32, 32 );
  const material = new THREE.MeshBasicMaterial( { color: 0x00000 } );
  const eye1 = new THREE.Mesh( geometry, material );
  eye1.position.set(x, y, z);
  const eye2 = eye1.clone();
  eye2.position.x = -x;
  eyes.add( eye1 );
  eyes.add( eye2 );
  cat.add(eyes);
}

function buildSmile() {
  // Add a new object to hold every part of the smile.
  smile = new THREE.Object3D();
  // Define the number of segments for our tube.
  const numPoints = 100;
  // Set the initial vector from where the tube is going to be created.
  const start = new THREE.Vector3(0.48, 0, 0);
  // Set the vector from where the curve reaches an inflection point.
  // This is where it starts to 'bend'.
  const middle = new THREE.Vector3(0, 0.7, 0);
 // Set the final vector from where the tube is going to end. 
  const end = new THREE.Vector3(-0.48, 0, 0);
  const path = new THREE.QuadraticBezierCurve3(start, middle, end);
  const tube = new THREE.TubeGeometry(path, numPoints, 0.1, 10, false);
  const material = new THREE.MeshLambertMaterial( { color: 0x00000 } );
  const side1 = new THREE.Mesh(tube, material);
  // Transform it so it sits correctly in the cat.
  side1.position.set( -0.45, 3.5, 4.7);
  side1.rotation.x = -0.6;
  side1.rotation.z = Math.PI;
  // Create a clone so the smile can be completed.
  const side2 = side1.clone();
  side2.position.x = 0.45;
  smile.add(side1);
  smile.add(side2);
  cat.add(smile);
}

/*
 * TABLE
 * Functions used to create a table. These use texture to make it more realistic.
 */

// Function to build the table.
// Using a box geometries as its base.
function buildTable() {
  const geometry = new THREE.BoxGeometry(20, 0.8, 10);
  // Add a wood texture.
  const texture = loader.load('img/wood-texture.jpg');
  // Add a bump map to be a little more realistic, not required.
  const material = new THREE.MeshPhongMaterial( { map: texture, bumpMap: texture, bumpScale: 1 } );
  table = new THREE.Mesh(geometry, material);
  // Set it in the right position to be in front of the cat.
  table.position.set( 0, -17, 55);
  table.castShadow = true;
  table.receiveShadow = true;
  buildTableLegs();
  scene.add(table);
}

// Function to build the table legs.
// Using a box geometries as its base.
function buildTableLegs() {
  const geometry = new THREE.BoxGeometry(1, 3.2, 10);
  // Add a wood texture.
  const texture = loader.load('img/wood-texture.jpg');
  // Add a bump map to be a little more realistic, not required.
  const material = new THREE.MeshPhongMaterial( { map: texture, bumpMap: texture, bumpScale: 1 } );
  const leg = new THREE.Mesh(geometry, material);
  // Set it in the one side of the table.
  leg.position.set( 9, -2, 0);
  leg.castShadow = true;
  leg.receiveShadow = true;
  // Clone the object and reposition it in it's X component.
  const leg1 = leg.clone();
  leg1.position.x = -9;
  table.add(leg);
  table.add(leg1);
}

/*
 * BONGOS
 * Functions used to create bongos. These use texture to make it more realistic.
 */

// Function to build the bongos.
// Using a cylinder geometry as its base.
function buildBongos() {
  // Create an object that's going to hold all the geometries required to build the bongo.
  bongos = new THREE.Object3D();
  const x = -3;
  const y = -1.45;
  const z = 8;
  const geometry = new THREE.CylinderGeometry( 2, 1.6, 3, 32 );
  // Use a texture for the top and reposition the center for easier manipulation.
  const topTexture = loader.load('img/bongo-texture-top.png');
  topTexture.center = new THREE.Vector2(0.5, 0.5);
  // Rotate this texture to fit its purpouse and point to the correct angle.
  topTexture.rotation = -Math.PI * 0.5;
  // Load textures for the side of the cylinder and wrap it.
  // The bottom is not shown so it has a random wood texture.
  const sidesTexture = loader.load('img/bongo-texture-sides.jpg');
  const materials = [
    new THREE.MeshPhongMaterial( { map: sidesTexture, bumpMap: sidesTexture, bumpScale: 1 } ),
    new THREE.MeshPhongMaterial( { map: topTexture, bumpMap: topTexture, bumpScale: 1  } ),
    new THREE.MeshPhongMaterial({map: loader.load('img/wood-texture.jpg')})
  ]
  // Create a bongo and set it's position and other values.
  const bongo1 = new THREE.Mesh( geometry, materials );
  bongo1.position.set( x, y, z);
  bongo1.receiveShadow = true;
  bongo1.castShadow = true;
  // Clone the object and reposition it in it's X component.
  const bongo2 = bongo1.clone();
  bongo2.position.x = -x;
  bongos.add( bongo1 );
  bongos.add( bongo2 );
  buildBongosBridge();
  scene.add(bongos);
}

// Function to build the thingy that connects the bongos.
// Using a box geometry as its base.
function buildBongosBridge() {
  const geometry = new THREE.BoxGeometry(4, 1, 1);
  // Add the texture
  const texture = loader.load('img/bongo-texture-connection.png');
  // Add a bump map to be a little more realistic, not required.
  const material = new THREE.MeshPhongMaterial({ map: texture, bumpMap: texture, bumpScale: 1, side: THREE.DoubleSide });
  const bridge = new THREE.Mesh(geometry, material);
  bridge.castShadow = true;
  bridge.receiveShadow = true;
  // Position it right in the middle of the bongos.
  bridge.position.set( 0, -1.3, 8);
  bongos.add( bridge );
}

/*
 * LAMPPOST
 * Functions used to create a lamppost.
 */

function buildLamppost() {
  // Add a new object to hold every part of the smile.
  lamppost = new THREE.Object3D();
  // Define the number of segments for our tube.
  const numPoints = 100;
  // Set the initial vector from where the tube is going to be created.
  const start = new THREE.Vector3(0, -10, 0);
  // Set the vector from where the curve reaches an inflection point.
  // This is where it starts to 'bend'.
  const middle = new THREE.Vector3(0, 60, 0);
  // Set the final vector from where the tube is going to end. 
  const end = new THREE.Vector3(-15, 30, 0);
  const path = new THREE.QuadraticBezierCurve3(start, middle, end);
  const tube = new THREE.TubeGeometry(path, numPoints, 0.75, 20, false);
  const material = new THREE.MeshPhongMaterial( { color: 0x00000 } );
  const mesh = new THREE.Mesh(tube, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  lamppost.castShadow = true;
  lamppost.receiveShadow = true;
  lamppost.add(mesh);
  buildLamppostTop();
  scene.add(lamppost);
}

function buildLamppostTop() {
  const geometry = new THREE.CylinderGeometry( 0.75, 3.4, 4, 32, 32, true );
  // Make it DoubleSide so it's visible inside.
  const materials = new THREE.MeshPhongMaterial( { color: 0x00000, side: THREE.DoubleSide } );
  // Create the top and set it's position and other values.
  const top = new THREE.Mesh( geometry, materials );
  top.position.set( -15, 30, 0);
  top.rotation.z = -Math.PI * 0.15;
  top.receiveShadow = true;
  top.castShadow = true;
  lamppost.add(top);
  buildLamppostBulb();
}

function buildLamppostBulb() {
  const geometry = new THREE.SphereGeometry( 2, 32, 32, -Math.PI * 0.5, Math.PI );
  const material = new THREE.MeshPhongMaterial( { color: 0xffff00 } );
  // Create the top and set it's position and other values.
  const bulb = new THREE.Mesh( geometry, material );
  bulb.rotation.z = Math.PI * 0.32;
  bulb.position.set( -15.3, 28.9, 0);
  bulb.castShadow = true;
  lamppost.add(bulb);
  addLamppostLight();
}

function addLamppostLight() {
  // Add a yellow light, with intensity a bit low intensity,
  // that only covers a small radius and a bit attenuated due to penumbra.
  const spotLight = new THREE.SpotLight( 0xfcdb03, 0.95, 0, Math.PI * 0.13, 0.2 );
  spotLight.position.set( 55, 145, 0 );

  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  spotLight.shadow.camera.near = 50;
  spotLight.shadow.camera.far = 500;
  spotLight.shadow.camera.fov = 35;

  scene.add( spotLight );
}

/*
 * GROUND
 * Functions used to create the ground. This use texture and is placed to cover the entire XY space.
 */

// Function to build the ground.
function buildGround() {
  // Repeat the texture to fill everything, and repeat it multiple times to fit better.
  const texture = loader.load( 'img/grass-texture.jpg' );
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 25, 25 );
  texture.anisotropy = 16;
  const material = new THREE.MeshLambertMaterial( { map: texture } );
  let ground = new THREE.Mesh( new THREE.PlaneBufferGeometry( 3000, 3000 ), material );
  ground.position.y = - 35;
  // Rotate plane so it simulates the ground.
  ground.rotation.x = - Math.PI / 2;
  ground.receiveShadow = true;
  scene.add( ground );
}

/*
 * TREES
 * Functions used to create trees. These use texture and are randomly (position and geometry) created .
 */

// Function to build trees (aka. forest) randomly.
// Uses ranges to determine where each tree is going to be positioned.
// The ranges only include X and Z, so the log is essentially the same height 
// and stays at ground level.
function buildTrees() {
  // Generate a random number to determine the amount of trees.
  const treesToAdd = Math.floor(Math.random() * 5) + 3;
  // Generate trees to the left of the screen (cat's right side);
  for( let i = 0; i <= treesToAdd; i++) {
    let randomX = -1 * (Math.floor(Math.random() * 550) + 80);
    let randomZ = (Math.floor(Math.random() * 400) + 70) * randomSign();
    let newTree = buildTree(randomX, randomZ);
    scene.add(newTree);
  }

  for( let i = 0; i <= treesToAdd; i++) {
    let randomX = -1 * (Math.floor(Math.random() * 550) + 80);
    let randomZ = (Math.floor(Math.random() * 400) + 180) * -1;
    let newTree = buildTree(randomX, randomZ);
    scene.add(newTree);
  }

  // Generate trees behind the cat
  for( let i = 0; i <= treesToAdd / 2; i++) {
    let randomX = (Math.floor(Math.random() * 400) + 40) * randomSign();
    let randomZ = (Math.floor(Math.random() * 500) + 190) * -1;
    let newTree = buildTree(randomX, randomZ);
    scene.add(newTree);
  }
  // Generate trees to the right of the screen (cat's left side);
  for( let i = 0; i <= treesToAdd; i++) {
    let randomX = (Math.floor(Math.random() * 550) + 80);
    let randomZ = (Math.floor(Math.random() * 400) + 220) * randomSign();
    let newTree = buildTree(randomX, randomZ);
    scene.add(newTree);
  }
}

 // Function to build a tree.
 // Using a box geometry as its base.
function buildTree(x, z) {
  const geometry = new THREE.BoxGeometry(7.34, 26.67, 6);
  // Repeat the texture to fill everything, and repeat it in the Y component to make it look better.
  const texture = loader.load('img/tree-texture.jpg');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 1, 4 );
  // Add a bump map to be a little more realistic, not required.
  const material = new THREE.MeshPhongMaterial( { map: texture, bumpMap: texture, bumpScale: 0.8 } );
  let tree = new THREE.Mesh(geometry, material);
  tree.castShadow = true;
  tree.receiveShadow = true;
  tree.position.set(x, 32, z);
  scaleObject(tree, 5);
  let leaves = buildTreeLeaves();
  tree.add(leaves);
  return tree;
}

// Function to build a tree's leaves.
// Using a box geometry as the base on top of the tree log.
function buildTreeLeaves() {
  const geometry = new THREE.BoxGeometry(17.34, 16.67, 12.67);
  // Repeat the texture to fill everything, and keep the same sizes in this case.
  const texture = loader.load('img/leave-texture.jpg');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 1, 1 );
  // Add a bump map to be a little more realistic, not required.
  const material = new THREE.MeshPhongMaterial( { map: texture, bumpMap: texture, bumpScale: 1 } );
  let leaves = new THREE.Mesh(geometry, material);
  leaves.position.y = 12.67;
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  const leavesToAdd = Math.floor(Math.random() * 8) + 2;
  for( let i = 0; i <= leavesToAdd; i++) {
    leaves.add(buildTreeLeavesRandom());
  }
  return leaves;
}

// Function to build a tree's leaves randomly.
// Using a box geometry that's between some ranges depending on the component.
// This way each tree is unique in a way.
function buildTreeLeavesRandom() {
  let randomX = Math.floor(Math.random() * 300) + 100;
  let randomY = Math.floor(Math.random() * 400) + 250;
  let randomZ = Math.floor(Math.random() * 400) + 200;
  const geometry = new THREE.BoxGeometry(randomX / 30, randomY / 30, randomZ / 30);
  // Repeat the texture to fill everything, and keep the same sizes in this case.
  const texture = loader.load('img/leave-texture.jpg');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 1, 1 );
  // Add a bump map to be a little more realistic, not required.
  const material = new THREE.MeshPhongMaterial( { map: texture, bumpMap: texture, bumpScale: 1 } );
  let leaves = new THREE.Mesh(geometry, material);
  leaves.position.y = Math.floor(Math.random() * 260 / 30) * randomSign();
  leaves.position.x = Math.floor(Math.random() * 260 / 30) * randomSign();
  leaves.position.z = Math.floor(Math.random() * 180 / 30) * randomSign();
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  return leaves;
}

// Helper function to get a random sign, either positive or negative.
function randomSign() {
  return -1 + Math.round(Math.random()) * 2;
}

/*
 * SOUNDS
 * Functions used for everything related to sound effects.
 */

// Function to play bongo 0 sound.
function playBongo0() {
  audioLoader.load( 'sounds/bongo0.mp3', function( buffer ) {
    sound.setBuffer( buffer );
    sound.setLoop( false );
    sound.setVolume( 0.5 );
    sound.play();
  });
}

// Function to stop bongo 0 sound.
function stopBongo0() {
  audioLoader.load( 'sounds/bongo0.mp3', function( buffer ) {
    sound.setBuffer( buffer );
    sound.stop();
  });
}

// Function to play bongo 1 sound.
function playBongo1() {
  audioLoader.load( 'sounds/bongo1.mp3', function( buffer ) {
    sound1.setBuffer( buffer );
    sound1.setLoop( false );
    sound1.setVolume( 0.5 );
    sound1.play();
  });
}

// Function to stop bongo 1 sound.
function stopBongo1() {
  audioLoader.load( 'sounds/bongo1.mp3', function( buffer ) {
    sound1.setBuffer( buffer );
    sound1.stop();
  });
}



/*
 * LISTENERS
 * Functions used for listeners to generate some kind of output or interaction.
 */

// Function to handle keyboard events.
// Specifically when the key is pressed
function handleKeyDown(event) {
  console.log(event.keyCode);
  console.log(arms[0].rotation.x)
  if (event.keyCode === 65) { //64 is "a"
    armsMovement[1] = ARMS_SPEED;
    playBongo1();
  } else if (event.keyCode === 68) {
    armsMovement[0] = ARMS_SPEED;
    playBongo0();
  }
}

// Function to handle keyboard events.
// Specifically when the key is depressed :(
function handleKeyUp(event) {
  if (event.keyCode === 65) { // 'a' was pressed
    armsMovement[1] = -ARMS_SPEED;
    stopBongo1();
    
  } else if (event.keyCode === 68) { // 'd' was pressed
    armsMovement[0] = -ARMS_SPEED;
    stopBongo0();
  }
}

// Function to detect if the window was resized to reset
// sizes depending on the new window.
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

window.addEventListener('keydown', handleKeyDown, false);
window.addEventListener('keyup', handleKeyUp, false);
window.addEventListener( 'resize', onWindowResize, false );
