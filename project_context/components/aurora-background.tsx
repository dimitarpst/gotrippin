"use client"

import { useEffect, useRef } from "react"
import { Renderer, Camera, Transform, Mesh, Program, Geometry } from "ogl"

interface AuroraBackgroundProps {
  speed?: number
  colorStops?: [string, string, string]
  amplitude?: number
  className?: string
}

export function AuroraBackground({
  speed = 1.0,
  colorStops = ["#3A29FF", "#FF94B4", "#FF3232"],
  amplitude = 1.0,
  className = "",
}: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const renderer = new Renderer({ canvas, alpha: true })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)

    const camera = new Camera(gl, { fov: 45 })
    camera.position.z = 5

    const scene = new Transform()

    const geometry = new Geometry(gl, {
      position: { size: 3, data: new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
    })

    const vertex = /* glsl */ `
      attribute vec2 uv;
      attribute vec3 position;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `

    const fragment = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform float uAmplitude;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        float time = uTime * 0.5;
        
        // Create flowing aurora effect
        float wave1 = sin(uv.x * 3.0 + time) * cos(uv.y * 2.0 + time * 0.5) * uAmplitude;
        float wave2 = sin(uv.x * 2.0 - time * 0.7) * cos(uv.y * 3.0 - time * 0.3) * uAmplitude;
        float wave3 = sin(uv.x * 4.0 + time * 0.5) * cos(uv.y * 1.5 + time) * uAmplitude;
        
        float pattern = (wave1 + wave2 + wave3) * 0.5 + 0.5;
        
        // Mix colors based on pattern
        vec3 color = mix(uColor1, uColor2, pattern);
        color = mix(color, uColor3, sin(pattern * 3.14159) * 0.5 + 0.5);
        
        // Add some glow
        float glow = smoothstep(0.3, 0.7, pattern);
        color += glow * 0.2;
        
        gl_FragColor = vec4(color, 0.6);
      }
    `

    // Convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? [
            Number.parseInt(result[1], 16) / 255,
            Number.parseInt(result[2], 16) / 255,
            Number.parseInt(result[3], 16) / 255,
          ]
        : [0, 0, 0]
    }

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: hexToRgb(colorStops[0]) },
        uColor2: { value: hexToRgb(colorStops[1]) },
        uColor3: { value: hexToRgb(colorStops[2]) },
        uAmplitude: { value: amplitude },
      },
      transparent: true,
    })

    const mesh = new Mesh(gl, { geometry, program })
    mesh.setParent(scene)

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height })
    }
    window.addEventListener("resize", resize)
    resize()

    let animationId: number
    const animate = (t: number) => {
      animationId = requestAnimationFrame(animate)
      program.uniforms.uTime.value = t * 0.001 * speed
      renderer.render({ scene, camera })
    }
    animate(0)

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
      renderer.gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [speed, colorStops, amplitude])

  return (
    <canvas ref={canvasRef} className={`fixed inset-0 -z-10 ${className}`} style={{ width: "100%", height: "100%" }} />
  )
}
