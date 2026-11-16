export default function PulseWaves() {
  return (
    <svg className="pulse-waves" viewBox="0 0 700 160" fill="none" aria-hidden="true">
      {Array.from({ length: 10 }, (_, index) => (
        <path
          key={index}
          d={`M-60 ${35 + index * 10} C90 ${-25 + index * 12}, 200 ${150 - index * 4}, 350 ${96 - index * 2} S550 ${-8 + index * 11}, 760 ${45 + index * 10}`}
          stroke={index % 2 === 0 ? "#38D5CA" : "#78CCD9"}
          opacity={0.16 + index * 0.035}
          style={{ animationDelay: `${index * -0.35}s` }}
        />
      ))}
    </svg>
  );
}
