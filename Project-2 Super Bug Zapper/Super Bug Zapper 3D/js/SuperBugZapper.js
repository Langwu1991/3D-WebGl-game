////////////////////////////////////////////
// Date: 12/02/2016
// No: 0665005 & 0648304
// Name: Harsh Joshi & Lang Wu
//
// Title : Super Bug Zapper 3D
///////////////////////////////////////////



//---------Global Generic variables
var canvas; // Canvas element of the HTML.
var gl; // Element to use the shaders
var gameDelay = 150; // Speed of the game
var gamePoints = 0; // Points which computer gains because of the delay of the user clicks
var pMatrixUniform; // Uniform variable for the projection matrix
var mvMatrixUniform; // Uniform variable for the model view matrix
var useLightingUniform; // Unifrom variable for enabling and disabling the lightning
var ambientColorUniform; // Uniform variable for the ambient color
var vColorUniform; // Uniform variable for the color
var diffuseColorUniform; // Uniform variable for the diffused color
var specularColorUniform; // Uniform variable for the specular color
var lightPositionUniform; // Uniform variable for the light position
var shininessUniform; // Uniform variable for the shininess
var modelViewMatrix; // Model view matrix for the transformations
var vPosition; // Attribute for the vertices
var vNormal; // Attribute for the normals
var rotationMatrix = mat4(); // Generic rotation matrix, it works for bacteria and sphere
var newX; // Latest click position - X coordinate
var newY; // Latest click position - Y coordinate

// Scaling related variables
var scaleFactor = []; // Scale factor for the each bacteria
var scaleMultiple = 0.006; // Scale multiple for the each bacteria which increases the scale factor
var explosionMultiple = []; // Explosion multiple for the particle system
var bumbleFactor = 0.02; // Bumble factor for the bumbling of the sphere and bacteria all-together
var isBumbleOutwards = true; // Checks whether the bumble direction is outwards or not.
var bumbleMultiple = 0.004; // Bumble multitple for the increment and decrement.

// Rotation related variables
var rotationAngleX = 0; // Rotation angle along the X axis
var rotationAngleY = 0; // Rotation angle along the y axis
var rotationAngleXFactor = 0; // Rotation angle incrementer or decrementer along X axis
var rotationAngleYFactor = 0; // Rotation angle incrementer or decrementer along y axis
var rotationAngleMultiple = 1.0; // multitple for the incrementer or decrementer

// Model-View related variables
var eye = vec3(0.0, 0.0, 1.5); // Eye position of the camera
var at = vec3(0.0, 0.0, 0.0); // At position of the camera
var up = vec3(0.1, 0.1, 0.1); // Up position of the camera

// Projection related variables
var fovy =100.0; // Fovy for the projection matrix
var aspect = 1.0; // Aspect for the projection matrix
var near = 0.1; // Near for the projection matrix
var far = 100; // Far for the projection matrix

//Lighting related variables
var lightPosition = vec4(-0.2, -0.4, -0.2, 0.0 ); // Light source position
var ambientColor = vec4(0.3, 0.3, 0.3, 0.1 ); // Ambient color for lightning
var diffuseColor = vec4( 1.0, 1.0, 1.0, 1.0 ); // Diffuse lightning color
var specularColor = vec4( 1.0, 1.0, 1.0, 1.0 ); // Specular lightning color
var diffuseProduct, ambientProduct; // Product of the two lightning
var materialColor = vec4( 0.3, 0.3, 1.0, 1.0 ); // material color of individual color
var glossiness = 140.0; // shininess or glossiness
var isLighting = true; // Whether lightning is true or not

//---------Sphere related variables
var sphereVertexBuffer; // Buffer for the vertices of sphere
var sphereNormalBuffer; // Buffer for the normals of sphere
var sphereNormals = []; // Normals for the sphere not in sequenced manner and unique
var sequencedSphereNormals = []; // Sequenced normals for the sphere
var sphereVertices = []; // Sphere vertices not in sequenced manner and unique
var sequencedSphereVertices = []; // Sequenced vertices for the sphere and duplicated.
var noOfLatitudeBands = 1500; // Total number of the latitude bands
var noOfLongituteBands = 1500; // Total number of the longitude bands
var sphereColor = vec4(0.9, 0.9, 0.55, 0.8); // Color of the sphere

