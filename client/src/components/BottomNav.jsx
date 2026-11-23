// Barre de navigation fixée en bas de l'écran (comme dans la démo)
// items = liste de { icon, label, onClick }
export default function BottomNav({ items }) {
  return (
    <nav className="nav">{/* barre fixée en bas */}
      {items.map((it) => (
        <button key={it.label} onClick={it.onClick}>{/* un bouton par entrée */}
          <span>{it.icon}</span>{/* icône */}
          {it.label}{/* texte */}
        </button>
      ))}
    </nav>
  );
}
