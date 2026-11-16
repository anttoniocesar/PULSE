import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatVariancePercent, type calculateVariance } from "../../utils/mathTreeCalculations";

export default function VarianceBadge({ variance, production = false }: { variance: ReturnType<typeof calculateVariance>; production?: boolean }) {
  const direction = variance.absolute === null || variance.absolute === 0 ? "Sem variação comparável" : variance.absolute < 0 ? "Redução" : "Aumento";
  const label = production ? "Variação de volume" : variance.favorable === "favorable" ? "Favorável: redução de custo" : variance.favorable === "unfavorable" ? "Desfavorável: aumento de custo" : "Sem variação comparável";
  const Icon = variance.absolute === null || variance.absolute === 0 ? Minus : variance.absolute < 0 ? ArrowDownRight : ArrowUpRight;
  return <span className={`math-variance math-variance--${production ? "volume" : variance.favorable}`} title={`${label}. ${direction}: ${formatVariancePercent(variance.percent)}`} aria-label={`${label}, ${formatVariancePercent(variance.percent)}`}><Icon size={11} aria-hidden="true" />{formatVariancePercent(variance.percent)}</span>;
}
