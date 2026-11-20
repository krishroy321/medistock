import { Text } from '@react-three/drei'

export function MedicineBottle3D({ medicine, statusColor }) {
  return (
    <group>
      <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.39, 0.9, 32]} />
        <meshPhysicalMaterial color="#e8f0e9" roughness={0.28} metalness={0.02} clearcoat={0.72} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.2, 0.22, 24]} />
        <meshPhysicalMaterial color="#e8f0e9" roughness={0.3} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, 0.66, 0]} castShadow>
        <cylinderGeometry args={[0.23, 0.23, 0.16, 24]} />
        <meshStandardMaterial color="#315b50" roughness={0.36} />
      </mesh>
      <mesh position={[0, -0.03, 0.365]}>
        <planeGeometry args={[0.58, 0.42]} />
        <meshStandardMaterial color={statusColor} roughness={0.58} />
      </mesh>
      <Text position={[0, 0.02, 0.374]} fontSize={0.076} color="white" anchorX="center" anchorY="middle" maxWidth={0.53} textAlign="center">
        {medicine.name.split(' ').slice(0, 2).join(' ')}
      </Text>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.35, 0.39, 0.07, 32]} />
        <meshStandardMaterial color="#d7dfd9" roughness={0.65} />
      </mesh>
    </group>
  )
}
