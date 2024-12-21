import { forwardRef } from 'react';
import { LucideIcon, LucideProps } from 'lucide-react';

export const TwoLineMenuIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  function TwoLineMenuIcon(props, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <line x1="3" y1="8" x2="21" y2="8" />
        <line x1="5" y1="16" x2="19" y2="16" />
      </svg>
    );
  }
);

TwoLineMenuIcon.displayName = 'TwoLineMenuIcon';