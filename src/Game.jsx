import React, { useState, useEffect, useCallback } from 'react';

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const BASE_GAME_SPEED = 5;

const POWERUP_TYPES = {
  DOUBLE_POINTS: 'doublePoints',
  INVINCIBLE: 'invincible',
  SLOW_TIME: 'slowTime'
};

const OBSTACLE_TYPES = {
  REGULAR: 'regular',
  FLOATING: 'floating',
  MOVING: 'moving'
};

const Game = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerY, setPlayerY] = useState(200);
  const [playerVelocity, setPlayerVelocity] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activeEffects, setActiveEffects] = useState({
    doublePoints: false,
    invincible: false,
    slowTime: false
  });
  const [clickEffect, setClickEffect] = useState({ x: 0, y: 0, show: false });
  const [gameSpeed, setGameSpeed] = useState(BASE_GAME_SPEED);
  const [isJumping, setIsJumping] = useState(false);

  const handleJumpAnimation = useCallback(() => {
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 500);
  }, []);

  const handleClick = useCallback((e) => {
    setClickEffect({
      x: e.clientX,
      y: e.clientY,
      show: true
    });
    setTimeout(() => setClickEffect(prev => ({ ...prev, show: false })), 300);

    if (!isPlaying && !isGameOver) {
      startGame();
    } else if (playerY === 400) {
      handleJumpAnimation();
      setPlayerVelocity(JUMP_FORCE);
    }
  }, [isPlaying, isGameOver, playerY]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = setInterval(() => {
      setPlayerY(prevY => {
        const speed = activeEffects.slowTime ? 0.5 : 1;
        const newY = prevY + playerVelocity * speed;
        return newY > 400 ? 400 : newY < 0 ? 0 : newY;
      });

      setPlayerVelocity(prev => prev + GRAVITY);

      setObstacles(prevObstacles => {
        const currentSpeed = activeEffects.slowTime ? gameSpeed * 0.5 : gameSpeed;
        return prevObstacles
          .map(obs => ({
            ...obs,
            x: obs.x - currentSpeed,
            y: obs.type === OBSTACLE_TYPES.MOVING ? 
               obs.y + Math.sin(obs.x / 50) * 2 : obs.y
          }))
          .filter(obs => obs.x > -50);
      });

      setPowerUps(prevPowerUps => {
        return prevPowerUps
          .map(pow => ({ ...pow, x: pow.x - gameSpeed }))
          .filter(pow => pow.x > -50);
      });

      if (Math.random() < 0.02 && obstacles.length < 3) {
        const obstacleType = Math.random() < 0.3 ? 
          OBSTACLE_TYPES.MOVING : 
          Math.random() < 0.5 ? OBSTACLE_TYPES.FLOATING : OBSTACLE_TYPES.REGULAR;

        const newObstacle = {
          x: 800,
          y: obstacleType === OBSTACLE_TYPES.FLOATING ? 300 : 400,
          width: 50,
          height: 50,
          type: obstacleType
        };

        setObstacles(prev => [...prev, newObstacle]);
      }

      if (Math.random() < 0.01 && powerUps.length < 2) {
        const types = Object.values(POWERUP_TYPES);
        const powerUpType = types[Math.floor(Math.random() * types.length)];
        
        const newPowerUp = {
          x: 800,
          y: Math.random() * 300 + 50,
          type: powerUpType
        };

        setPowerUps(prev => [...prev, newPowerUp]);
      }

      setScore(prev => prev + (activeEffects.doublePoints ? 2 : 1));

      if (!activeEffects.invincible) {
        obstacles.forEach(obstacle => {
          if (
            playerY + 50 > obstacle.y &&
            playerY < obstacle.y + obstacle.height &&
            100 + 50 > obstacle.x &&
            100 < obstacle.x + obstacle.width
          ) {
            gameOver();
          }
        });
      }

      powerUps.forEach(powerUp => {
        if (
          playerY + 50 > powerUp.y &&
          playerY < powerUp.y + 30 &&
          100 + 50 > powerUp.x &&
          100 < powerUp.x + 30
        ) {
          activatePowerUp(powerUp.type);
          setPowerUps(prev => prev.filter(p => p !== powerUp));
        }
      });

    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [isPlaying, playerVelocity, obstacles, gameSpeed, activeEffects]);

  const activatePowerUp = (type) => {
    setActiveEffects(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setActiveEffects(prev => ({ ...prev, [type]: false }));
    }, 5000);
  };

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setPlayerY(200);
    setPlayerVelocity(0);
    setObstacles([]);
    setPowerUps([]);
    setIsGameOver(false);
    setGameSpeed(BASE_GAME_SPEED);
    setActiveEffects({
      doublePoints: false,
      invincible: false,
      slowTime: false
    });
  };

  const gameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    if (score > highScore) {
      setHighScore(score);
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <div className="relative w-full max-w-4xl mx-auto h-[600px] bg-gray-800">
        <div className="absolute top-4 right-4 text-white">
          <div className="text-2xl mb-2">Score: {score}</div>
          <div className="text-xl mb-2">High Score: {highScore}</div>
          <div className="flex gap-2">
            {activeEffects.doublePoints && (
              <div className="bg-yellow-500 px-2 py-1 rounded">
                2x Points!
              </div>
            )}
            {activeEffects.invincible && (
              <div className="bg-red-500 px-2 py-1 rounded">
                Invincible!
              </div>
            )}
            {activeEffects.slowTime && (
              <div className="bg-blue-500 px-2 py-1 rounded">
                Slow Time!
              </div>
            )}
          </div>
        </div>

        <div 
          className={`absolute left-[100px] w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center overflow-hidden transition-transform ${
            isJumping ? 'scale-110' : ''
          } ${activeEffects.invincible ? 'animate-pulse' : ''}`}
          style={{ 
            top: `${playerY}px`,
            transform: `translateY(${playerVelocity}px)`,
          }}
        >
          <div className="text-3xl transform rotate-0">
            {activeEffects.invincible ? '🦸‍♂️' : '🚀'}
          </div>
        </div>

        {powerUps.map((powerUp, index) => (
          <div
            key={`powerup-${index}`}
            className="absolute w-[30px] h-[30px] flex items-center justify-center"
            style={{
              left: `${powerUp.x}px`,
              top: `${powerUp.y}px`,
            }}
          >
            {powerUp.type === POWERUP_TYPES.DOUBLE_POINTS && (
              <span className="text-2xl animate-pulse">💰</span>
            )}
            {powerUp.type === POWERUP_TYPES.INVINCIBLE && (
              <span className="text-2xl animate-pulse">⚡</span>
            )}
            {powerUp.type === POWERUP_TYPES.SLOW_TIME && (
              <span className="text-2xl animate-pulse">⏰</span>
            )}
          </div>
        ))}

        {obstacles.map((obstacle, index) => (
          <div
            key={`obstacle-${index}`}
            className={`absolute w-[50px] h-[50px] ${
              obstacle.type === OBSTACLE_TYPES.MOVING ? 'bg-purple-500' :
              obstacle.type === OBSTACLE_TYPES.FLOATING ? 'bg-green-500' :
              'bg-red-500'
            }`}
            style={{
              left: `${obstacle.x}px`,
              top: `${obstacle.y}px`,
              transform: obstacle.type === OBSTACLE_TYPES.MOVING ?
                `translateY(${Math.sin(obstacle.x / 50) * 10}px)` : 'none'
            }}
          />
        ))}

        <div className="absolute bottom-0 w-full h-[50px] bg-gray-700" />

        {clickEffect.show && (
          <div
            className="absolute w-12 h-12 pointer-events-none animate-ping"
            style={{
              left: clickEffect.x - 24,
              top: clickEffect.y - 24,
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderRadius: '50%'
            }}
          />
        )}

        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
            <h1 className="text-4xl text-white mb-4">
              {isGameOver ? 'Game Over!' : 'Elon Runner'}
            </h1>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isGameOver ? 'Try Again' : 'Start Game'}
            </button>
            <p className="mt-4 text-white">Click anywhere to Jump!</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-6 py-3 rounded-full">
        <p className="text-white text-xl">
          Click anywhere to make Elon jump! 🚀 
          <br />
          Collect power-ups: 
          💰 Double Points
          ⚡ Invincible
          ⏰ Slow Time
        </p>
      </div>
    </div>
  );
};

export default Game;