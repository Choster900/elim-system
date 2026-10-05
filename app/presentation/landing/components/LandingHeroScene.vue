<script setup lang="ts">
/**
 * Fondo animado de la portada: una superficie de partículas doradas que ondula como agua
 * (Elim: "doce fuentes de aguas") y motas de luz que suben.
 *
 * Rendimiento: todo el movimiento se calcula en los shaders (la CPU no toca posiciones
 * por cuadro), una sola llamada de dibujo por capa, resolución limitada a 1.5x, y la
 * animación se pausa fuera de pantalla o con la pestaña oculta. Con
 * `prefers-reduced-motion` se dibuja un único cuadro estático.
 */
const canvasRef = ref<HTMLCanvasElement | null>(null)
let teardown: (() => void) | null = null
let isUnmounted = false

const WAVE_VERTEX = `
uniform float uTime;
uniform float uPixelRatio;
attribute float aScale;
varying float vAlpha;
void main() {
    vec3 p = position;
    float w = sin(p.x * 0.32 + uTime * 0.55) * 0.55
            + sin(p.z * 0.46 + uTime * 0.42) * 0.42
            + sin((p.x + p.z) * 0.18 + uTime * 0.28) * 0.5;
    p.y += w;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * (30.0 / -mv.z) * uPixelRatio;
    float far = smoothstep(-40.0, -7.0, mv.z) * (1.0 - smoothstep(-5.0, -1.5, mv.z));
    vAlpha = far * (0.32 + 0.5 * clamp(w * 0.55 + 0.5, 0.0, 1.0));
}`

const MOTE_VERTEX = `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSeed;
varying float vAlpha;
void main() {
    vec3 p = position;
    float rise = mod(p.y + uTime * (0.18 + aSeed * 0.25), 10.0);
    p.y = -1.5 + rise;
    p.x += sin(uTime * 0.35 + aSeed * 6.2831) * 0.6;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.2 + aSeed * 2.2) * (26.0 / -mv.z) * uPixelRatio;
    float life = smoothstep(0.0, 1.5, rise) * (1.0 - smoothstep(6.5, 10.0, rise));
    vAlpha = life * (0.25 + 0.45 * aSeed) * smoothstep(-26.0, -6.0, mv.z);
}`

const POINT_FRAGMENT = (whiten: number) => `
uniform vec3 uColor;
varying float vAlpha;
void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(mix(uColor, vec3(1.0), ${whiten.toFixed(2)}), a * vAlpha);
}`

function themeAccent() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    return value || '#e9c176'
}