//--------Bacteria related variables
var bacteriaVertexBuffer; // Buffer for the vertices of bacteria
var bacteriaNormalBuffer; // Buffer for the normals of the bacteria
var eachBacteriaLength = []; // Length of each bacteria
var eachBacteriaColor = []; // Color of each bacteria
var bacteriaVertices = []; // Stores bacteria vertices
var noOfBacterias = 3; // Total number of the bacteria can be on the sphere at a time
var bacteriaClickedOn = []; // Stores the index of the bacteria on various bacteria which are clicked on
var bacteriaNormals = []; // Normals for the bacteria
var bacteriaRotationMatrix = []; // Matrices for the rotation for each bacteria
var bacteriaModelViewMatrices = []; // Model view matrices for each bacteria

//------------For click and key presses
var clickPosition = vec2(0.0, 0.0); // Stores the coordinates of the click
var mouseDown = false; // Whether mouse down or not
var lastMouseX = null; // Stores last mouse x position
var lastMouseY = null; // stores last mouse y position
var isClicked = false; // is clicked or not
var isKeyPressed = false; // is any key pressed or not
var keyValue; // What key you have pressed

//------------Gameplay
var noOfBacteriaKilled = 0; // It stores the number of the bacteria killed by the user
var timer = 60; // Sets the time limit for the game
var intervalValue; // Sets the time limit for the game
var noOfBacteriaAllowedToGrow = 3; // Sets the limit of the maximum number of the bacteria allowed to grow
var isAllowedBacteriaFullyGrown = false; // Sets the flag to check whether the user is loosing or not on condition of allowed bacteria to grow


// On load of the page event
window.onload = function init()
{
  canvas = document.getElementById( "gl-canvas" );

  // Initialize the canvas
  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  // Configure the Webgl
  gl.viewport( 0.0, 0.0, canvas.width, canvas.height );
  gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers
  var program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  cacheSphereVertices();
  cacheBacteriaVertices();
  initializeArrays();
  rotateBacteriaAtRandomPosition();
  startTimer();

  // Load the data into the GPU
  sphereVertexBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertexBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, flatten(sequencedSphereVertices), gl.STATIC_DRAW);

  sphereNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(sequencedSphereNormals), gl.STATIC_DRAW);

  bacteriaVertexBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, bacteriaVertexBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, flatten(bacteriaVertices), gl.STATIC_DRAW);

  bacteriaNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bacteriaNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(bacteriaNormals), gl.STATIC_DRAW);

  // Associate out shader variables with our data buffer
  vPosition = gl.getAttribLocation( program, "vPosition" ); // Vertex buffer
  gl.enableVertexAttribArray( vPosition );

  vNormal = gl.getAttribLocation(program, "vNormal");
  gl.enableVertexAttribArray(vNormal);

  mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
  pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
  uNMatrixUniform = gl.getUniformLocation(program, "uNMatrix");
  vColorUniform = gl.getUniformLocation(program, "vColor");
  ambientColorUniform = gl.getUniformLocation(program, "uAmbientColor");
  diffuseColorUniform = gl.getUniformLocation(program, "uDiffuseColor");
  specularColorUniform = gl.getUniformLocation(program, "uSpecularColor");
  lightPositionUniform = gl.getUniformLocation(program, "ulightPosition");
  useLightingUniform = gl.getUniformLocation(program, "uUseLighting");
  glossinessUniform=gl.getUniformLocation(program, "glossiness");

  canvas.onmousedown = handleMouseDown;
  document.onmouseup = handleMouseUp;
  document.onmousemove = handleMouseMove;
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the buffer bit before starting the game
  render();
}

// It prints the timer sets the intervalValue
function printTimer()
{
  timer--;
  var timerValue = document.getElementById("timer");
  timerValue.innerHTML = timer;
}

// It sets the interval value of 1s for the game timer
function startTimer()
{
  intervalValue = setInterval("printTimer()",1000);
}

