'use client'

import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { Suspense } from 'react'
import { useGLTF, useTexture, Environment, Lightformer, Text, Resize, RenderTexture, PerspectiveCamera, Image } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

const DEFAULT_AVATAR = 'data:image/png;base64,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'

extend({ MeshLineGeometry, MeshLineMaterial })

// Preload assets
useGLTF.preload('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb')

export interface UserData {
  full_name?: string
  company?: string
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
  const textColor = getContrastColor(badgeColor)
  
  const fullName = user?.full_name || 'Official User'
  const email = user?.email || 'user@official.id'
  const whatsapp = user?.whatsapp || '-'
  const link = user?.username ? `official.id/c/${user.username}` : 'official.id'
  const photoUrl = user?.photo_url || DEFAULT_AVATAR

  return (
    <>
      <PerspectiveCamera makeDefault manual aspect={1.05} position={[0.49, 0.22, 2]} />
      <color attach="background" args={[badgeColor]} />
      
      <group position={[-1.2, -1.0, 0]} rotation={[0, Math.PI, Math.PI]}>
        
        <Image 
          url={photoUrl} 
          position={[0, 0.5, 0]} 
          scale={[0.7, 0.7]} 
          transparent 
        />
        
        <Text
          fontSize={0.18}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0]}>
          {fullName}
        </Text>
        
        <Text
            fontSize={0.08}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.2, 0]}>
            {email}
        </Text>
        
        <Text
            fontSize={0.08}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.35, 0]}>
            {whatsapp}
        </Text>
        
        <Text
            fontSize={0.1}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.55, 0]}>
            {link}
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
        <meshLineMaterial color="#ffffff" depthTest={false} resolution={[width, height]} useMap map={texture} repeat={[-0.5, 1]} lineWidth={1} />
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
