interface CharacterCountProps {
  current: number;
  max: number;
}

export const CharacterCount = ({ current, max }: CharacterCountProps) => (
  <div 
    className="text-xs text-gray-400 px-4 text-right"
    aria-live="polite"
  >
    {current}/{max}
  </div>
);