// Stops the timer and clears the interval
function stopTimer()
{
  clearInterval(intervalValue);
}

// Cache the sphere vertices to make the sphere using triangles
function cacheSphereVertices()
{
  var vertexPositionData = [];
  for (var i=0; i<=noOfLatitudeBands; i++)
  {
    var radius = 0.01;
    var theta = i * Math.PI / noOfLatitudeBands;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    for (var j=0; j<=noOfLongituteBands; j++)
    {
      var phi = j * 2 * Math.PI / noOfLongituteBands;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      var x = (cosPhi * sinTheta) + (Math.random()*radius);
      var y = cosTheta + (Math.random()*radius);
      var z = (sinPhi * sinTheta) + (Math.random()*radius);
      var u = 1 - (j / noOfLongituteBands);
      var v = 1 - (i / noOfLatitudeBands);

      sphereNormals.push(vec3(x,y,z));
      sphereVertices.push(vec4(x,y,z,1.0));
    }
  }

  // Sequence the sphere vertices and make the triangles
  for (var i=0; i<noOfLatitudeBands; i++) {
    for (var j=0; j<noOfLongituteBands; j++) {
      var first = (i * (noOfLongituteBands + 1)) + j;
      var second = first + noOfLongituteBands + 1;
      sequencedSphereVertices.push(sphereVertices[first]);
      sequencedSphereVertices.push(sphereVertices[second]);
      sequencedSphereVertices.push(sphereVertices[first + 1]);

      sequencedSphereVertices.push(sphereVertices[second]);
      sequencedSphereVertices.push(sphereVertices[second + 1]);
      sequencedSphereVertices.push(sphereVertices[first + 1]);

      sequencedSphereNormals.push(sphereNormals[first]);
      sequencedSphereNormals.push(sphereNormals[second]);
      sequencedSphereNormals.push(sphereNormals[first + 1]);

      sequencedSphereNormals.push(sphereNormals[second]);
      sequencedSphereNormals.push(sphereNormals[second + 1]);
      sequencedSphereNormals.push(sphereNormals[first + 1]);
    }
  }
}

// Cache bacteria vertices from the sphere vertices take the center point as the
// first point of the sphere
function cacheBacteriaVertices()
{
  var minTheta = Math.cos(degreesToRadians(10.0));
  var maxTheta = Math.cos(degreesToRadians(0.0));
  for(var i = 0; i<noOfBacterias; i++)
  {
    var radius = 0.02;
    var newBacteriaVextex;
    var newCenterVertex = 0;
    var bacteriaLength = 0;
    newBacteriaVextex = vec4(sphereVertices[newCenterVertex][0]+Math.random()*(3*radius),
                              sphereVertices[newCenterVertex][1]+radius-0.01,
                              sphereVertices[newCenterVertex][2]+Math.random()*(3*radius),
                              1.0);
    bacteriaVertices.push(newBacteriaVextex);
    bacteriaNormals.push(sphereNormals[newCenterVertex]);
    bacteriaLength++;
    for(var j = 0; j<sphereVertices.length; j++)
    {
      if( dot(sphereNormals[newCenterVertex], sphereNormals[j]) > minTheta
      &&
      dot(sphereNormals[newCenterVertex], sphereNormals[j]) < maxTheta) // Find the points between theta using the dot product
      {
        newBacteriaVextex = vec4(sphereVertices[j][0]+Math.random()*(3*radius),
                                sphereVertices[j][1]-Math.random()*radius,
                                sphereVertices[j][2]+Math.random()*(3*radius),
                                1.0);
        bacteriaVertices.push(newBacteriaVextex);
        bacteriaNormals.push(sphereNormals[j]);
        bacteriaLength++;
      }
    }
    eachBacteriaLength.push([bacteriaVertices.length-bacteriaLength, bacteriaLength]);
  }
}

// Initialize arrays for all the required attributes
function initializeArrays()
{
  for(var i = 0; i < noOfBacterias; i++)
  {
    eachBacteriaColor.push(vec4(Math.random(), Math.random()*0.3, Math.random(), 1.0));
    bacteriaRotationMatrix.push(mat4());
    scaleFactor.push(0.005);
    bacteriaModelViewMatrices.push(0);
    bacteriaClickedOn.push = false;
    explosionMultiple.push(0.09);
  }
}

