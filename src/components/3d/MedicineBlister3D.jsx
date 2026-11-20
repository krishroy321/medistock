import { CapsuleGeometry } from 'three'
import { RoundedBox, Text } from '@react-three/drei'

const capsuleGeometry = new CapsuleGeometry(0.035, 0.075, 4, 8)

export function MedicineBlister3D({ medicine, statusColor }) {
  return (
    <group>
      <RoundedBox args={[0.64, 1.02, 0.12]} radius={0.045} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#cbd3d0" metalness={0.38} roughness={0.42} />
      </RoundedBox>
      <mesh position={[0, 0.37, 0.066]}>
        <planeGeometry args={[0.57, 0.22]} />
        <meshStandardMaterial color={statusColor} roughness={0.55} />
      </mesh>
      <Text position={[0, 0.37, 0.074]} fontSize={0.062} color="white" anchorX="center" anchorY="middle" maxWidth={0.52} textAlign="center">
        {medicine.name.split(' ')[0].toUpperCase()}
      </Text>
      {[-0.18, 0, 0.18].flatMap((x) => [-0.28, -0.02, 0.23].map((y) => (
        <group key={`${x}-${y}`}>
          <mesh position={[x, y, 0.091]}>
            <sphereGeometry args={[0.084, 16, 10]} />
            <meshPhysicalMaterial color="#e9f1f0" transparent opacity={0.62} roughness={0.12} clearcoat={1} />
          </mesh>
          <mesh geometry={capsuleGeometry} position={[x, y, 0.095]} rotation={[0, 0, Math.PI / 2]}>
            <meshStandardMaterial color={x > 0 ? '#f0d7b4' : '#f5f1e8'} roughness={0.25} />
          </mesh>
        </group>
      )))}
    </group>
  )
}
