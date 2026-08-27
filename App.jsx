import React, { useState } from 'react';
import GameBoard from './components/GameBoard';
import './App.css';

export default function App() {
  const [roomCreated, setRoomCreated] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Игрок 1', 'Игрок 2']);
  const [roomCode] = useState('MG-' + Math.random().toString(36).substring(2, 6).toUpperCase());
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    const newNames = Array.from({ length: count }, (_, i) => `Игрок ${i + 1}`);
    setPlayerNames(newNames);
  };

  const handleNameChange = (index, value) => {
    const updatedNames = [...playerNames];
    updatedNames[index] = value;
    setPlayerNames(updatedNames);
  };

  if (!roomCreated) {
    return (
      <div className="setup-screen">
        <div className="setup-card">
          <h1>Денежная Игра</h1>
          <p className="subtitle">Создание игровой комнаты</p>
          
          <div className="room-code-box">
            <span>КОД КОМНАТЫ:</span>
            <strong>{roomCode}</strong>
          </div>

          <div className="players-count-section">
            <label>КОЛИЧЕСТВО ИГРОКОВ (до 6):</label>
            <div className="count-buttons">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  className={playerCount === num ? 'active-count' : ''}
                  onClick={() => handlePlayerCountChange(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="players-names-section">
            <label>ИМЕНА УЧАСТНИКОВ:</label>
            {playerNames.map((name, index) => (
              <input
                key={index}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(index, e.target.value)}
                placeholder={`Имя игрока ${index + 1}`}
              />
            ))}
          </div>

          {/* Кнопка вызова правил игры */}
          <button className="rules-btn-toggle" onClick={() => setIsRulesOpen(true)}>
            📖 Правила игры
          </button>

          <button className="start-game-btn" onClick={() => setRoomCreated(true)}>
            НАЧАТЬ ИГРУ И СФОРМИРОВАТЬ ССЫЛКУ
          </button>
        </div>

        {/* Модальное окно правил игры */}
        {isRulesOpen && (
          <div className="modal-overlay">
            <div className="modal-content rules-modal">
              <h2>ПРАВИЛА ИГРЫ</h2>
              <div className="rules-text-container">
                <p><b>1. Сформулировать денежный запрос.</b> </p>
                <p><b>2. Получить 100 лет жизни.</b> </p>
                <p><b>3. Бросить кубик и сделать ход.</b></p>
                <p><b>4. Ответить на вопрос уровня.</b></p>

                <p><b>5. Вытянуть карту времени.</b></p>

                <p><b>6. Передвинуть маркер жизни.</b></p>

                <p><b>7. Двойник фиксирует паттерны.</b></p>

                <p><b>8. Попытка перехода через поле «Новое действие».</b></p>

                <p><b>9. Прохождение второй фазы.</b> </p>
                <p><b>*************</b> </p>
                <h2>Дополнительные правила:</h2>
                <p><b>1. Каждый игрок начинает со 100 годами жизни..</b></p>
                <p><b>2. После прохождения уровня он вытягивает карту времени и передвигает маркер по шкале жизни. Чем дольше игрок остается в первой петле, тем меньше времени остается на осознанную жизнь.</b> </p>
              </div>
              <button className="approve-btn" onClick={() => setIsRulesOpen(false)}>Понятно</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <GameBoard roomCode={roomCode} playersList={playerNames} />;
}