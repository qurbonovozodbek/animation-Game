import { useState, useEffect, useRef } from "react";
import { FaReact } from "react-icons/fa";

import "./App.css";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 20;
const OBJECT_SIZE = 30;
const INITIAL_SPEED = 3;
const SPAWN_RATE = 1000; 
const SPEED_INCREASE_INTERVAL = 15; 

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    localStorage.getItem("highScore") || 0
  );
  const [lives, setLives] = useState(3);
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [objects, setObjects] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(INITIAL_SPEED);
  const keysPressed = useRef({});
  const lastSpawnTime = useRef(0);
  const animationFrameId = useRef(null);
  const gameAreaRef = useRef(null);
  const objectsCaught = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
        keysPressed.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
        keysPressed.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!gameAreaRef.current || !gameStarted) return;

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const rect = gameAreaRef.current.getBoundingClientRect();
      const relativeX = touch.clientX - rect.left;
      const newPlayerX = Math.max(
        0,
        Math.min(relativeX - PLAYER_WIDTH / 2, GAME_WIDTH - PLAYER_WIDTH)
      );
      setPlayerX(newPlayerX);
    };

    gameAreaRef.current.addEventListener("touchmove", handleTouchMove);

    return () => {
      if (gameAreaRef.current) {
        gameAreaRef.current.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = (timestamp) => {
      setPlayerX((prev) => {
        let newX = prev;
        if (keysPressed.current.ArrowLeft) newX = Math.max(0, prev - 8);
        if (keysPressed.current.ArrowRight)
          newX = Math.min(GAME_WIDTH - PLAYER_WIDTH, prev + 8);
        return newX;
      });

      if (timestamp - lastSpawnTime.current > SPAWN_RATE) {
        const newObject = {
          x: Math.random() * (GAME_WIDTH - OBJECT_SIZE),
          y: 0,
          id: Date.now(),
          color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        };
        setObjects((prev) => [...prev, newObject]);
        lastSpawnTime.current = timestamp;
      }

      setObjects((prev) => {
        return prev
          .map((obj) => ({
            ...obj,
            y: obj.y + currentSpeed,
          }))
          .filter((obj) => {
            const isCaught =
              obj.y + OBJECT_SIZE >= GAME_HEIGHT - PLAYER_HEIGHT &&
              obj.x + OBJECT_SIZE >= playerX &&
              obj.x <= playerX + PLAYER_WIDTH;

            const isMissed = obj.y > GAME_HEIGHT;

            if (isCaught) {
              setScore((s) => s + 10);
              objectsCaught.current += 1;
              
              if (objectsCaught.current % SPEED_INCREASE_INTERVAL === 0) {
                setCurrentSpeed((prev) => prev + 1);
              }
              return false;
            }
            if (isMissed) {
              setLives((l) => l - 1);
              return false;
            }
            return true;
          });
      });

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameStarted, playerX, currentSpeed]);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setLives(3);
    setObjects([]);
    setCurrentSpeed(INITIAL_SPEED);
    objectsCaught.current = 0;
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
    lastSpawnTime.current = 0;
  };

  const endGame = () => {
    setGameStarted(false);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("highScore", score);
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };

  useEffect(() => {
    if (lives <= 0) {
      endGame();
    }
  }, [lives]);

  return (
    <div className="game-container">
      {!gameStarted ? (
        <div className="start-screen">
          <h1>Catch the Falling Objects</h1>
          <p>Use arrow keys or touch to move</p>
          <p>High Score: {highScore}</p>
          <button onClick={startGame}>Start Game</button>
          {lives <= 0 && (
            <p className="game-over">Game Over! Final Score: {score}</p>
          )}
        </div>
      ) : (
        <div
          className="game-area"
          ref={gameAreaRef}
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          <div className="game-info">
            <span>Score: {score}</span>
            <span>Lives: {lives}</span>
            <span>Speed: {currentSpeed}</span>
          </div>

          <div
            className="player"
            style={{
              left: playerX,
              width: PLAYER_WIDTH,
              height: PLAYER_HEIGHT,
            }}
          ></div>

          {objects.map((obj) => (
            <div
              key={obj.id}
              className="falling-object"
              style={{
                left: obj.x,
                top: obj.y,
                width: OBJECT_SIZE,
                height: OBJECT_SIZE,
                backgroundColor: obj.color,
              }}
            ></div>
          ))}
        </div>
      )}
      <span className="creator"> <FaReact className="icon" /> created by @qurbonovozodbe</span>
    </div>
  );
}

export default App;