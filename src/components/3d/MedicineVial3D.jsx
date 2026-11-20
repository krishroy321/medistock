import { Text } from '@react-three/drei'

export function MedicineVial3D({ medicine, statusColor }) {
  return (
    <group>
      <mesh position={[0, -0.08, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.22, 0.78, 28]} />
        <meshPhysicalMaterial color="#e3ece7" roughness={0.22} metalness={0.02} clearcoat={0.88} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.19, 0.14, 24]} />
        <meshPhysicalMaterial color="#e3ece7" roughness={0.24} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.22, 24]} />
        <meshStandardMaterial color="#b9c3bd" roughness={0.36} metalness={0.18} />
      </mesh>
      <mesh position={[0, -0.08, 0.205]}>
        <planeGeometry args={[0.34, 0.3]} />
        <meshStandardMaterial color={statusColor} roughness={0.56} />
      </mesh>
      <Text position={[0, -0.08, 0.214]} fontSize={0.054} color="white" anchorX="center" anchorY="middle" maxWidth={0.3} textAlign="center">
        {medicine.name.split(' ')[0]}
      </Text>
    </group>
  )
}
