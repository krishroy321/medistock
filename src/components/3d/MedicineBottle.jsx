import { Text } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getStatus, STATUS_META } from '../../lib/inventory.js'

export function MedicineBottle({ medicine, position = [0, 0, 0], selected, onSelect, onHover }) {
  const group = useRef()
  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * (selected ? 0.22 : 0.06)
    group.current.position.y = position[1] + Math.sin(Date.now() * 0.001 + position[0]) * 0.018
  })

  const form = medicine.form?.toLowerCase()
  const boxForm = ['tablet', 'capsule', 'supply'].includes(form)
  const injection = form === 'injection'
  const ointment = form === 'ointment'
  const faceZ = injection ? 0.23 : 0.38
  const statusColor = STATUS_META[getStatus(medicine)].color
  const displayName = medicine.name.split(' ')[0]

  return (
    <group
      ref={group}
      position={position}
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.(medicine, position)
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        onHover?.(medicine)
      }}
      onPointerOut={() => onHover?.(null)}
    >
      {boxForm ? (
        <>
          <mesh castShadow>
            <boxGeometry args={[0.72, 1.02, 0.5]} />
            <meshStandardMaterial color="#f4f3ec" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.02, 0.253]}>
            <planeGeometry args={[0.66, 0.5]} />
            <meshStandardMaterial color={statusColor} roughness={0.58} />
          </mesh>
          <mesh position={[0, -0.37, 0.257]}>
            <planeGeometry args={[0.66, 0.18]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          <Text position={[0, 0.05, 0.265]} fontSize={0.075} color="white" anchorX="center" anchorY="middle" maxWidth={0.58} textAlign="center">
            {displayName}
          </Text>
          <Text position={[0, -0.37, 0.269]} fontSize={0.052} color="#26332e" anchorX="center" anchorY="middle" maxWidth={0.58} textAlign="center">
            {medicine.quantity} units
          </Text>
        </>
      ) : (
        <>
          <mesh castShadow>
            <cylinderGeometry args={injection ? [0.23, 0.25, 0.95, 32] : ointment ? [0.2, 0.34, 1.12, 32] : [0.34, 0.4, 1.12, 32]} />
            <meshPhysicalMaterial color={injection ? '#e5eee9' : ointment ? '#f5f0e5' : '#f0f3ef'} roughness={0.3} metalness={0.03} clearcoat={0.5} />
          </mesh>
          <mesh position={[0, -0.02, faceZ]}>
            <planeGeometry args={[injection ? 0.42 : 0.58, 0.42]} />
            <meshStandardMaterial color={statusColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, ointment ? -0.63 : 0.63, 0]}>
            <cylinderGeometry args={injection ? [0.19, 0.19, 0.2, 24] : ointment ? [0.11, 0.14, 0.2, 24] : [0.22, 0.22, 0.2, 24]} />
            <meshStandardMaterial color={injection ? '#bfcac4' : ointment ? '#d9dfd9' : '#184f47'} roughness={0.3} metalness={0.12} />
          </mesh>
          <Text position={[0, -0.02, faceZ + 0.012]} fontSize={0.065} color="white" anchorX="center" anchorY="middle" maxWidth={0.5} textAlign="center">
            {displayName}
          </Text>
        </>
      )}
      {selected && (
        <mesh scale={boxForm ? [1.12, 1.08, 1.12] : [1.25, 1.12, 1.25]}>
          {boxForm
            ? <boxGeometry args={[0.72, 1.02, 0.5]} />
            : <cylinderGeometry args={[0.4, 0.42, 1.12, 32]} />}
          <meshBasicMaterial color={statusColor} transparent opacity={0.14} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  )
}
