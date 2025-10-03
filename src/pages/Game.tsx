import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";

interface Gate {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
  totalHeight: number;
  scored: boolean; // Czy już przyznano punkty za tę bramkę
}

interface ZigZac {
  x: number;
  y: number;
  direction: number; // Kąt w stopniach
  speed: number;
  turnDirection: 'up' | 'down'; // Kierunek następnego obrotu
}

const Game = () => {
  const navigate = useNavigate();
  const [gates, setGates] = useState<Gate[]>([]);
  const [gameSpeed, setGameSpeed] = useState(5); // 1.5x szybciej (2 * 1.5 = 3)
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [zigzac, setZigzac] = useState<ZigZac>({
    x: 100,
    y: 300,
    direction: 45, // Startuje pod kątem 45° (ruch w górę)
    speed: 3, // Bazowa prędkość
    turnDirection: 'down' // Pierwszy obrót w dół (do -45°)
  });
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const gateIdRef = useRef(0);
  const scoredElements = useRef<Set<Element>>(new Set());
  const currentGameSpeedRef = useRef(5); // Ref do przechowywania aktualnej prędkości

  // Funkcja sprawdzania kolizji używając atrybutów hit
  const checkCollisions = () => {
    if (!gameAreaRef.current || gameState === 'gameOver') return;

    const zigzacElement = gameAreaRef.current.querySelector('[data-zigzac]') as HTMLElement;
    if (!zigzacElement) return;

    const zigzacRect = zigzacElement.getBoundingClientRect();
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();

    // Przelicz pozycję ZigZac względem obszaru gry
    const zigzacX = zigzacRect.left - gameAreaRect.left;
    const zigzacY = zigzacRect.top - gameAreaRect.top;

    // Sprawdź wszystkie elementy z atrybutem data-hit
    const hitElements = gameAreaRef.current.querySelectorAll('[data-hit]');
    
    hitElements.forEach(element => {
      const elementRect = element.getBoundingClientRect();
      const elementX = elementRect.left - gameAreaRect.left;
      const elementY = elementRect.top - gameAreaRect.top;
      const elementWidth = elementRect.width;
      const elementHeight = elementRect.height;

      // Sprawdź kolizję
      if (zigzacX < elementX + elementWidth &&
          zigzacX + 24 > elementX &&
          zigzacY < elementY + elementHeight &&
          zigzacY + 24 > elementY) {
        
        const hitType = element.getAttribute('data-hit');
        
        if (hitType === 'game-over') {
          console.log('COLLISION with gate! Game Over');
          if (gameState === 'playing') {
            setGameState('gameOver');
          }
        } else if (hitType === 'score-point') {
          // Sprawdź czy ten element już dał punkty i gra nadal trwa
          if (!scoredElements.current.has(element) && gameState === 'playing') {
            console.log('SCORE! +1 point - passed through gap');
            setScore(prev => prev + 1);
            scoredElements.current.add(element);
            
            // Zwiększ prędkość o 2x po każdym punkcie
            const newSpeed = currentGameSpeedRef.current * 1.05; // Użyj ref zamiast state
            console.log(`Speed increase: ${currentGameSpeedRef.current} -> ${newSpeed}`);
            setGameSpeed(newSpeed);
            // Zaktualizuj ref z nową prędkością
            currentGameSpeedRef.current = newSpeed;
          }
        }
      }
    });
  };

  // Generowanie nowej bramki
  const generateGate = (): Gate => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return { id: 0, x: 0, topHeight: 0, bottomHeight: 0, gap: 0, totalHeight: 0, scored: false };

    const areaHeight = gameArea.clientHeight;
    const gap = 150; // Stały odstęp między górną a dolną częścią
    
    // Losowa wysokość górnej części (20% - 60% dostępnej przestrzeni)
    const availableHeight = areaHeight - gap;
    const minTopHeight = availableHeight * 0.2;
    const maxTopHeight = availableHeight * 0.6;
    const topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;
    
    // Dolna część zajmuje resztę dostępnej przestrzeni
    const bottomHeight = availableHeight - topHeight;

    return {
      id: gateIdRef.current++,
      x: gameArea.clientWidth,
      topHeight,
      bottomHeight,
      gap,
      totalHeight: areaHeight,
      scored: false
    };
  };

  // Obsługa klawisza spacji
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      if (gameState === 'playing') {
        setZigzac(prev => {
          const turnAngle = prev.turnDirection === 'down' ? -90 : 90;
          return {
            ...prev,
            direction: prev.direction + turnAngle,
            turnDirection: prev.turnDirection === 'down' ? 'up' : 'down' // Przełącz kierunek
          };
        });
      }
      // Usunięto restart gry spacją - tylko przycisk może restartować
    }
  }, [gameState]);

  // Funkcja restartu gry
  const restartGame = () => {
    setGameState('playing');
    setScore(0);
    setGameSpeed(5); // Reset prędkości do wartości bazowej
    currentGameSpeedRef.current = 5; // Reset ref
    setGates([generateGate()]);
    setZigzac({
      x: 100,
      y: 300,
      direction: 45,
      speed: 3, // Użyj bazowej prędkości zamiast gameSpeed
      turnDirection: 'down'
    });
    // Wyczyść elementy które dały punkty
    scoredElements.current.clear();
  };

  // Animacja gry
  const animate = () => {
    const gameArea = gameAreaRef.current;
    if (!gameArea || gameState === 'gameOver') return;

    // Aktualizuj pozycję ZigZac
    setZigzac(prev => {
      // ZigZac NIE porusza się po osi X - pozostaje w tym samym miejscu względem bramek
      // Bramki poruszają się w lewo, więc ZigZac pozostaje statyczny po X
      const newX = prev.x; // Bez ruchu po X
      
      // Kierunek kontroluje zygzak: 45° = w górę, -45° = w dół
      // Prędkość zygzaka skaluje się z prędkością gry
      const zigzagSpeed = currentGameSpeedRef.current * 0.5; // ZigZac porusza się wolniej niż bramki
      let zigzagOffset = 0;
      if (prev.direction === 45) {
        zigzagOffset = -zigzagSpeed; // Ruch w górę (Y maleje)
      } else if (prev.direction === -45) {
        zigzagOffset = zigzagSpeed; // Ruch w dół (Y rośnie)
      }
      
      const newY = prev.y + zigzagOffset;

      // Sprawdź kolizje ze ścianami
      let finalX = newX;
      let finalY = newY;

      if (newX < 0 || newX > gameArea.clientWidth) {
        finalX = Math.max(0, Math.min(gameArea.clientWidth, newX));
      }
      if (newY < 0 || newY > gameArea.clientHeight) {
        finalY = Math.max(0, Math.min(gameArea.clientHeight, newY));
      }

      return {
        ...prev,
        x: finalX,
        y: finalY
      };
    });

    // Aktualizuj bramki i sprawdź kolizje/punkty
    setGates(prevGates => {
      const movedGates = prevGates
        .map(gate => ({ ...gate, x: gate.x - currentGameSpeedRef.current }))
        .filter(gate => gate.x > -100);

      // Dodaj nową bramkę
      const lastGate = movedGates[movedGates.length - 1];
      if (!lastGate || lastGate.x < 400) {
        movedGates.push(generateGate());
      }

      // Sprawdź kolizje i punkty używając atrybutów hit
      movedGates.forEach(gate => {
        // Sprawdź czy ZigZac jest w obszarze bramki (po X)
        if (gate.x <= zigzac.x && gate.x + 60 >= zigzac.x) {
          // Sprawdź czy ZigZac przeszedł przez całą bramkę (punkty)
          if (!gate.scored && gate.x + 60 < zigzac.x) {
            console.log('SCORE! +1 point - passed through gap');
            setScore(prev => prev + 1);
            gate.scored = true;
          }
        }
      });

      return movedGates;
    });

    // Sprawdź kolizje używając atrybutów hit
    checkCollisions();

    animationRef.current = requestAnimationFrame(animate);
  };

  // Rozpocznij grę
  useEffect(() => {
    // Dodaj pierwszą bramkę
    setGates([generateGate()]);
    
    // Dodaj listener dla klawisza spacji
    window.addEventListener('keydown', handleKeyPress);
    
    // Rozpocznij animację
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div className="min-h-screen bg-background p-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="fixed top-4 left-4 hover:scale-110 transition-transform z-10"
        aria-label="Go back home"
      >
        <Home className="h-6 w-6" />
      </Button>
      
      {/* Wynik i prędkość */}
      <div className="fixed top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg font-bold text-xl z-10">
        <div>Score: {score}</div>
        <div className="text-sm">Speed: {gameSpeed.toFixed(2)}x</div>
      </div>
      
      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-white p-8 rounded-lg text-center max-w-md mx-4">
            <h2 className="text-3xl font-bold text-red-600 mb-4">Game Over!</h2>
            <p className="text-2xl font-bold mb-4">Score: {score}</p>
            <div className="space-y-3">
              <Button 
                onClick={restartGame}
                className="w-full"
              >
                Play Again
              </Button>
              <Button 
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-center min-h-screen">
        <div 
          ref={gameAreaRef}
          className="relative bg-gradient-to-b from-sky-200 to-sky-400 border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl"
          style={{ 
            width: '95dvw', 
            height: '90dvh',
            maxWidth: '1200px',
            maxHeight: '800px'
          }}
        >
          {/* Bramki */}
          {gates.map(gate => (
            <div 
              key={gate.id} 
              className="absolute flex flex-col h-full" 
              style={{ 
                left: gate.x,
                width: '60px',
                height: `${gate.totalHeight}px`
              }}
            >
              {/* Górna część bramki */}
              <div 
                className="bg-green-600 border-2 border-green-800 flex-shrink-0"
                style={{ 
                  height: `${gate.topHeight}px`
                }}
                data-hit="game-over"
              />
              
              {/* Przejście (gap) - niewidoczne, ale zajmuje miejsce */}
              <div 
                className="flex-grow"
                style={{ 
                  height: `${gate.gap}px`
                }}
                data-hit="score-point"
              />
              
              {/* Dolna część bramki */}
              <div 
                className="bg-green-600 border-2 border-green-800 flex-shrink-0"
                style={{ 
                  height: `${gate.bottomHeight}px`
                }}
                data-hit="game-over"
              />
            </div>
          ))}
          
          {/* ZigZac (wąż) */}
          <div 
            className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-red-700 shadow-lg z-20"
            style={{
              left: zigzac.x - 12,
              top: zigzac.y - 12,
              transform: `rotate(${zigzac.direction}deg)`
            }}
            data-zigzac="true"
          />
          
          {/* Tło gry */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-300 to-sky-400 opacity-50" />
          
          {/* Instrukcje */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
            <h1 className="text-2xl font-bold text-gray-800 drop-shadow-lg">
              ZipZap Game
            </h1>
            <p className="text-sm text-gray-700">
              Naciśnij SPACJĘ aby zmienić kierunek ZigZac
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
