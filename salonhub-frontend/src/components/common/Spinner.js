/**
 * Spinner - Indicateur de chargement commun
 *
 *  <Spinner />                    petit indicateur en ligne
 *  <Spinner size="lg" block />    centré dans un bloc (chargement d'une page / section)
 *  label : texte lu par les lecteurs d'écran (null = décoratif)
 */

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

const Spinner = ({ size = "md", block = false, label = "Chargement", className = "", text = null }) => {
  const circle = (
    <span
      className={`inline-block rounded-full border-current border-t-transparent animate-spin ${SIZES[size] || SIZES.md} ${
        block ? "text-violet-600" : ""
      } ${className}`}
      aria-hidden="true"
    />
  );

  if (!block) {
    return label ? (
      <span role="status" className="inline-flex items-center">
        {circle}
        <span className="sr-only">{label}</span>
      </span>
    ) : (
      circle
    );
  }

  return (
    <div role="status" className="flex flex-col items-center justify-center py-12 text-slate-500">
      {circle}
      {text ? <p className="mt-3 text-sm">{text}</p> : label && <span className="sr-only">{label}</span>}
    </div>
  );
};

export default Spinner;
