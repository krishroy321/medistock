import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { MedicineBlister3D } from './MedicineBlister3D.jsx'
import { MedicineBottle3D } from './MedicineBottle3D.jsx'
import { MedicineBox3D } from './MedicineBox3D.jsx'
import { MedicineTube3D } from './MedicineTube3D.jsx'
import { MedicineVial3D } from './MedicineVial3D.jsx'
import { getStatus, STATUS_META } from '../../lib/inventory.js'

export function MedicineObject({ medicine, position, selected, onSelect, onHover, reducedMotion, labelWidth }) {
  const group = useRef(null)
  const invalidate = useThree((state) => state.invalidate)
  const form = medicine.form?.toLowerCase()
  const status = getStatus(medicine)
  const statusColor = STATUS_META[status].color
  const product = form === 'capsule'
    ? <MedicineBlister3D medicine={medicine} statusColor={statusColor} />
    : form === 'syrup'
      ? <MedicineBottle3D medicine={medicine} statusColor={statusColor} />
      : form === 'injection'
        ? <MedicineVial3D medicine={medicine} statusColor={statusColor} />
        : form === 'ointment'
          ? <MedicineTube3D medicine={medicine} statusColor={statusColor} />
          : <MedicineBox3D medicine={medicine} statusColor={statusColor} />

  useFrame((_, delta) => {
    if (!group.current) return
    const active = selected || group.current.userData.hovered
    const targetScale = active ? 1.08 : 1
    const targetY = position[1] + (active ? 0.14 : 0)
    if (reducedMotion) {
      group.current.scale.setScalar(targetScale)
      group.current.position.y = targetY
      return
    }
    const factor = Math.min(1, delta * 8)
    const scale = group.current.scale.x + (targetScale - group.current.scale.x) * factor
    const y = group.current.position.y + (targetY - group.current.position.y) * factor
    group.current.scale.setScalar(scale)
    group.current.position.y = y
    if (Math.abs(scale - targetScale) > 0.001 || Math.abs(y - targetY) > 0.002) invalidate()
  })

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
        if (group.current) group.current.userData.hovered = true
        onHover?.(medicine)
        invalidate()
      }}
      onPointerOut={() => {
        if (group.current) group.current.userData.hovered = false
        onHover?.(null)
        invalidate()
      }}
    >
      <group scale={[1, 0.72, 1]}>
        {product}
      </group>
      {selected && <mesh position={[0, 0, 0]} scale={[1.16, 1.12, 1.15]}>
        <boxGeometry args={[0.72, 1.02, 0.5]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.1} wireframe />
      </mesh>}
      <mesh position={[0, -0.67, 0.96]} receiveShadow>
        <boxGeometry args={[labelWidth, 0.38, 0.035]} />
        <meshStandardMaterial color="#ffffff" roughness={0.88} />
      </mesh>
      <mesh position={[labelWidth / 2 - 0.04, -0.67, 0.984]}>
        <boxGeometry args={[0.07, 0.34, 0.012]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
      <Text position={[0, -0.57, 0.99]} fontSize={0.12} color="#17211e" anchorX="center" anchorY="middle" maxWidth={labelWidth - 0.18} lineHeight={0.9} textAlign="center">
        {medicine.name}
      </Text>
      <Text position={[0, -0.76, 0.99]} fontSize={0.096} color="#34423c" anchorX="center" anchorY="middle" maxWidth={labelWidth - 0.18} textAlign="center">
        {`Qty: ${medicine.quantity} · ${STATUS_META[status].label}`}
      </Text>
    </group>
  )
}
