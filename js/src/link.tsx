import type { ReactNode } from "react";

export function Link({
  onClick,
  children,
  ...props
}: {
  onClick: () => void;
  children?: ReactNode | ReactNode[];
} & React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) {
  return (
    <a
      {...props}
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </a>
  );
}
