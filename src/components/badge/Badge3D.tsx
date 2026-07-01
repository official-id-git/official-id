'use client'

import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { Suspense } from 'react'
import { useGLTF, Environment, Lightformer } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

extend({ MeshLineGeometry, MeshLineMaterial })

useGLTF.preload('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb')

export interface UserData {
  full_name?: string
  company?: string
  job_title?: string
  photo_url?: string
  username?: string
  email?: string
  whatsapp?: string
}

export interface Badge3DProps {
  badgeColor?: string
  lanyardColor?: string
  user?: UserData
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getContrastColor(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000000' : '#ffffff'
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

// ─────────────────────────────────────────────────────────────────────────────
// Build badge face as a CanvasTexture — no Html overlay, no positioning bugs
// ─────────────────────────────────────────────────────────────────────────────
function useBadgeTexture(user: UserData | undefined, badgeColor: string): THREE.CanvasTexture {
  const [texture, setTexture] = useState<THREE.CanvasTexture>(() => {
    const c = typeof document !== 'undefined' ? document.createElement('canvas') : null
    if (c) { c.width = 512; c.height = 720 }
    return new THREE.CanvasTexture(c || document.createElement('canvas'))
  })

  useEffect(() => {
    if (typeof document === 'undefined') return

    const W = 512
    const H = 720
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fg = getContrastColor(badgeColor)
    const fgAlpha = (a: number) => {
      const c = fg === '#ffffff' ? '255,255,255' : '0,0,0'
      return `rgba(${c},${a})`
    }

    const draw = (photoImg: HTMLImageElement | null) => {
      // Background
      ctx.fillStyle = badgeColor
      ctx.fillRect(0, 0, W, H)

      // ── Brand ──
      ctx.fillStyle = fg
      ctx.font = 'bold 26px Arial, Helvetica, sans-serif'
      ctx.textAlign = 'center'
      ctx.globalAlpha = 0.95
      ctx.fillText('OFFICIAL.ID', W / 2, 52)

      ctx.font = '12px Arial, Helvetica, sans-serif'
      ctx.globalAlpha = 0.45
      ctx.letterSpacing = '4px'
      ctx.fillText('DIGITAL BUSINESS CARD', W / 2, 76)
      ctx.letterSpacing = '0px'
      ctx.globalAlpha = 1

      // Thin divider
      ctx.strokeStyle = fgAlpha(0.15)
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(40, 96); ctx.lineTo(W - 40, 96); ctx.stroke()

      // ── Photo ──
      const phR = 70      // radius
      const phX = W / 2
      const phY = 225

      // Border ring
      ctx.beginPath()
      ctx.arc(phX, phY, phR + 5, 0, Math.PI * 2)
      ctx.strokeStyle = fgAlpha(0.9)
      ctx.lineWidth = 4
      ctx.stroke()

      ctx.save()
      ctx.beginPath()
      ctx.arc(phX, phY, phR, 0, Math.PI * 2)
      ctx.clip()
      if (photoImg) {
        // cover-fit into the circle
        const ar = photoImg.naturalWidth / photoImg.naturalHeight
        let sx = 0, sy = 0, sw = photoImg.naturalWidth, sh = photoImg.naturalHeight
        if (ar > 1) { sw = photoImg.naturalHeight; sx = (photoImg.naturalWidth - sw) / 2 }
        else        { sh = photoImg.naturalWidth;  sy = (photoImg.naturalHeight - sh) / 2 }
        ctx.drawImage(photoImg, sx, sy, sw, sh, phX - phR, phY - phR, phR * 2, phR * 2)
      } else {
        ctx.fillStyle = fgAlpha(0.15)
        ctx.fillRect(phX - phR, phY - phR, phR * 2, phR * 2)
        ctx.font = '60px Arial'
        ctx.textAlign = 'center'
        ctx.fillStyle = fgAlpha(0.5)
        ctx.fillText('👤', phX, phY + 22)
      }
      ctx.restore()

      // ── Name ──
      ctx.fillStyle = fg
      ctx.font = 'bold 36px Arial, Helvetica, sans-serif'
      ctx.textAlign = 'center'
      ctx.globalAlpha = 0.97
      const nameLines = wrapText(ctx, user?.full_name || 'Official User', W - 60)
      nameLines.forEach((line, i) => ctx.fillText(line, W / 2, 320 + i * 42))

      // ── Job / Company ──
      const subtitle = user?.job_title || user?.company || ''
      if (subtitle) {
        ctx.font = '18px Arial, Helvetica, sans-serif'
        ctx.globalAlpha = 0.72
        ctx.fillText(subtitle, W / 2, 320 + nameLines.length * 42 + 4)
      }

      // ── Contact info ──
      ctx.font = '15px Arial, Helvetica, sans-serif'
      ctx.globalAlpha = 0.75
      let contactY = 320 + nameLines.length * 42 + (subtitle ? 36 : 14)
      if (user?.email)    { ctx.fillText(user.email,    W / 2, contactY); contactY += 24 }
      if (user?.whatsapp) { ctx.fillText(user.whatsapp, W / 2, contactY) }

      ctx.globalAlpha = 1

      // Bottom divider
      ctx.strokeStyle = fgAlpha(0.12)
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(40, H - 68); ctx.lineTo(W - 68, H - 68); ctx.stroke()

      // URL
      ctx.font = 'bold 13px "Courier New", monospace'
      ctx.textAlign = 'left'
      ctx.globalAlpha = 0.75
      ctx.fillStyle = fg
      const url = user?.username ? `official.id/c/${user.username}` : 'official.id'
      ctx.fillText(url, 40, H - 40)
      ctx.globalAlpha = 1

      // Status dot (green)
      const dotX = W - 46, dotY = H - 46
      ctx.shadowColor = '#10b981'; ctx.shadowBlur = 14
      ctx.beginPath(); ctx.arc(dotX, dotY, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#10b981'; ctx.fill()
      ctx.shadowBlur = 0

      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
      setTexture(tex)
    }

    if (user?.photo_url) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => draw(img)
      img.onerror = () => draw(null)
      // Use the existing proxy to avoid CORS with WebGL texture loading
      img.src = `/api/kta/proxy-image?url=${encodeURIComponent(user.photo_url)}`
    } else {
      draw(null)
    }
  }, [
    user?.full_name,
    user?.job_title,
    user?.company,
    user?.email,
    user?.whatsapp,
    user?.photo_url,
    user?.username,
    badgeColor,
  ])

  return texture
}

// ─────────────────────────────────────────────────────────────────────────────
// Physics Band component
// ─────────────────────────────────────────────────────────────────────────────
function Band({
  maxSpeed = 50,
  minSpeed = 10,
  badgeColor = '#000000',
  lanyardColor = '#000000',
  user,
}: Badge3DProps & { maxSpeed?: number; minSpeed?: number }) {
  const band = useRef<any>(null),
    fixed = useRef<any>(null),
    j1 = useRef<any>(null),
    j2 = useRef<any>(null),
    j3 = useRef<any>(null),
    card = useRef<any>(null)
  const vec = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3(),
    dir = new THREE.Vector3()

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const segmentProps = {
    type: 'dynamic' as const,
    canSleep: false,
    colliders: false as const,
    angularDamping: isTouch ? 1.0 : 2,
    linearDamping: isTouch ? 1.0 : 2,
  }

  const { nodes, materials } = useGLTF(
    'https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb'
  ) as any

  // Badge face as a canvas texture — always pixel-perfect, no CSS offset
  const badgeTexture = useBadgeTexture(user, badgeColor)

  const lanyardTexture = useMemo(() => {
    if (typeof document === 'undefined') return new THREE.Texture()
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = lanyardColor
      ctx.fillRect(0, 0, 512, 64)
      ctx.fillStyle = getContrastColor(lanyardColor)
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('official.id', 256, 32)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [lanyardColor])

  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([
      new THREE.Vector3(), new THREE.Vector3(),
      new THREE.Vector3(), new THREE.Vector3(),
    ])
  )
  const [dragged, drag] = useState<THREE.Vector3 | false>(false)
  const [hovered, hover] = useState(false)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => void (document.body.style.cursor = 'auto')
    }
  }, [hovered, dragged])

  // ── Shake detection (mobile/tablet) ──────────────────────────────────────
  useEffect(() => {
    if (!isTouch) return
    let lastShake = 0

    const shake = () => {
      if (!card.current) return
      ;[card, j1, j2, j3].forEach(r => r.current?.wakeUp?.())
      card.current.applyImpulse({ x: (Math.random() - 0.5) * 20, y: 7 + Math.random() * 4, z: (Math.random() - 0.5) * 8 }, true)
      j3.current?.applyImpulse({ x: (Math.random() - 0.5) * 6, y: 2, z: 0 }, true)
    }

    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (!a) return
      const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2)
      const now = Date.now()
      if (mag > 22 && now - lastShake > 600) { lastShake = now; shake() }
    }

    const listen = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const p = await (DeviceMotionEvent as any).requestPermission()
          if (p === 'granted') window.addEventListener('devicemotion', onMotion)
        } catch (_) {}
      } else {
        window.addEventListener('devicemotion', onMotion)
      }
    }
    listen()
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [isTouch])

  // ── Gyroscope tilt (mobile/tablet) ────────────────────────────────────────
  const tiltRef = useRef({ x: 0, z: 0 })
  useEffect(() => {
    if (!isTouch) return
    const onOrient = (e: DeviceOrientationEvent) => {
      tiltRef.current = { x: ((e.gamma || 0) / 90) * 3, z: ((e.beta || 0) / 180) * 2 }
    }
    const listen = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const p = await (DeviceOrientationEvent as any).requestPermission()
          if (p === 'granted') window.addEventListener('deviceorientation', onOrient)
        } catch (_) {}
      } else {
        window.addEventListener('deviceorientation', onOrient)
      }
    }
    listen()
    return () => window.removeEventListener('deviceorientation', onOrient)
  }, [isTouch])

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach(r => r.current?.wakeUp())
      card.current?.setNextKinematicTranslation({
        x: vec.x - (dragged as THREE.Vector3).x,
        y: vec.y - (dragged as THREE.Vector3).y,
        z: vec.z - (dragged as THREE.Vector3).z,
      })
    }

    if (fixed.current) {
      // Rope smoothing
      ;[j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const d = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + d * (maxSpeed - minSpeed)))
      })
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))

      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })

      // Soft centering spring — keeps badge at x≈0 regardless of canvas size
      if (!dragged) {
        const pos = card.current.translation()
        if (Math.abs(pos.x) > 0.01) {
          card.current.wakeUp?.()
          card.current.applyImpulse({ x: -pos.x * 2.5, y: 0, z: 0 }, true)
        }
      }

      // Gyroscope tilt force
      if (isTouch && !dragged) {
        const { x: tx, z: tz } = tiltRef.current
        if (Math.abs(tx) > 0.05 || Math.abs(tz) > 0.05) {
          card.current.wakeUp?.()
          card.current.applyImpulse({ x: tx * delta * 0.6, y: 0, z: tz * delta * 0.6 }, false)
        }
      }
    }
  })

  // @ts-ignore
  curve.curveType = 'chordal'

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed"><mesh /></RigidBody>
        {/* Start joints vertically below fixed point so badge hangs centered from frame 1 */}
        <RigidBody position={[0, -1, 0]} ref={j1} {...segmentProps}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[0, -2, 0]} ref={j2} {...segmentProps}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[0, -3, 0]} ref={j3} {...segmentProps}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody
          position={[0, -4.45, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => { ;(e.target as Element).releasePointerCapture(e.pointerId); drag(false) }}
            onPointerDown={e => {
              ;(e.target as Element).setPointerCapture(e.pointerId)
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={badgeTexture}
                clearcoat={0.8}
                clearcoatRoughness={0.2}
                roughness={0.35}
                metalness={0.1}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>

      <mesh ref={band}>
        {/* @ts-ignore */}
        <meshLineGeometry />
        {/* @ts-ignore */}
        <meshLineMaterial
          color="#ffffff"
          depthTest={false}
          resolution={[width, height]}
          useMap
          map={lanyardTexture}
          repeat={[-3, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────
export default function Badge3D({ badgeColor = '#000000', lanyardColor = '#000000', user }: Badge3DProps) {
  return (
    <div className="w-full h-full relative" style={{ touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 0, 13], fov: 25 }}>
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
            <Band badgeColor={badgeColor} lanyardColor={lanyardColor} user={user} />
          </Physics>
          <Environment background blur={0.75}>
            <color attach="background" args={['#111111']} />
            <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  )
}
