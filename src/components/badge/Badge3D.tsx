'use client'

import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { Suspense } from 'react'
import { useGLTF, Environment, Lightformer, Html } from '@react-three/drei'
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
function getContrastColor(hexColor: string) {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#000000' : '#ffffff'
}

// ─────────────────────────────────────────────────────────────────────────────
// Physics Band component — modelled after musiconic reference implementation
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
    canSleep: true,
    colliders: false as const,
    angularDamping: isTouch ? 1.2 : 2,
    linearDamping: isTouch ? 1.2 : 2,
  }

  const { nodes, materials } = useGLTF(
    'https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb'
  ) as any

  // ── Lanyard canvas texture ──────────────────────────────────────────────────
  const lanyardTexture = useMemo(() => {
    if (typeof document === 'undefined') return new THREE.Texture()
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = lanyardColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = getContrastColor(lanyardColor)
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('official.id', canvas.width / 2, canvas.height / 2)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [lanyardColor])

  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  )
  const [dragged, drag] = useState<THREE.Vector3 | false>(false)
  const [hovered, hover] = useState(false)

  // Rope joints
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])

  // Cursor
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => void (document.body.style.cursor = 'auto')
    }
  }, [hovered, dragged])

  // ── Shake detection (mobile/tablet) ───────────────────────────────────────
  useEffect(() => {
    if (!isTouch) return
    let lastShakeTime = 0

    const applyShake = () => {
      if (!card.current) return
      ;[card, j1, j2, j3].forEach((ref) => ref.current?.wakeUp?.())
      card.current.applyImpulse(
        {
          x: (Math.random() - 0.5) * 20,
          y: 7 + Math.random() * 4,
          z: (Math.random() - 0.5) * 8,
        },
        true
      )
      j3.current?.applyImpulse({ x: (Math.random() - 0.5) * 6, y: 2, z: 0 }, true)
    }

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2)
      const now = Date.now()
      if (magnitude > 22 && now - lastShakeTime > 600) {
        lastShakeTime = now
        applyShake()
      }
    }

    const requestAndListen = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const perm = await (DeviceMotionEvent as any).requestPermission()
          if (perm === 'granted') window.addEventListener('devicemotion', handleMotion)
        } catch (_) {}
      } else {
        window.addEventListener('devicemotion', handleMotion)
      }
    }
    requestAndListen()
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [isTouch])

  // ── Gyroscope tilt (mobile/tablet) ────────────────────────────────────────
  const tiltRef = useRef({ x: 0, z: 0 })
  useEffect(() => {
    if (!isTouch) return

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gx = ((e.gamma || 0) / 90) * 2.5
      const gz = ((e.beta || 0) / 180) * 1.5
      tiltRef.current = { x: gx, z: gz }
    }

    const requestAndListen = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const perm = await (DeviceOrientationEvent as any).requestPermission()
          if (perm === 'granted') window.addEventListener('deviceorientation', handleOrientation)
        } catch (_) {}
      } else {
        window.addEventListener('deviceorientation', handleOrientation)
      }
    }
    requestAndListen()
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [isTouch])

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({
        x: vec.x - (dragged as THREE.Vector3).x,
        y: vec.y - (dragged as THREE.Vector3).y,
        z: vec.z - (dragged as THREE.Vector3).z,
      })
    }

    if (fixed.current) {
      // Smooth rope
      ;[j1, j2].forEach((ref) => {
        if (!ref.current.lerped)
          ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, ref.current.lerped.distanceTo(ref.current.translation()))
        )
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        )
      })
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))

      // Y-rotation damping
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })

      // Gyroscope tilt force
      if (isTouch && !dragged && (Math.abs(tiltRef.current.x) > 0.05 || Math.abs(tiltRef.current.z) > 0.05)) {
        card.current.wakeUp?.()
        card.current.applyImpulse(
          { x: tiltRef.current.x * delta * 0.8, y: 0, z: tiltRef.current.z * delta * 0.8 },
          false
        )
      }
    }
  })

  // @ts-ignore
  curve.curveType = 'chordal'

  const textColor = getContrastColor(badgeColor)
  const photoUrl = user?.photo_url || ''
  const fullName = user?.full_name || 'Official User'
  const company = user?.company || ''
  const jobTitle = user?.job_title || ''
  const email = user?.email || ''
  const whatsapp = user?.whatsapp || ''
  const subtitle = jobTitle || company || 'Official.id'
  const publicUrl = user?.username ? `official.id/c/${user.username}` : 'official.id'

  const badgeContent = (
    <div
      style={{
        width: '420px',
        height: '650px',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: textColor,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        background: 'transparent',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {/* TOP: brand */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.9 }}>
          OFFICIAL.ID
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '3px', opacity: 0.5, marginTop: '4px', textTransform: 'uppercase' }}>
          Digital Business Card
        </div>
      </div>

      {/* MIDDLE: photo + info */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
        {photoUrl ? (
          <img
            src={`/api/kta/proxy-image?url=${encodeURIComponent(photoUrl)}`}
            alt="Profile"
            crossOrigin="anonymous"
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `5px solid ${textColor}`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            }}
          />
        ) : (
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(128,128,128,0.3)',
              border: `5px solid ${textColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            }}
          >
            <span style={{ fontSize: '72px' }}>👤</span>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: 900, lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            {fullName}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '8px', opacity: 0.75 }}>
            {subtitle}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', opacity: 0.8 }}>
            {email && <div>{email}</div>}
            {whatsapp && <div>{whatsapp}</div>}
          </div>
        </div>
      </div>

      {/* BOTTOM: URL + status */}
      <div
        style={{
          width: '100%',
          borderTop: `1px solid ${textColor}44`,
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '15px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', opacity: 0.8 }}>
          {publicUrl}
        </span>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
      </div>
    </div>
  )

  return (
    <>
      {/* Physics bodies — starts off to the right and swings into center (musiconic pattern) */}
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed">
          <mesh />
        </RigidBody>
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
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
            onPointerUp={(e) => {
              ;(e.target as Element).releasePointerCapture(e.pointerId)
              drag(false)
            }}
            onPointerDown={(e) => {
              ;(e.target as Element).setPointerCapture(e.pointerId)
              drag(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vec.copy(card.current.translation()))
              )
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                color={badgeColor}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.0}
              />
              {/* Front face — NO center prop, matches musiconic exactly */}
              <Html transform position={[0, 0.48, 0.015]} rotation={[0, 0, 0]} scale={0.055} occlude>
                {badgeContent}
              </Html>
              {/* Back face */}
              <Html transform position={[0, 0.48, -0.015]} rotation={[0, Math.PI, 0]} scale={0.055} occlude>
                {badgeContent}
              </Html>
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>

      {/* Lanyard rope */}
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