// Convert degrees to radians
function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

// Convert radians to degrees
function radiansToDegrees(radians)
{
  return radians * 180 / Math.PI;
}

// Handles the key down event
function handleKeyDown(event) {
  keyValue = event.which || event.keyCode;
  isKeyPressed = true;
}

// Handles the key up event
function handleKeyUp(event) {
  isKeyPressed = false;
  keyValue = 0;
  rotationAngleYFactor = 0;
  rotationAngleXFactor = 0;
}

// Handles the mouse down event
function handleMouseDown(event) {
  mouseDown = true;
  isClicked = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
  clickPosition = vec2((2.0*event.clientX)/canvas.width-1.0,
  // 1.0 - (2.0 * event.clientY)/canvas.height);
  2*(canvas.height-event.clientY)/canvas.height-1);

}

// Handles the mouse up event
function handleMouseUp(event) {
  mouseDown = false;
}

// Handles the mouse move event
function handleMouseMove(event) {
  if (!mouseDown) {
    return;
  }
  isClicked = false;
  newX = event.clientX;
  newY = event.clientY;

  var deltaX = newX - lastMouseX;
  var newRotationMatrix = mat4();
  newRotationMatrix = mult(newRotationMatrix, rotate(deltaX / 8, [0, 1, 0]));

  var deltaY = newY - lastMouseY;
  newRotationMatrix = mult(newRotationMatrix, rotate(deltaY / 8, [1, 0, 0]));

  rotationMatrix = mult(newRotationMatrix, rotationMatrix);

  lastMouseX = newX
  lastMouseY = newY;
}

// Rotate all the bacteria at the random position
function rotateBacteriaAtRandomPosition() {
  for(var i = 0; i < noOfBacterias; i++)
  {
    bacteriaRotationMatrix[i] = mult(rotateZ(Math.random()*360), bacteriaRotationMatrix[i]);
    bacteriaRotationMatrix[i] = mult(rotateX(Math.random()*360), bacteriaRotationMatrix[i]);
  }
}

// Rotate a single bacteria at the random position when a new bacteria is generated
function rotateSingleBacteriaAtRandomPosition(i)
{
  bacteriaRotationMatrix[i] = mat4();
  bacteriaRotationMatrix[i] = mult(rotateZ(Math.random()*360), bacteriaRotationMatrix[i]);
  bacteriaRotationMatrix[i] = mult(rotateX(Math.random()*360), bacteriaRotationMatrix[i]);
}

// Rotate every object when it is moved by mouse or key presses
function keepRotating(){
  modelViewMatrix = mult(modelViewMatrix, rotateX(rotationAngleX));
  modelViewMatrix = mult(modelViewMatrix, rotateY(rotationAngleY));

  rotationAngleX = rotationAngleX + rotationAngleXFactor;
  rotationAngleY = rotationAngleY + rotationAngleYFactor;
  if(rotationAngleX > 360)
  rotationAngleX = 0;
  if(rotationAngleY > 360)
  rotationAngleY = 0;

  if(rotationAngleX < 0)
  rotationAngleX = 360;
  if(rotationAngleY < 0)
  rotationAngleY = 360;

  if(isKeyPressed)
  {
    if(keyValue == 87) //w
    {
      rotationAngleXFactor = rotationAngleXFactor + rotationAngleMultiple;
    }
    else if(keyValue == 65) //a
    {
      rotationAngleYFactor = rotationAngleYFactor + rotationAngleMultiple;
    }
    else if(keyValue == 68) //d
    {
      rotationAngleYFactor = rotationAngleYFactor - rotationAngleMultiple;
    }
    else if(keyValue == 83) //s
    {
      rotationAngleXFactor = rotationAngleXFactor - rotationAngleMultiple;
    }
  }
}

