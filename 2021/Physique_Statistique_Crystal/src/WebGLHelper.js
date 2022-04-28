class WebGLHelper {
    constructor() {
        // Initialize program list
        this.programList = {};

        // By default, don't assume static drawing from a buffer
        this.staticDrawConfig = {
            enabled : false,
        };
    }


    // ======= CORE METHODS =======
    /**
     * Initialize the WebGLHelper onto a canvas.
     * This will setup the gl and canvas global variables.
     * @param canvasID ID of the HTML canvas element
     * @param canvasSize Size of the canvas as an array [width, height]
     * @param webglExtensions A list of required extensions as a string array (default = [])
     */
    initialize(canvasID, webglExtensions = []) {
        // Check for WebGL2 support
        this.canvas = document.getElementById(canvasID);
        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            alert("WebGL2 not available. Please update your browser.");
            return;
        }

        // Check for extensions support
        for (let i = 0; i < webglExtensions.length; i++) {
            let ext = this.gl.getExtension(webglExtensions[i]);
            if (!ext) {
                alert(`WebGL2 extension ${webglExtensions[i]} not available. Please update your browser.`);
                return;
            }
        }

        // Setup WebGL
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer
    }




    // ======= PROGRAM MANAGER METHODS =======
    /**
     * Create a new pipeline WebGL2 program instance
     * @param programName Name of the program used for reference
     * @param vertexShaderCode Source code of the vertex shader
     * @param fragmentShaderCode Source code of the fragment shader
     */
    createProgram(programName, vertexShaderCode, fragmentShaderCode) {
        // Create shaders modules and link it to the pipeline
        const vertShader = this.loadShader(this.gl.VERTEX_SHADER, vertexShaderCode);
        const fragShader = this.loadShader(this.gl.FRAGMENT_SHADER, fragmentShaderCode);

        // Create program
        let program = this.gl.createProgram();
        this.gl.attachShader(program, vertShader);
        this.gl.attachShader(program, fragShader);
        this.gl.linkProgram(program);

        // If failed to link shaders
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error("Cannot link shader program: " + this.gl.getProgramInfoLog(program));
            return;
        }

        this.programList[programName] = {
            programInstance: program,
            uniforms: []
        };
    }

    /**
     * Say to WebGL to load this program, and set-up configured uniforms
     * @param programName Name of the program to load
     */
    startProgram(programName) {
        // Say WebGL to use this program
        let prog = this.programList[programName];
        this.gl.useProgram(prog.programInstance);

        // Send uniform values
        for (let i = 0; i < prog.uniforms.length; i++) {
            if (prog.uniforms[i].type == 'float')
                this.gl.uniform1f(prog.uniforms[i].shaderBinding, prog.uniforms[i].value);
            else if (prog.uniforms[i].type == 'vec2')
                this.gl.uniform2fv(prog.uniforms[i].shaderBinding, prog.uniforms[i].value);
            else if (prog.uniforms[i].type == 'attachment')
                this.gl.uniform1i(prog.uniforms[i].shaderBinding, prog.uniforms[i].value);
        }

        // Setup hard-coded vertices mode
        if (this.staticDrawConfig.enabled) {
            this.gl.enableVertexAttribArray(this.staticDrawConfig.shaderID);
            this.gl.vertexAttribPointer(prog.programInstance, this.staticDrawConfig.size, this.staticDrawConfig.type, false, 0, 0);
        }
    }

    /**
     * Say to WebGL to draw the vertices on the screen
     * 
     */
    drawProgram(programName, drawBuffers = []) {
        // Say shader to draw on multiple buffers
        if (drawBuffers.size != 0) {
            let modifiedArray = [];
            for (let i = 0; i < drawBuffers.length; i++)
                modifiedArray.push(this.gl.COLOR_ATTACHMENT0 + drawBuffers[i]);

            this.gl.drawBuffers(modifiedArray);
        }

        // Static drawing
        if (this.staticDrawConfig.enabled)
            this.gl.drawArrays(this.gl.TRIANGLES, 0, this.staticDrawConfig.vertexCount);
    }




    // ======= UNIFORMS =======
    /**
     * Add a uniform value to a program shaders
     * @param programName Name of the program
     * @param name Name of the uniform used for referencing
     * @param value Value of the uniform
     * @param shaderID Binding ID in the shader
     * @param type Type of the uniform (currently supported : float)
     */
    addUniform(programName, name, value, shaderID, type) {
        if (type != 'float' && type != 'vec2' && type != 'attachment') {
            console.error(`Uniform of type ${type} not supported.`);
            return;
        }

        // Add the uniform value to the list in the program
        this.programList[programName].uniforms.push({ programName, name, value, shaderID, type });

        // Get the uniform shader binding point
        this.programList[programName].uniforms[this.programList[programName].uniforms.length - 1].shaderBinding
            = this.gl.getUniformLocation(this.programList[programName].programInstance, shaderID);
    }

    /**
     * Update the value of an uniform
     * @param programName Name of the program
     * @param uniformName Reference name of the uniform or in the shader
     * @param value New value of the uniform
     */
    setUniform(programName, uniformName, value) {
        // Search for the corresponding uniform and return
        for (let i = 0; i < this.programList[programName].uniforms.length; i++) {
            if (this.programList[programName].uniforms[i].name == uniformName || this.programList[programName].uniforms[i].shaderID == uniformName) {
                this.programList[programName].uniforms[i].value = value;
                return;
            }
        }

        // Not found
        console.error(`Trying to change the value of a non-existing uniform named ${uniformName}.`);
    }



    // Utils
    /**
     * Create a shader module.
     * @param type Type of the shader (vert, frag)
     * @param source Source code of the shader 
     * @returns The shader module
     */
    loadShader(type, source) {
        const shader = this.gl.createShader(type);

        // Send source to the object
        this.gl.shaderSource(shader, source);

        // Compile shader
        this.gl.compileShader(shader);

        // Check if compiled
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }





    // ======= BUFFER AND IMAGE MANAGER METHODS =======
    /**
     * Say to use static drawing and sets the buffer to use
     * @param programName Name of the program
     * @param bufferContent Buffer content to use
     * @param shaderID Shader ID in which we will read the vertices data
     * @param size Size of a vertex
     * @param type Type of the vertex data
     */
    setVerticesBuffer(programName, bufferContent, shaderID, size, type) {
        // Set buffer data
        let buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferContent, this.gl.STATIC_DRAW);
        
        // Set static config
        this.staticDrawConfig = {
            enabled : true,
            size : size,
            type : type,
            buffer : buffer,
            shaderID : this.gl.getUniformLocation(this.programList[programName].programInstance, shaderID),
            vertexCount : bufferContent.length / size
        };
    }


    /**
     * Create a new buffer
     * @param bufferInitialContent The buffer initial content as a Float32 array (default null)
     * @param dataBindingType Binding type of the data (default STATIC_DRAW)
     * @return The created WebGL buffer
     */
    createBuffer(bufferInitialContent = null, dataBindingType = this.gl.STATIC_DRAW) {
        let buffer = this.gl.createBuffer();

        // Set buffer initial data
        if (bufferInitialContent != null) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferInitialContent, dataBindingType);
        }

        return buffer;
    }

    /**
     * Read the pixels of the nth attachment in a buffer (assuming RGBA image)
     * @param buffer
     * @param attachmentID in the currently selected buffer
     * @param dimensions Array of type [width, height]
     * @param precision Reading precision of the image (default FLOAT)
     * @return the pixels of the buffer
     */
    readAttachment(buffer, attachmentID, dimensions, precision = this.gl.FLOAT) {
        // Bind buffer
        this.bindFramebuffer(buffer);

        // Read content of the buffer
        this.gl.readBuffer(this.gl.COLOR_ATTACHMENT0 + attachmentID);

        // Read the pixels of the buffer
        let data = new Float32Array(dimensions[0] * dimensions[1] * 4);
        this.gl.readPixels(0, 0, dimensions[0], dimensions[1], this.gl.RGBA, precision, data);
        return data;
    }




    /**
     * Create a new frame buffer
     * @param bufferInitialContent The buffer initial content as a Float32 array (default null)
     * @return The created WebGL frame buffer
     */
    createFrameBuffer(bufferInitialContent = null) {
        let buffer = this.gl.createFramebuffer();

        // Set buffer initial data
        if (bufferInitialContent != null) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferInitialContent, this.gl.STATIC_DRAW);
        }

        return buffer;
    }

    /**
     * Bind a frame buffer to the drawing frame buffers
     * @param buffer 
     */
    bindFramebuffer(buffer) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buffer);
    }




    /**
     * 
     * @param textureDimension Size of the texture in format [width, height]
     * @param textureID Index of the texture (in range 0 - 32)
     * @param storageFormat Storage format of the texture (default RGBA32 float)
     * @param format The displayed format of the texture (default RGBA)
     * @param type Data type of the texture - float or int or uint (default float)
     * @param initalValue Initial data of the texture (default black texture)
     * @return The created WebGL2 texture
     */
    createTexture(textureDimension, textureID, storageFormat = this.gl.RGBA32F, format = this.gl.RGBA, type = this.gl.FLOAT, initalValue = null) {
        // Create texture container
        let textureBuffer = this.gl.createTexture();

        // Set binding ID and storing buffer
        this.gl.activeTexture(this.gl.TEXTURE0 + textureID);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureBuffer);

        // Set texture mimap options
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S    , this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T    , this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        // Create texture 2D
        if (initalValue == null && type == this.gl.FLOAT)
            initalValue = new Float32Array(textureDimension[0] * textureDimension[1] * 4);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, storageFormat, textureDimension[0], textureDimension[1], 0, format, type, initalValue);
    
        return textureBuffer;
    }

    /**
     * Binds a texture at an index in a buffer
     * @param buffer A reference to the buffer
     * @param bindID The ID of the texture to bind to
     * @param texture A reference to the texture
     */
    bindTexture(buffer, bindID, texture) {
        // Select frame buffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buffer);

        // Bind the texture to the buffer
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + bindID, this.gl.TEXTURE_2D, texture, 0);
    }
}
