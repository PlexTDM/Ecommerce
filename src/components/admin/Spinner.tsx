interface SpinnerProps {
  className?: string;
}

const Spinner = ({ className = "h-4 w-4" }: SpinnerProps) => (
  <span
    aria-hidden="true"
    className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
  />
);

export default Spinner;
