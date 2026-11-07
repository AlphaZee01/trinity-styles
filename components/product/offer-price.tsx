import { formatGhs } from "@/lib/format";

export function OfferPrice({
  price,
  compareAt,
  className = "",
  saleClassName = "",
}: {
  price: number;
  compareAt?: number | null;
  className?: string;
  saleClassName?: string;
}) {
  const onSale = compareAt != null && compareAt > price;

  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      {onSale ? (
        <span className="text-sm text-muted-foreground line-through decoration-foreground/40">
          <span className="sr-only">Was </span>
          {formatGhs(compareAt)}
        </span>
      ) : null}
      <span className={saleClassName}>
        {onSale ? <span className="sr-only">Now </span> : null}
        {formatGhs(price)}
      </span>
    </p>
  );
}
