import React from "react";

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ children, onClick, selected = false }: CardProps) {
  return (
    <div onClick={onClick} className={`phoenix-card ${selected ? "phoenix-card-selected" : ""}`}>
      {children}
    </div>
  );
}