async function initScene(canvas: HTMLCanvasElement) {
    const THREE = await import('three')
    if (isUnmounted) return

    const host = canvas.parentElement
    if (!host) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isSmallScreen = window.innerWidth < 640
    // En pantallas chicas basta con menos puntos: se ven igual y cuestan la mitad.
    const density = isSmallScreen ? 0.55 : 1

    let renderer: import('three').WebGLRenderer
    try {
        renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
            powerPreference: 'low-power',
        })
    } catch {
        // Sin WebGL la portada se queda con su fondo estático.
        return
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
    renderer.setPixelRatio(pixelRatio)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80)
    const lookTarget = new THREE.Vector3(0, -0.4, -9)
    const uniforms = {
        uTime: { value: reduceMotion ? 2.4 : 0 },
        uColor: { value: new THREE.Color(themeAccent()) },
        uPixelRatio: { value: pixelRatio },
    }

    const cols = Math.round(150 * Math.sqrt(density))
    const rows = Math.round(72 * Math.sqrt(density))
    const wavePositions = new Float32Array(cols * rows * 3)
    const waveScales = new Float32Array(cols * rows)
    let index = 0
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            wavePositions[index * 3] = (col / (cols - 1) - 0.5) * 56 + (Math.random() - 0.5) * 0.12
            wavePositions[index * 3 + 1] = -1.7
            wavePositions[index * 3 + 2] = 6 - (row / (rows - 1)) * 42
            waveScales[index] = 0.55 + Math.random() * 0.75
            index++
        }
    }
    const waveGeometry = new THREE.BufferGeometry()
    waveGeometry.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3))
    waveGeometry.setAttribute('aScale', new THREE.BufferAttribute(waveScales, 1))
    const waveMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: WAVE_VERTEX,
        fragmentShader: POINT_FRAGMENT(0),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })
    scene.add(new THREE.Points(waveGeometry, waveMaterial))

    const moteCount = Math.round(200 * density)
    const motePositions = new Float32Array(moteCount * 3)
    const moteSeeds = new Float32Array(moteCount)
    for (let mote = 0; mote < moteCount; mote++) {
        motePositions[mote * 3] = (Math.random() - 0.5) * 30
        motePositions[mote * 3 + 1] = Math.random() * 10
        motePositions[mote * 3 + 2] = -16 + Math.random() * 18
        moteSeeds[mote] = Math.random()
    }
    const moteGeometry = new THREE.BufferGeometry()
    moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3))
    moteGeometry.setAttribute('aSeed', new THREE.BufferAttribute(moteSeeds, 1))
    const moteMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: MOTE_VERTEX,
        fragmentShader: POINT_FRAGMENT(0.25),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })
    scene.add(new THREE.Points(moteGeometry, moteMaterial))

    const pointer = { x: 0, y: 0 }
    const eased = { x: 0, y: 0 }
    let cameraZ = 10
    let running = false
    let isVisible = true
    let frameId = 0
    let lastTime = 0

    function renderFrame() {
        eased.x += (pointer.x - eased.x) * 0.04
        eased.y += (pointer.y - eased.y) * 0.04
        camera.position.set(eased.x * 1.2, 3.2 - eased.y * 0.5, cameraZ)
        camera.lookAt(lookTarget)
        renderer.render(scene, camera)
    }

    function tick(now: number) {
        if (!running) return
        const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016
        lastTime = now
        uniforms.uTime.value += delta
        renderFrame()
        frameId = requestAnimationFrame(tick)
    }

    function start() {
        if (running || reduceMotion || !isVisible || document.hidden) return
        running = true
        lastTime = 0
        frameId = requestAnimationFrame(tick)
    }

    function stop() {
        running = false
        cancelAnimationFrame(frameId)
    }

    function resize() {
        const width = host!.clientWidth || 1
        const height = host!.clientHeight || 1
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        cameraZ = width < 640 ? 13 : width < 1024 ? 11.5 : 10
        camera.updateProjectionMatrix()
        if (!running) renderFrame()
    }

    function onPointerMove(event: PointerEvent) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1
        pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }

    function onVisibilityChange() {
        if (document.hidden) stop()
        else start()
    }

    const intersection = new IntersectionObserver(
        ([entry]) => {
            isVisible = entry?.isIntersecting ?? true
            if (isVisible) start()
            else stop()
        },
        { threshold: 0.01 },
    )
    intersection.observe(host)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    document.addEventListener('visibilitychange', onVisibilityChange)
    if (!reduceMotion) window.addEventListener('pointermove', onPointerMove, { passive: true })

    resize()
    start()

    teardown = () => {
        stop()
        intersection.disconnect()
        resizeObserver.disconnect()
        document.removeEventListener('visibilitychange', onVisibilityChange)
        window.removeEventListener('pointermove', onPointerMove)
        waveGeometry.dispose()
        waveMaterial.dispose()
        moteGeometry.dispose()
        moteMaterial.dispose()
        renderer.dispose()
    }
}

onMounted(() => {
    if (canvasRef.value) void initScene(canvasRef.value)
})

onBeforeUnmount(() => {
    isUnmounted = true
    teardown?.()
    teardown = null
})
</script>

<template>
    <canvas
        ref="canvasRef"
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 block size-full"
    />
</template>