// Keep bumbling the sphere and bacteria to make it more good looking
function keepBumbling(){
  modelViewMatrix = mult(modelViewMatrix, scalem([1+bumbleFactor, 1+bumbleFactor, 1+bumbleFactor]));
  if(bumbleFactor <= 0)
  isBumbleOutwards = true;
  else if(bumbleFactor >= 0.02)
  isBumbleOutwards = false;

  if(isBumbleOutwards)
  bumbleFactor = bumbleFactor + bumbleMultiple;
  else
  bumbleFactor = bumbleFactor - bumbleMultiple;
}

// Set all the matrix uniforms for all the object
function setMatrixUnifroms(){
  if(isLighting) {
    // ambient product will be the multiplication of the material color and ambient color
    ambientProduct = mult(ambientColor, materialColor);
    // diffuse product will be the multiplication of the material color and diffused lightning color
    diffuseProduct = mult(diffuseColor, materialColor);
  }
  else {
    diffuseProduct = materialColor;
    ambientProduct = ambientColor;
  }
  gl.uniformMatrix4fv(mvMatrixUniform, false, flatten(modelViewMatrix));
  gl.uniform1i(useLightingUniform, isLighting);
  gl.uniform4fv(vColorUniform, materialColor);
  gl.uniform4fv(ambientColorUniform, flatten(ambientProduct) );
  gl.uniform4fv(diffuseColorUniform, flatten(diffuseProduct) );
  gl.uniform4fv(specularColorUniform, flatten(specularColor) );
  gl.uniform4fv(lightPositionUniform, flatten(lightPosition) );
  gl.uniform1f(glossinessUniform,glossiness);
}

// Draws sphere on every loop of the render
function drawSphere()
{
  gl.bindBuffer( gl.ARRAY_BUFFER, sphereVertexBuffer);
  gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);

  gl.bindBuffer( gl.ARRAY_BUFFER, sphereNormalBuffer);
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);

  materialColor = sphereColor;
  setMatrixUnifroms();
  gl.drawArrays(gl.TRIANGLES, 0, sequencedSphereVertices.length); // Draws the sphere from the defined location in the buffer
}

// Draws bacteria with in all conditions
function drawBacteria()
{
  var noOfBacteriaFullyGrown = 0; // To check whether limit of the bacteria is fully grown or not
  var tempModelViewMatrix = modelViewMatrix;
  for(var i = 0; i < noOfBacterias; i++)
  {
    var isClicked = bacteriaClickedOn[i];
    modelViewMatrix = tempModelViewMatrix;
    // for the rotation of the bacteria along with the sphere when mouse is moved
    modelViewMatrix = mult(modelViewMatrix, bacteriaRotationMatrix[i]);
    // for the scaling of the bacteria to a random value to make bacteria live
    modelViewMatrix = mult(modelViewMatrix, scalem([0.2+(scaleFactor[i]+(Math.random()*scaleFactor[i]/10)),
                                                    1.005 + (Math.random()*0.001),
                                                    0.2+(scaleFactor[i]+(Math.random()*scaleFactor[i]/10))]));
    bacteriaModelViewMatrices[i] = modelViewMatrix;
    if(bacteriaClickedOn[i])
    {
      // If bacteria is grown to 30 degrees
      if(scaleFactor[i] >= 1.2)
      {
        bacteriaClickedOn[i] = false;
        rotateSingleBacteriaAtRandomPosition(i); // generate bacteria at random position
        eachBacteriaColor[i] = vec4(Math.random(), Math.random()*0.3, Math.random(), 1.0); // set random color for each bacteria
        scaleFactor[i] = 0.005; // set scale factor for the each bacteria
        bacteriaRotationMatrix[i] = mult(rotateY(Math.random()*360), bacteriaRotationMatrix[i]); // for the explosion
        explosionMultiple[i] = 0.09; // Set how much fast explosion you want
        noOfBacteriaKilled++; // Keeps track of the bacteria killed and increase it by one
        setUserPoints(); // Displays user points
      }
      else
      {
        scaleFactor[i] = scaleFactor[i] + explosionMultiple[i];  // scale it by the explosion factor
        explosionMultiple[i] = explosionMultiple[i] + (explosionMultiple[i]/2); // increase the explosion multiple
        eachBacteriaColor[i] = vec4(0.8, Math.random(), Math.random()*0.4, 1); // set color for each points
      }
    }
    else {
      if(scaleFactor[i] >= 0.8)
      {
        noOfBacteriaFullyGrown++;
        gamePoints += 1; // Increase game points by 1 if bacteria is killed
      }
      else
      {
        scaleFactor[i] = scaleFactor[i] + scaleMultiple; // Increase the bacteria in usual scenario
      }
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, bacteriaVertexBuffer);
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer( gl.ARRAY_BUFFER, bacteriaNormalBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);

    materialColor = eachBacteriaColor[i];
    setMatrixUnifroms();
    if(isClicked)
      gl.drawArrays(gl.POINTS, eachBacteriaLength[i][0], eachBacteriaLength[i][1]); // For explosion scenario
    else
      gl.drawArrays(gl.TRIANGLE_FAN, eachBacteriaLength[i][0], eachBacteriaLength[i][1]); // For normal scenario

    if(noOfBacteriaFullyGrown >= noOfBacteriaAllowedToGrow) // Checks if total number of the bacteria grown to full size are less or not
      isAllowedBacteriaFullyGrown = true;
  }
}

