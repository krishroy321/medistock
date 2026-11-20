import { RoundedBox, Text } from '@react-three/drei'

export function MedicineBox3D({ medicine, statusColor }) {
  return (
    <group>
      <RoundedBox args={[0.7, 1.02, 0.46]} radius={0.035} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#f4f0e6" roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 0.06, 0.233]}>
        <planeGeometry args={[0.64, 0.49]} />
        <meshStandardMaterial color={statusColor} roughness={0.62} />
      </mesh>
      <mesh position={[0, -0.36, 0.236]}>
        <planeGeometry args={[0.64, 0.24]} />
        <meshStandardMaterial color="#fbfaf5" roughness={0.8} />
      </mesh>
      <mesh position={[0.352, 0, 0]}>
        <boxGeometry args={[0.012, 0.92, 0.4]} />
        <meshStandardMaterial color="#e3ddcf" roughness={0.8} />
      </mesh>
      <Text position={[0, 0.08, 0.245]} fontSize={0.078} color="white" anchorX="center" anchorY="middle" maxWidth={0.56} textAlign="center">
        {medicine.name.split(' ')[0].toUpperCase()}
      </Text>
      <Text position={[0, -0.36, 0.249]} fontSize={0.056} color="#26332e" anchorX="center" anchorY="middle" maxWidth={0.57} textAlign="center">
        {medicine.strength || medicine.form?.toUpperCase() || 'MEDICINE'}
      </Text>
      <mesh position={[0, 0.512, 0]}>
        <boxGeometry args={[0.58, 0.014, 0.35]} />
        <meshStandardMaterial color="#e0d9c9" roughness={0.82} />
      </mesh>
    </group>
  )
}
