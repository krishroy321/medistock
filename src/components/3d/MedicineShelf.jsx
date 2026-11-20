export function MedicineShelf({ children }) {
  return (
    <group>
      <mesh position={[0, 0.43, -0.78]} receiveShadow>
        <boxGeometry args={[5.72, 4.12, 0.12]} />
        <meshStandardMaterial color="#e2e8e4" roughness={0.88} />
      </mesh>
      {[-2.84, 2.84].map((x) => (
        <mesh key={x} position={[x, 0.43, -0.04]} castShadow receiveShadow>
          <boxGeometry args={[0.14, 4.12, 1.6]} />
          <meshStandardMaterial color="#aebdb5" metalness={0.18} roughness={0.56} />
        </mesh>
      ))}
      {[-1.25, 0.15, 1.55].map((y) => (
        <group key={y}>
          <mesh position={[0, y, -0.02]} castShadow receiveShadow>
            <boxGeometry args={[5.8, 0.16, 1.72]} />
            <meshStandardMaterial color="#d2dbd5" metalness={0.12} roughness={0.58} />
          </mesh>
          {[-1.85, 0, 1.85].map((x) => (
            <mesh key={x} position={[x, y - 0.27, -0.06]} castShadow>
              <boxGeometry args={[0.08, 0.34, 0.12]} />
              <meshStandardMaterial color="#91a199" metalness={0.22} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      {children}
    </group>
  )
}
