'use client'

import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { Suspense } from 'react'
import { useGLTF, useTexture, Environment, Lightformer, Text, Resize, RenderTexture, PerspectiveCamera } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

extend({ MeshLineGeometry, MeshLineMaterial })

// Preload assets
useGLTF.preload('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb')

export interface UserData {
  full_name?: string
  company?: string
}

export interface Badge3DProps {
  badgeColor?: string
  lanyardColor?: string
  user?: UserData
}

function getContrastColor(hexColor: string) {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#000000' : '#ffffff'
}

// Scene rendering the texture for the badge
function BadgeTexture({ user, badgeColor }: { user?: UserData, badgeColor: string }) {
  const names = (user?.full_name || 'Official ID').split(' ')
  const firstName = names[0]
  const lastName = names.length > 1 ? names.slice(1).join(' ') : ''
  const company = user?.company || 'Official User'
  
  const textColor = getContrastColor(badgeColor)

  return (
    <>
      <PerspectiveCamera makeDefault manual aspect={1.05} position={[0.49, 0.22, 2]} />
      <color attach="background" args={[badgeColor]} />
      
      <group position={[0.49, 0.3, 0]} rotation={[0, Math.PI, Math.PI]}>
        <Text
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
          fontSize={0.25}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0]}>
          {firstName}
        </Text>
        {lastName && (
          <Text
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
            fontSize={0.25}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.3, 0]}>
            {lastName}
          </Text>
        )}
        <Text
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
            fontSize={0.12}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            position={[0, lastName ? -0.65 : -0.35, 0]}>
            {company}
        </Text>
      </group>
    </>
  )
}

function Band({ maxSpeed = 50, minSpeed = 10, badgeColor = '#000000', lanyardColor = '#000000', user }: Badge3DProps & { maxSpeed?: number, minSpeed?: number }) {
  const band = useRef<any>(null), fixed = useRef<any>(null), j1 = useRef<any>(null), j2 = useRef<any>(null), j3 = useRef<any>(null), card = useRef<any>(null)
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3()
  const segmentProps = { type: 'dynamic' as const, canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 }
  
  const { nodes, materials } = useGLTF('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb') as any
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return new THREE.Texture()
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = lanyardColor
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = getContrastColor(lanyardColor)
      context.font = 'bold 80px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('official.id', canvas.width / 2, canvas.height / 2)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [lanyardColor])
  
  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
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

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }
    if (fixed.current) {
      ;[j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
      })
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  // @ts-ignore
  curve.curveType = 'chordal'

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} colliders={false as const} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps} colliders={false as const}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps} colliders={false as const}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps} colliders={false as const}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} colliders={false as const} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => { (e.target as Element).releasePointerCapture(e.pointerId); drag(false); }}
            onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation()))); }}>
            
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial 
                clearcoat={1} 
                clearcoatRoughness={0.15} 
                roughness={0.3} 
                metalness={0.5} 
                color="#ffffff"
              >
                <RenderTexture attach="map" height={2000} width={2000} anisotropy={16}>
                  <BadgeTexture user={user} badgeColor={badgeColor} />
                </RenderTexture>
              </meshPhysicalMaterial>
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
        <meshLineMaterial color="#ffffff" depthTest={false} resolution={[width, height]} useMap map={texture} repeat={[-3, 1]} lineWidth={1} />
      </mesh>
    </>
  )
}

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
