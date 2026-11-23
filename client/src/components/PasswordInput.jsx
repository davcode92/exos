// Outil React pour mémoriser un état
import { useState } from 'react';

// Champ mot de passe avec un bouton œil pour afficher ou cacher le texte
export default function PasswordInput(props) {
  const [show, setShow] = useState(false); // le mot de passe est-il visible ?
  return (
    <div className="pw">{/* conteneur qui place l'œil à droite */}
      <input {...props} type={show ? 'text' : 'password'} />{/* le champ (type selon l'état) */}
      <button type="button" onClick={() => setShow(!show)} aria-label="Afficher le mot de passe">{show ? '🙈' : '👁'}</button>{/* bouton œil */}
    </div>
  );
}
