import { Text } from '@react-three/drei'

export function MedicineTube3D({ medicine, statusColor }) {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.14, 1.02, 32]} />
        <meshPhysicalMaterial color="#f3f0e7" roughness={0.56} clearcoat={0.24} />
      </mesh>
      <mesh position={[0, -0.55, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.14, 24]} />
        <meshStandardMaterial color="#cbd3ce" roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <boxGeometry args={[0.5, 0.07, 0.3]} />
        <meshStandardMaterial color="#d9d4c8" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.02, 0.29]}>
        <planeGeometry args={[0.48, 0.43]} />
        <meshStandardMaterial color={statusColor} roughness={0.55} />
      </mesh>
      <Text position={[0, 0.02, 0.3]} fontSize={0.067} color="white" anchorX="center" anchorY="middle" maxWidth={0.43} textAlign="center">
        {medicine.name.split(' ')[0]}
      </Text>
    </group>
  )
}