// Loop through render function in the specified time interval
function render()
{
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  modelViewMatrix = lookAt(eye, at , up); // Set the camera
  projectionMatrix = perspective(fovy, aspect, near, far); // Set the perspective

  // Set the projection matrix intially for all the objects
  gl.uniformMatrix4fv(pMatrixUniform, false, flatten(projectionMatrix));

  // Rotation using the mouse and key press
  modelViewMatrix = mult(modelViewMatrix, rotationMatrix);
  keepRotating();

  // Bumbling effect for the sphere and bacteria
  keepBumbling();

  // Find the clicked bacteria
  findClickedBacteria();

  // Draw objects
  drawSphere();
  drawBacteria();


  gamePoints = gamePoints+0.2; // Game gains points on every loop
  setGamePoints();

  if(timer <= 0 || isAllowedBacteriaFullyGrown)
  {
    // If specified number of bacteria increase to its maximum length or game has more points than user, user lose
    if(isAllowedBacteriaFullyGrown || noOfBacteriaKilled*10 < gamePoints)
    {
      document.getElementById("looseStatement").style.display = "block";
      var audio = new Audio('./sounds/Lose.mp3');
      audio.play();
    }
    // If user has more points has more points than game then user wins
    else if (noOfBacteriaKilled*10 > gamePoints) {
      document.getElementById("winStatement").style.display = "block";
      var audio = new Audio('./sounds/Win.mp3');
      audio.play();

    }
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);
    gl.uniformMatrix4fv(pMatrixUniform, false, flatten(projectionMatrix));
    drawSphere();
    stopTimer();
    return;
  }

  setTimeout(
    function (){requestAnimFrame(render);}, gameDelay // According to the delay, render function will be called.
  );
}

