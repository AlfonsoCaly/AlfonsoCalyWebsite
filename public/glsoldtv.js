// Inicializar el canvas y el contexto WebGL
const canvas = document.getElementById('glslCanvas');
const gl = canvas.getContext('webgl', { alpha: true });

// Ajustar el tamaño del canvas al tamaño de la ventana
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); // Ajusta el viewport de WebGL
}

// Llamar a la función de redimensionar cuando se cargue la página y cada vez que la ventana cambie de tamaño
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Asegurarnos de ajustar el tamaño inicialmente

// Definir el fragment shader en GLSL (ondas en movimiento)
const fragmentShaderSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;

    // Función para crear ondas horizontales
    float createWave(float y, float time) {
        // Ajusta la frecuencia y velocidad de las ondas
        float frequency = 10.0; // Frecuencia de las ondas (más alto = más ondas)
        float speed = 2.0;      // Velocidad de las ondas

        // Crear la onda usando la función seno
        return sin(y * frequency + time * speed);
    }

    void main() {
        // Convertir la posición en coordenadas normalizadas
        vec2 st = gl_FragCoord.xy / u_resolution;

        // Crear una onda en función de la coordenada Y y el tiempo
        float wave = createWave(st.y, u_time);

        // Usar la onda para variar el color (gris en este caso)
        vec3 color = vec3(0.5 + 0.5 * wave); // Centra el color alrededor de gris

        // Dibujar el color de las ondas
        gl_FragColor = vec4(color, 1.0);
    }
`;

// Crear el shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error al compilar el shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Crear el programa WebGL con el fragment shader
function createProgram(gl, fragmentShaderSource) {
    const vertexShaderSource = `
        attribute vec4 position;
        void main() {
            gl_Position = position;
        }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error al enlazar el programa:', gl.getProgramInfoLog(program));
        return null;
    }

    return program;
}

// Inicializar el programa y los buffers
const program = createProgram(gl, fragmentShaderSource);
gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, 'position');
const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
const timeLocation = gl.getUniformLocation(program, 'u_time');

// Crear el buffer de posición
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 
    1, -1, 
    -1, 1, 
    -1, 1, 
    1, -1, 
    1, 1
]), gl.STATIC_DRAW);

// Configurar el buffer de posición
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Renderizar la animación del fondo
function render(time) {
    // Convertir el tiempo a segundos
    time *= 0.001;

    // Configurar la resolución y el tiempo
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, time);

    // Dibujar
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Repetir
    requestAnimationFrame(render);
}

// Iniciar la animación
requestAnimationFrame(render);