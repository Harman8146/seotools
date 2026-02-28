export default function Pagination({ onNext }: { onNext: () => void }) {
  return (
    <button className="next-btn" onClick={onNext}>
      Next →
    </button>
  );
}