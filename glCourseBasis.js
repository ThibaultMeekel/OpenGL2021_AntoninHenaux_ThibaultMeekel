// =====================================================
const arrayImage = [];
var gl;
var shadersLoaded = 0;
var vertShaderTxt;
var fragShaderTxt;
var shaderProgram = null;
var vertexBuffer;
var colorBuffer;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var objMatrix = mat4.create();
var arrayTexture = [];
var n = 360;
var alpha = 1.0;
var threshold = 0.82;
var distCENTER;
var onlyOne = true;
var falseColors = false;
var lut1 = [0.0, 0.0, 0.0];
var lut2 = [0.0, 0.0, 0.0];
var lut3 = [0.0, 0.0, 0.0];
var lut4 = [0.0, 0.0, 0.0];
var lut5 = [0.0, 0.0, 0.0];

mat4.identity(objMatrix);



// =====================================================
function webGLStart() {
	var canvas = document.getElementById("WebGL-test");
	distCENTER = vec3.create([0,0,-2]);

	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	canvas.onwheel = handleMouseWheel;

	for (var i = 0; i <= 360; i++) {
		if (i<10) {
			arrayImage.push("image-0000"+i+".jpg");
		}
		else if (i<100) {
			arrayImage.push("image-000"+i+".jpg");
		}
		else {
			arrayImage.push("image-00"+i+".jpg");
		}
	}

	initGL(canvas);
	initBuffers();
	for (var i = 0; i < arrayImage.length; i++) {
		arrayTexture.push(gl.createTexture());
		initTexture(arrayImage[i], arrayTexture[i]);
	}
	loadShaders('shader');

	//réinit l'affichage
	gl.clearColor(0.7, 0.7, 0.7, 1.0);

//	drawScene();
	tick();
}

// =====================================================
function initGL(canvas) // Lie la carte graphique au(x) canevas
{
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
	} catch (e) {}
	if (!gl) {
		console.log("Could not initialise WebGL");
	}
}

// =====================================================
function initBuffers() {
	// Vertices (array)
	vertices = [ // Géométrie 3D
		-0.3, -0.3,
		-0.3,  0.3,
		 0.3,  0.3, 
		 0.3, -0.3
		 ];
	vertexBuffer1 = gl.createBuffer();//crée un buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer1);//active le buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);//envoie le tableau sur le buffer initialisé
	vertexBuffer1.itemSize = 2;
	vertexBuffer1.numItems = 4;

	// Texture coords (array)
	texcoords = [ // le (0,0) est en haut à gauche...
		 0.0, 0.0,
		 0.0, 1.0,
		 1.0, 1.0,
		 1.0, 0.0
		 ];
	texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
	texCoordBuffer.itemSize = 2;
	texCoordBuffer.numItems = 4;
	
	// Index buffer (array)
	var indices = [ 0, 1, 2, 2, 3, 0];
	indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	indexBuffer.itemSize = 1;
	indexBuffer.numItems = indices.length;
	
}


// =====================================================
function initTexture(image, texture)
{
	var texImage = new Image();
	texImage.src = "image-00344/"+image;
	texture.image = texImage;

	texImage.onload = function () {
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.uniform1i(shaderProgram.samplerUniform, 0);
		gl.activeTexture(gl.TEXTURE0);
	}
}


// =====================================================
function loadShaders(shader) {
	loadShaderText(shader,'.vs');
	loadShaderText(shader,'.fs');
}

// =====================================================
function loadShaderText(filename,ext) {   // technique car lecture asynchrone...
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
			if(ext=='.vs') { vertShaderTxt = xhttp.responseText; shadersLoaded ++; }
			if(ext=='.fs') { fragShaderTxt = xhttp.responseText; shadersLoaded ++; }
			if(shadersLoaded==2) {
				initShaders(vertShaderTxt,fragShaderTxt);
				shadersLoaded=0;
			}
    }
  }
  xhttp.open("GET", filename+ext, true);
  xhttp.send();
}

