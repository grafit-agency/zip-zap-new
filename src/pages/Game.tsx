import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { saveGameResult } from "@/api/players";
import { useToast } from "@/hooks/use-toast";

// CSS dla animacji bramek
const gateAnimationStyle = `
  @keyframes gateMove {
    0% { transform: translateY(0px); }
    25% { transform: translateY(-60px); }
    50% { transform: translateY(0px); }
    75% { transform: translateY(60px); }
    100% { transform: translateY(0px); }
  }
  
  .gate-moving {
    animation: gateMove 3s ease-in-out infinite;
  }
  
  .gate-moving-delay-1 { animation-delay: 0.5s; }
  .gate-moving-delay-2 { animation-delay: 1s; }
  .gate-moving-delay-3 { animation-delay: 1.5s; }
  .gate-moving-delay-4 { animation-delay: 2s; }
  .gate-moving-delay-5 { animation-delay: 2.5s; }
`;

interface Gate {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
  totalHeight: number;
  scored: boolean; // Czy już przyznano punkty za tę bramkę
}

interface Collectible {
  id: number;
  x: number;
  y: number;
  type: 'star' | 'coin' | 'gem';
  collected: boolean;
}

interface ZigZac {
  x: number;
  y: number;
  direction: number; // Aktualny kąt w stopniach
  targetDirection: number; // Docelowy kąt w stopniach
  speed: number;
  turnDirection: 'up' | 'down'; // Kierunek następnego obrotu
}

