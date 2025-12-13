interface ExitButtonProps {
  onExit: () => void;
}

export default function ExitButton({ onExit }: ExitButtonProps) {
  const handleClick = () => {
    onExit();
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: "6px 12px",
        marginLeft: 8,
        borderRadius: 4,
        border: "1px solid #000",
        background: "#ef4444",
        color: "white",
        cursor: "pointer",
      }}
    >
      Exit
    </button>
  );
}
