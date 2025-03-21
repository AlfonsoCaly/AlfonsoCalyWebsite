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

// Definir el fragment shader en GLSL 
const fragmentShaderSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;

    // Función para crear una onda suave
    float createWave(float y, float time, float frequency, float amplitude, float speed, float phase) {
        // Crear una onda sinusoidal suave con fase para controlar el desplazamiento
        return amplitude * sin(y * frequency + time * speed + phase);
    }

    void main() {
        // Convertir la posición en coordenadas normalizadas
        vec2 st = gl_FragCoord.xy / u_resolution;

        // Definir tres posiciones Y para las tres líneas
        float line1 = 0.3;  // Línea superior
        float line2 = 0.5;  // Línea media
        float line3 = 0.7;  // Línea inferior

        // Parámetros de frecuencia, amplitud y velocidad para las líneas
        float freq1 = 4.0, amp1 = 0.05, speed1 = 0.5, phase1 = 0.0;  // Parámetros para la primera línea
        float freq2 = 6.0, amp2 = 0.04, speed2 = 0.4, phase2 = 1.0;  // Parámetros para la segunda línea
        float freq3 = 5.0, amp3 = 0.06, speed3 = 0.3, phase3 = 2.0;  // Parámetros para la tercera línea

        // Crear ondas suaves para cada línea con parámetros personalizados
        float wave1 = createWave(st.x, u_time, freq1, amp1, speed1, phase1);
        float wave2 = createWave(st.x, u_time, freq2, amp2, speed2, phase2);
        float wave3 = createWave(st.x, u_time, freq3, amp3, speed3, phase3);

        // Controlar el grosor de las líneas
        float thickness = 0.005; // Líneas delgadas y suaves

        // Determinar el color de las líneas (blanco para las líneas)
        vec3 lineColor = vec3(0.54,0.55,0.54);  // Color blanco brillante para las líneas

        // Brillo alrededor de las líneas
        vec3 glowColor = vec3(0.0); // Un tono brillante para el resplandor (actualmente esta en 0)

        // Mezcla de colores de fondo
        vec3 backgroundColor = vec3(0.0); // Fondo negro de base

        // Determinar la distancia de las líneas
        float dist1 = abs(st.y - (line1 + wave1));
        float dist2 = abs(st.y - (line2 + wave2));
        float dist3 = abs(st.y - (line3 + wave3));

        // Suavizar las transiciones para las líneas con brillo, ajustando los valores para eliminar espacios negros
        float line1Glow = smoothstep(thickness * 1.0, thickness * 2.5, dist1); // Ajustar el rango de brillo para la línea 1
        float line2Glow = smoothstep(thickness * 1.0, thickness * 2.5, dist2); // Ajustar el rango de brillo para la línea 2
        float line3Glow = smoothstep(thickness * 1.0, thickness * 2.5, dist3); // Ajustar el rango de brillo para la línea 3

        // Calcular el color final mezclando la línea y el brillo
        vec3 finalColor = backgroundColor;

        // Lógica para la primera línea con brillo
        if (dist1 < thickness) {
            finalColor = mix(finalColor, lineColor, 1.0 - dist1 / thickness); // Suavizar la línea
        } else if (dist1 < thickness * 2.5) {
            finalColor = mix(finalColor, glowColor, 1.0 - line1Glow); // Aplicar el brillo sin dejar espacio negro
        }

        // Lógica para la segunda línea con brillo
        if (dist2 < thickness) {
            finalColor = mix(finalColor, lineColor, 1.0 - dist2 / thickness); // Suavizar la línea
        } else if (dist2 < thickness * 2.5) {
            finalColor = mix(finalColor, glowColor, 1.0 - line2Glow); // Aplicar el brillo sin dejar espacio negro
        }

        // Lógica para la tercera línea con brillo
        if (dist3 < thickness) {
            finalColor = mix(finalColor, lineColor, 1.0 - dist3 / thickness); // Suavizar la línea
        } else if (dist3 < thickness * 2.5) {
            finalColor = mix(finalColor, glowColor, 1.0 - line3Glow); // Aplicar el brillo sin dejar espacio negro
        }

        // Dibujar el color final en la pantalla
        gl_FragColor = vec4(finalColor, 1.0);
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