// =====================================================
function initShaders(vShaderTxt,fShaderTxt) {

	vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vshader, vShaderTxt);
	gl.compileShader(vshader);
	if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(vshader));
		return null;
	}

	fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fshader, fShaderTxt);
	gl.compileShader(fshader);
	if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(fshader));
		return null;
	}

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vshader);
	gl.attachShader(shaderProgram, fshader);

	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.texCoordsAttribute = gl.getAttribLocation(shaderProgram, "texCoords");
	gl.enableVertexAttribArray(shaderProgram.texCoordsAttribute);
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
	shaderProgram.zPosUniform = gl.getUniformLocation(shaderProgram, "uZPos");

	shaderProgram.alphaUniform = gl.getUniformLocation(shaderProgram, "uAlpha");
	shaderProgram.thresholdUniform = gl.getUniformLocation(shaderProgram, "uThreshold");

	shaderProgram.falseColorsUniform = gl.getUniformLocation(shaderProgram, "uFalseColors");

	shaderProgram.lut1Uniform = gl.getUniformLocation(shaderProgram, "uLut1");
	shaderProgram.lut2Uniform = gl.getUniformLocation(shaderProgram, "uLut2");
	shaderProgram.lut3Uniform = gl.getUniformLocation(shaderProgram, "uLut3");
	shaderProgram.lut4Uniform = gl.getUniformLocation(shaderProgram, "uLut4");
	shaderProgram.lut5Uniform = gl.getUniformLocation(shaderProgram, "uLut5");


	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer1);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
     	vertexBuffer1.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.texCoordsAttribute,
      	texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
}


// =====================================================
function setMatrixUniforms() {
	if(shaderProgram != null) {
		gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
		
		gl.uniform1f(shaderProgram.alphaUniform, alpha);
		gl.uniform1f(shaderProgram.thresholdUniform, threshold);

		gl.uniform1i(shaderProgram.falseColorsUniform, falseColors);

		gl.uniform3fv(shaderProgram.lut1Uniform, lut1);
		gl.uniform3fv(shaderProgram.lut2Uniform, lut2);
		gl.uniform3fv(shaderProgram.lut3Uniform, lut3);
		gl.uniform3fv(shaderProgram.lut4Uniform, lut4);
		gl.uniform3fv(shaderProgram.lut5Uniform, lut5);
	}
}


// =====================================================
function setZPosUniforms(zPos) {
	if(shaderProgram != null) {
		gl.uniform1f(shaderProgram.zPosUniform, zPos);
	}
}


// =====================================================
function setOpacity(alpha){	
	this.alpha = alpha;
}


// =====================================================
function setNumberImage(n){	
	this.n = n;
}


// =====================================================
function setThreshold(threshold){	
	this.threshold = threshold;
}

//======================================================
function setOnlyOne(bool){
	onlyOne = bool;
}

//======================================================
function setFalseColors(bool){
	falseColors=bool;
}

//======================================================
function setColors(colorValue, colorIndex){
	if (colorIndex == 1)
	{
		lut1 = colorValue;
	}
	else if (colorIndex == 2)
	{
		lut2 = colorValue;
	}
	else if (colorIndex == 3)
	{
		lut3 = colorValue;
	}
	else if (colorIndex == 4)
	{
		lut4 = colorValue;
	}
	else
	{
		lut5 = colorValue;
	}
}

// =====================================================
function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT);	

	if(shaderProgram != null) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, objMatrix);

		setMatrixUniforms();

		var dZ = 0.6/(n-1);
		if (onlyOne == false)
		{
			setZPosUniforms(0.0);
			gl.bindTexture(gl.TEXTURE_2D,arrayTexture[n]);
			gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
		else
		{
			for (var i = 0; i < n; i++) {
				setZPosUniforms(-0.3+i*dZ);
				gl.bindTexture(gl.TEXTURE_2D,arrayTexture[Math.floor(i*360/n)]);
				gl.drawElements(gl.TRIANGLES, indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			}
		}
		
	}
}