const Game = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gates, setGates] = useState<Gate[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [collectedItems, setCollectedItems] = useState<Collectible[]>([]);
  const [gameSpeed, setGameSpeed] = useState(5);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [savingScore, setSavingScore] = useState(false);
  const [zigzac, setZigzac] = useState<ZigZac>({
    x: 100,
    y: 300,
    direction: 60, // Startuje pod kątem 60° (ruch w górę)
    targetDirection: 60, // Docelowy kąt
    speed: 5, // Początkowa prędkość
    turnDirection: 'down' // Pierwszy obrót w dół (do -60°)
  });
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const gateIdRef = useRef(0);
  const collectibleIdRef = useRef(0);
  const scoredElements = useRef<Set<Element>>(new Set());
  const scoreSavedRef = useRef(false); // Flaga czy wynik został już zapisany
  const currentGameSpeedRef = useRef(5); // Ref do przechowywania aktualnej prędkości

  // Funkcja sprawdzania kolizji z obiektami zbieranymi
  const checkCollectibleCollisions = () => {
    if (!gameAreaRef.current || gameState === 'gameOver') return;

    const zigzacElement = gameAreaRef.current.querySelector('[data-zigzac]') as HTMLElement;
    if (!zigzacElement) return;

    const zigzacRect = zigzacElement.getBoundingClientRect();
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect();

    const zigzacX = zigzacRect.left - gameAreaRect.left;
    const zigzacY = zigzacRect.top - gameAreaRect.top;

    setCollectibles(prevCollectibles => {
      return prevCollectibles.map(collectible => {
        if (collectible.collected) return collectible;

        const collectibleElement = gameAreaRef.current?.querySelector(`[data-collectible="${collectible.id}"]`) as HTMLElement;
        if (!collectibleElement) return collectible;

        const collectibleRect = collectibleElement.getBoundingClientRect();
        const collectibleX = collectibleRect.left - gameAreaRect.left;
        const collectibleY = collectibleRect.top - gameAreaRect.top;

        // Sprawdź kolizję
        if (zigzacX < collectibleX + 24 &&
            zigzacX + 24 > collectibleX &&
            zigzacY < collectibleY + 24 &&
            zigzacY + 24 > collectibleY) {
          
          console.log(`COLLECTED: ${collectible.type}!`);
          
          // Zmniejsz prędkość o 0.95x po zebraniu obiektu
          setGameSpeed(prev => {
            const newSpeed = prev * 0.95;
            console.log(`Speed reduction: ${prev.toFixed(2)} -> ${newSpeed.toFixed(2)} (collected item)`);
            currentGameSpeedRef.current = newSpeed; // Aktualizuj ref
            return newSpeed;
          });
          
          // Dodaj do zebranych obiektów
          setCollectedItems(prev => [...prev, { ...collectible, collected: true }]);
          
          return { ...collectible, collected: true };
        }
        
        return collectible;
      });
    });
  };

  // Funkcja sprawdzania kolizji używając atrybutów hit
  const checkCollisions = () => {
    if (!gameAreaRef.current) return;

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
          setGameState('gameOver');
          } else if (hitType === 'score-point') {
            // Sprawdź czy ten element już dał punkty
            if (!scoredElements.current.has(element)) {
              console.log('SCORE! +1 point - passed through gap');
              setScore(prev => prev + 1);
              scoredElements.current.add(element);
              
              // Zwiększ prędkość o 1.05x po każdym punkcie
              setGameSpeed(prev => {
                const newSpeed = prev * 1.05;
                console.log(`Speed increase: ${prev.toFixed(2)} -> ${newSpeed.toFixed(2)}`);
                currentGameSpeedRef.current = newSpeed; // Aktualizuj ref
                return newSpeed;
              });
            }
          }
      }
    });
  };

  // Generowanie obiektu zbieranego
  const generateCollectible = (): Collectible => {
    const types: ('star' | 'coin' | 'gem')[] = ['star', 'coin', 'gem'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Losowa pozycja Y z większym zakresem
    const gameArea = gameAreaRef.current;
    const areaHeight = gameArea ? gameArea.clientHeight : 800;
    const randomY = Math.random() * (areaHeight - 200) + 100; // 100px do (height-100)px
    
    return {
      id: collectibleIdRef.current++,
      x: 1200, // Startuje z prawej strony
      y: randomY, // Losowa pozycja Y w całym obszarze gry
      type: randomType,
      collected: false
    };
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
    let topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;
    
    // Od 4 punktu wzwyż - dodaj losowe przesunięcie gap
    if (score >= 4) {
      const shiftAmount = Math.random() * 100 - 50; // -50 do +50 pikseli
      topHeight += shiftAmount;
      
      // Upewnij się że topHeight nie wychodzi poza granice
      topHeight = Math.max(20, Math.min(availableHeight - 20, topHeight));
      
      console.log(`Gate shift activated! Score: ${score}, Shift: ${shiftAmount.toFixed(1)}px, Div movement: ON, Visible gates will move, Collision areas extended with padding`);
    }
    
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

  // Funkcja zapisywania wyniku do Supabase
  const handleSaveScore = useCallback(async (finalScore: number) => {
    if (scoreSavedRef.current) return; // Nie zapisuj dwa razy
    
    scoreSavedRef.current = true;
    setSavingScore(true);
    
    try {
      await saveGameResult(finalScore);
      toast({
        title: "Wynik zapisany! 🎉",
        description: `Twój wynik: ${finalScore} punktów`,
      });
    } catch (error: any) {
      console.error("Błąd zapisu wyniku:", error);
      // Jeśli użytkownik jest niezalogowany, pokaż komunikat
      if (error.message?.includes("zalogowanego")) {
        toast({
          title: "Zaloguj się aby zapisać wynik",
          description: "Twój wynik nie został zapisany",
          variant: "destructive",
        });
      }
    } finally {
      setSavingScore(false);
    }
  }, [toast]);

  // Obsługa klawisza spacji
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      if (gameState === 'playing') {
        setZigzac(prev => {
          const turnAngle = prev.turnDirection === 'down' ? -90 : 90;
          const newTargetDirection = prev.direction + turnAngle;
          return {
            ...prev,
            targetDirection: newTargetDirection, // Ustaw docelowy kierunek
            turnDirection: prev.turnDirection === 'down' ? 'up' : 'down' // Przełącz kierunek
          };
        });
      } else if (gameState === 'gameOver') {
        // Restart gry
        setGameState('playing');
        setScore(0);
        setGameSpeed(5); // Reset prędkości do wartości początkowej
        currentGameSpeedRef.current = 5; // Reset ref
        setGates([generateGate()]);
        setCollectibles([generateCollectible()]); // Dodaj pierwszy obiekt przy restarcie
        setCollectedItems([]); // Reset zebranych obiektów
        setZigzac({
          x: 100,
          y: 300,
          direction: 60,
          targetDirection: 60, // Reset docelowego kierunku
          speed: 5, // Reset prędkości ZigZac
          turnDirection: 'down'
        });
        // Wyczyść elementy które dały punkty
        scoredElements.current.clear();
        // Reset flagi zapisu wyniku
        scoreSavedRef.current = false;
      }
    }
  }, [gameState]);

  // Animacja gry
  const animate = () => {
    const gameArea = gameAreaRef.current;
    if (!gameArea || gameState === 'gameOver') return;

    // Aktualizuj pozycję ZigZac
    setZigzac(prev => {
      // ZigZac NIE porusza się po osi X - pozostaje w tym samym miejscu względem bramek
      // Bramki poruszają się w lewo, więc ZigZac pozostaje statyczny po X
      const newX = prev.x; // Bez ruchu po X
      
      // Płynna interpolacja kierunku
      const directionDiff = prev.targetDirection - prev.direction;
      const directionSpeed = 5; // Zwiększona szybkość obrotu (stopnie na klatkę) dla bardziej responsywnego ruchu
      
      let newDirection = prev.direction;
      if (Math.abs(directionDiff) > 0.1) {
        if (directionDiff > 0) {
          newDirection = prev.direction + Math.min(directionSpeed, directionDiff);
        } else {
          newDirection = prev.direction - Math.min(directionSpeed, Math.abs(directionDiff));
        }
        // Debugowanie interpolacji
        if (Math.abs(directionDiff) > 3) {
          console.log(`Smooth turn: ${prev.direction.toFixed(1)}° -> ${newDirection.toFixed(1)}° (target: ${prev.targetDirection}°)`);
        }
      } else {
        newDirection = prev.targetDirection;
      }
      
      // Kierunek kontroluje zygzak: 60° = w górę, -60° = w dół
      // Używamy interpolowanego kierunku zamiast stałych wartości
      // Normalizujemy kąt do zakresu -90° do 90° dla symetrycznego ruchu
      const normalizedAngle = Math.max(-90, Math.min(90, newDirection));
      const radians = (normalizedAngle * Math.PI) / 180;
      
      // Używamy bezwzględnej wartości sinusa i znaku kąta dla symetrycznego ruchu
      const zigzagOffset = Math.sign(normalizedAngle) * Math.abs(Math.sin(radians)) * 4; // Zwiększone skalowanie dla bardziej intensywnego ruchu
      
      // Debugowanie ruchu
      if (Math.abs(zigzagOffset) > 2) {
        console.log(`Movement: angle=${normalizedAngle.toFixed(1)}°, offset=${zigzagOffset.toFixed(2)}px`);
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
        y: finalY,
        direction: newDirection, // Użyj interpolowanego kierunku
        speed: currentGameSpeedRef.current // Użyj ref zamiast state
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

    // Aktualizuj obiekty zbierane
    setCollectibles(prevCollectibles => {
      const movedCollectibles = prevCollectibles
        .map(collectible => ({ ...collectible, x: collectible.x - currentGameSpeedRef.current }))
        .filter(collectible => collectible.x > -100);

      // Debugowanie ruchu obiektów
      if (movedCollectibles.length > 0) {
        const visibleObjects = movedCollectibles.filter(obj => obj.x > -100 && obj.x < 1300);
        console.log(`Collectibles: ${movedCollectibles.length} total, ${visibleObjects.length} visible, speed: ${currentGameSpeedRef.current.toFixed(2)}`);
        
        // Debugowanie pozycji obiektów
        if (visibleObjects.length > 1) {
          console.log(`WARNING: Multiple visible objects detected!`, visibleObjects.map(obj => `x:${obj.x.toFixed(0)}, y:${obj.y.toFixed(0)}`));
        }
      }

      // Dodaj nowy obiekt zbierany (rzadko - co 3000-5000px)
      const lastCollectible = movedCollectibles[movedCollectibles.length - 1];
      const visibleObjects = movedCollectibles.filter(obj => obj.x > -100 && obj.x < 1300);
      
      // Generuj nowy obiekt tylko jeśli:
      // 1. Nie ma żadnego obiektu, LUB
      // 2. Ostatni obiekt jest daleko poza ekranem
      if (!lastCollectible || lastCollectible.x < -3000) {
        const newCollectible = generateCollectible();
        
        // Sprawdź czy nowy obiekt nie jest zbyt blisko istniejących obiektów
        const tooClose = movedCollectibles.some(existing => {
          const distanceY = Math.abs(existing.y - newCollectible.y);
          return distanceY < 150; // Minimalna odległość 150px
        });
        
        if (!tooClose) {
          movedCollectibles.push(newCollectible);
          console.log(`New collectible generated at x: ${newCollectible.x}, y: ${newCollectible.y}`);
        } else {
          console.log(`Collectible too close to existing ones, skipping generation`);
        }
      }

      return movedCollectibles;
    });

    // Sprawdź kolizje używając atrybutów hit
    checkCollisions();
    
    // Sprawdź kolizje z obiektami zbieranymi
    checkCollectibleCollisions();

    animationRef.current = requestAnimationFrame(animate);
  };

  // Effect do zapisywania wyniku po Game Over
  useEffect(() => {
    if (gameState === 'gameOver' && !scoreSavedRef.current) {
      handleSaveScore(score);
    }
  }, [gameState, score, handleSaveScore]);

  // Rozpocznij grę
  useEffect(() => {
    // Dodaj pierwszą bramkę
    setGates([generateGate()]);
    
    // Dodaj pierwszy obiekt zbierany
    setCollectibles([generateCollectible()]);
    
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
      <style>{gateAnimationStyle}</style>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="fixed top-4 left-4 hover:scale-110 transition-transform z-10"
        aria-label="Go back home"
      >
        <Home className="h-6 w-6" />
      </Button>
      
      {/* Wynik */}
      <div className="fixed top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg font-bold text-xl z-10">
        <div>Score: {score}</div>
        <div className="text-sm">Speed: {gameSpeed.toFixed(2)}x</div>
        <div className="text-sm text-green-400">🎮 ZigZac Range: ±60°</div>
        <div className="text-sm text-orange-400">💎 Collected: {collectedItems.length}</div>
        <div className="text-sm text-red-400">🐌 Speed Reduction: 0.95x per item</div>
        <div className="text-sm text-blue-400">📉 Max 1 item visible</div>
        <div className="text-sm text-purple-400">📏 Min 150px distance</div>
        {score >= 4 && (
          <div className="text-sm text-yellow-400">⚠️ Gap Shift Active!</div>
        )}
        {score >= 4 && (
          <div className="text-sm text-blue-400">🎯 Gate Movement Active!</div>
        )}
        {score >= 4 && (
          <div className="text-sm text-purple-400">🛡️ Extended Collision Areas!</div>
        )}
      </div>
      
      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30" data-game-wrapper="true">
          <div className="bg-white p-8 rounded-lg text-center max-w-md mx-4">
            <h2 className="text-3xl font-bold text-red-600 mb-4">Game Over!</h2>
            <p className="text-2xl font-bold mb-4">Score: {score}</p>
            {savingScore && (
              <p className="text-sm text-muted-foreground mb-4">Zapisywanie wyniku...</p>
            )}
            <p className="text-gray-600 mb-4">Press SPACE to restart</p>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="mr-4"
            >
              Back to Home
            </Button>
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
              className={`absolute flex flex-col h-full ${score >= 4 && gate.x < (gameAreaRef.current?.offsetWidth || 1200) ? `gate-moving gate-moving-delay-${(gate.id % 5) + 1}` : ''}`}
              style={{ 
                left: gate.x,
                width: '60px',
                height: `${gate.totalHeight}px`
              }}
              data-gates="wrapper"
            >
              {/* Górna część bramki */}
              <div 
                className="bg-green-600 border-2 border-green-800 flex-shrink-0"
                style={{ 
                  height: `${gate.topHeight + 70}px`,
                  paddingTop: '30px',
                  paddingBottom: '30px',
                  marginTop: '-100px'
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
                  height: `${gate.bottomHeight + 70}px`,
                  paddingTop: '30px',
                  paddingBottom: '30px',
                  marginBottom: '-100px'
                }}
                data-hit="game-over"
              />
            </div>
          ))}
          
          {/* Obiekty zbierane */}
          {collectibles.map(collectible => (
            !collectible.collected && (
              <div
                key={collectible.id}
                className="absolute w-6 h-6 z-15 animate-pulse"
                style={{
                  left: collectible.x - 12,
                  top: collectible.y - 12,
                }}
                data-collectible={collectible.id}
              >
                {/* Ujednolicony styl - wszystkie obiekty jako okrągłe monety */}
                <div className="w-full h-full bg-yellow-500 rounded-full border-2 border-yellow-700 flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
                </div>
              </div>
            )
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