// Checks whether the click position matches the location of the bacteia or not
function findClickedBacteria()
{
  if(isClicked)
  {
    for(var i = 0; i < noOfBacterias; i++)
    {
      // Inverse the projection matrix for later use.
      var projectionMatrixInverse = inverse(projectionMatrix);

      // Converts the click position of the local space to the eye space using the
      // multiplication of the inverse of the projection matrix
      var clickPositionEyeSpaceInitial = mult(projectionMatrixInverse, vec4(clickPosition, -1.0, 1.0));
      var clickPositionEyeSpace = vec4(vec2(clickPositionEyeSpaceInitial),-1.0,0.0);

      // Converts the center point of the sphere to the eye space using the
      // multiplication of the model view matrix and center point
      var centerPointEyeSpace = mult(bacteriaModelViewMatrices[i], vec4(0,0,0,1));
      zClickPositionEyeSpace = centerPointEyeSpace[2];

      // Appends the z coordinate to the already converted click position in eye space
      // for later use in the dot product
      clickPositionEyeSpaceWithZ = vec3(vec2(clickPositionEyeSpace), zClickPositionEyeSpace);

      // Convert center point of the bacteria to the eye space for the later use in the dot product
      var centerPointBacteriaEyeSpace = mult(bacteriaModelViewMatrices[i], bacteriaVertices[0]);

      // Convert the center point of the bacteria to the Homogeneous space to find the Z coordinate of the bacteria
      // To check that whether bacteria is not on the backside of the sphere
      var centerPointBacteriaHomogeneousSpace = mult(mult(bacteriaModelViewMatrices[i], projectionMatrix), bacteriaVertices[0]);

      // Find the dot product between the center point of the bacteria and the click position in the eye space
      var cosTheta = dot(normalize(vec3(centerPointBacteriaEyeSpace)), normalize(clickPositionEyeSpaceWithZ));

      // Checks whether the click position is in the specified angle from the center point of the bacteria
      // Checks whether the center point of the bacteria is not on the back side of the sphere
      if((cosTheta > Math.cos(degreesToRadians(20.0)) && cosTheta < Math.cos(degreesToRadians(0.0))) && centerPointBacteriaHomogeneousSpace[2] > 0.6)
      {
        bacteriaClickedOn[i] = true;
        var audio = new Audio('./sounds/Explosion.mp3');
        audio.play();
      }
      else{
        var audio = new Audio('./sounds/Click.mp3');
        audio.play();
      }
    }
    isClicked = false;
  }
}

// Displays user points
function setUserPoints()
{
  var points = document.getElementById("userPoints");
  points.innerHTML = noOfBacteriaKilled * 10;
  var bacterias = document.getElementById("bacteriaKilled");
  bacterias.innerHTML = noOfBacteriaKilled;
}

// Displays game points
function setGamePoints()
{
  gamePointsTitle = document.getElementById("gamePoints");
  gamePointsTitle.innerHTML = gamePoints.toFixed(2);
}

// Laser beam to kill bacteria
// function laserBeam()
// {
//   if(isClicked)
//   {
//     var projectionMatrixInverse = inverse(projectionMatrix);
//
//     // Eye Space
//     var clickPositionEyeSpaceInitial = mult(projectionMatrixInverse,vec4(clickPosition, -1.0, 1.0));
//
//     var clickPositionEyeSpace = vec4(vec2(clickPositionEyeSpaceInitial),-1.0,0.0);
//
//     // Eye Space
//     var centerPointEyeSpace = mult(modelViewMatrix, vec4(0,0,0,1));
//
//     zClickPositionEyeSpace = centerPointEyeSpace[2];
//
//     //Eye Space
//     clickPositionEyeSpaceWithZ = vec3(vec2(clickPositionEyeSpace), zClickPositionEyeSpace);
//
//     var xAxis = vec4(1,0,0,1);
//     var yAxis = vec4(0,1,0,1);
//     var zAxis = vec4(0,0,1,1);
//
//     //Eye Space Axis
//     var xAxisEyeSpace = mult(modelViewMatrix, xAxis);
//     var yAxisEyeSpace = mult(modelViewMatrix, yAxis);
//     var zAxisEyeSpace = mult(modelViewMatrix, zAxis);
//
//     //Eye Space
//     var thetaX = radiansToDegrees(Math.acos(dot(normalize(vec3(xAxis)), normalize(clickPositionEyeSpaceWithZ))));
//     //Eye Space
//     var thetaY = radiansToDegrees(Math.acos(dot(normalize(vec3(yAxis)), normalize(clickPositionEyeSpaceWithZ))));
//     //Eye Space
//     var thetaZ = radiansToDegrees(Math.acos(dot(normalize(vec3(zAxis)), normalize(clickPositionEyeSpaceWithZ))));
//
//     // console.log("X:" + thetaX);
//     // console.log("Y:" + thetaY);
//     console.log("Z:" + thetaZ);
//
//     // bacteriaRotationMatrix[0] = mat4();
//     // bacteriaRotationMatrix[0] = mult(rotateZ(thetaX), bacteriaRotationMatrix[0]);
//     // bacteriaRotationMatrix[0] = mult(rotateX(thetaZ), bacteriaRotationMatrix[0]);
//   }
// }
