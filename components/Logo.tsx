export default function Logo({ size = 44 }: { size?: number }) {
  // Garba ring: 12 petals around a centre, with two dandiya sticks
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Garba logo">
      <circle cx="50" cy="50" r="48" fill="#F7A81B" />
      <g transform="translate(50 50)">
        {petals.map((a) => (
          <ellipse key={a} cx="0" cy="-30" rx="6.5" ry="13" fill={a % 60 === 0 ? "#D6246E" : "#241A5E"} transform={`rotate(${a})`} />
        ))}
        <circle r="13" fill="#fff" />
        <circle r="7" fill="#0F8B8D" />
      </g>
    </svg>
  );
}
