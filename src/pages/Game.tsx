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
    z-index: 5 !important;
    opacity: 1 !important;
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
  color: 'szary' | 'niebieski' | 'zloty'; // Kolor IQOS (bez faja)
}

interface Collectible {
  id: number;
  x: number;
  y: number;
  type: 'coin' | 'gem';
  points: number; // Liczba punktów za zebranie
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
  const [backgroundOffset, setBackgroundOffset] = useState(0);
  const [selectedBackground, setSelectedBackground] = useState('');
  const [selectedZigzacImage, setSelectedZigzacImage] = useState('');
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

  // Funkcja wyboru losowego tła
  const selectRandomBackground = () => {
    const backgrounds = ['background-1.png', 'background-2.png', 'background-3.png'];
    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setSelectedBackground(randomBackground);
  };

  // Funkcja wyboru losowego obrazu ZigZac
  const selectRandomZigzacImage = () => {
    const zigzacImages = [
      'blazek_pixel_crisp.png', 'blazek.png', 'cinek.png', 'dym.png', 
      'greg.png', 'krzychu.png', 'lumos.png', 'mucha.png', 
      'patryk.png', 'piem.png', 'zgredek.png'
    ];
    const randomImage = zigzacImages[Math.floor(Math.random() * zigzacImages.length)];
    setSelectedZigzacImage(randomImage);
  };

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
          
          console.log(`COLLECTED: ${collectible.type}! (+${collectible.points} points)`);
          
          // Dodaj punkty zgodnie z typem obiektu
          setScore(prev => prev + collectible.points);
          
          // Zmniejsz prędkość o 0.95x tylko dla monet (nie dla klejnotów)
          if (collectible.type === 'coin') {
            setGameSpeed(prev => {
              const newSpeed = prev * 0.95;
              console.log(`Speed reduction: ${prev.toFixed(2)} -> ${newSpeed.toFixed(2)} (collected coin)`);
              currentGameSpeedRef.current = newSpeed; // Aktualizuj ref
              return newSpeed;
            });
          } else {
            console.log(`No speed reduction for gem collection`);
          }
          
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
    // 80% szansy na zwykłą monetę (1 punkt), 20% na klejnot (5 punktów)
    const isSpecial = Math.random() < 0.2; // 20% szansy na specjalny obiekt
    
    if (isSpecial) {
      return {
        id: collectibleIdRef.current++,
        x: 1200, // Startuje z prawej strony
        y: Math.random() * (gameAreaRef.current?.clientHeight || 800 - 200) + 100,
        type: 'gem',
        points: 5, // 5 punktów za klejnot
        collected: false
      };
    } else {
      return {
        id: collectibleIdRef.current++,
        x: 1200, // Startuje z prawej strony
        y: Math.random() * (gameAreaRef.current?.clientHeight || 800 - 200) + 100,
        type: 'coin',
        points: 1, // 1 punkt za monetę
        collected: false
      };
    }
  };

  // Generowanie nowej bramki
  const generateGate = (): Gate => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return { id: 0, x: 0, topHeight: 0, bottomHeight: 0, gap: 0, totalHeight: 0, scored: false, color: 'szary' };

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

    // Losowy kolor IQOS (bez faja)
    const colors: ('szary' | 'niebieski' | 'zloty')[] = ['szary', 'niebieski', 'zloty'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: gateIdRef.current++,
      x: gameArea.clientWidth,
      topHeight,
      bottomHeight,
      gap,
      totalHeight: areaHeight,
      scored: false,
      color: randomColor
    };
  };

  // Funkcja zapisywania wyniku do Supabase
  const handleSaveScore = useCallback(async (finalScore: number) => {
    if (scoreSavedRef.current) return; // Nie zapisuj dwa razy
    
    scoreSavedRef.current = true;
    setSavingScore(true);
    
    try {
      await saveGameResult(finalScore);
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
          const turnAngle = prev.turnDirection === 'down' ? -120 : 120; // Zmiana z -90/90 na -120/120 dla dokładnie -60° i +60°
          const newTargetDirection = prev.direction + turnAngle;
          
          // Debugowanie kątów
          console.log(`Turn: ${prev.direction}° + ${turnAngle}° = ${newTargetDirection}° (${prev.turnDirection} -> ${prev.turnDirection === 'down' ? 'up' : 'down'})`);
          
          return {
            ...prev,
            targetDirection: newTargetDirection, // Ustaw docelowy kierunek
            turnDirection: prev.turnDirection === 'down' ? 'up' : 'down' // Przełącz kierunek
          };
        });
      }
      // Usunięto restart na spację - teraz tylko przycisk
    }
  }, [gameState]);

  // Funkcja restart gry
  const handleRestartGame = () => {
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
    // Wybierz nowe tło i obraz ZigZac
    selectRandomBackground();
    selectRandomZigzacImage();
    setBackgroundOffset(0); // Reset pozycji tła
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
      
      // Płynna interpolacja kierunku (zawsze między 60° a -60°)
      const directionDiff = prev.targetDirection - prev.direction;
      const directionSpeed = 10; // Zwiększona szybkość obrotu (stopnie na klatkę) dla bardziej responsywnego ruchu
      
      let newDirection = prev.direction;
      if (Math.abs(directionDiff) > 0.1) {
        if (directionDiff > 0) {
          newDirection = prev.direction + Math.min(directionSpeed, directionDiff);
        } else {
          newDirection = prev.direction - Math.min(directionSpeed, Math.abs(directionDiff));
        }
        
        // Upewnij się że kierunek zawsze jest między 60° a -60°
        newDirection = Math.max(-60, Math.min(60, newDirection));
        
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
      
      // Alternatywne podejście - użyj bezwzględnej wartości kąta dla symetrii
      const absAngle = Math.abs(normalizedAngle);
      const radians = (absAngle * Math.PI) / 180;
      
      // Używamy bezwzględnej wartości sinusa i znaku kąta dla symetrycznego ruchu
      const zigzagOffset = Math.sign(normalizedAngle) * Math.abs(Math.sin(radians)) * 4; // Stałe skalowanie dla symetrycznego ruchu
      
      // Debugowanie ruchu z porównaniem prędkości
      if (Math.abs(zigzagOffset) > 2) {
        const sinValue = Math.sin(radians);
        const absSinValue = Math.abs(sinValue);
        console.log(`Movement: angle=${normalizedAngle.toFixed(1)}°, absAngle=${absAngle.toFixed(1)}°, sin=${sinValue.toFixed(3)}, offset=${zigzagOffset.toFixed(2)}px`);
      }
      
      // Debugowanie kierunku
      if (Math.abs(newDirection) < 30) {
        console.log(`WARNING: ZigZac direction too close to 0°: ${newDirection.toFixed(1)}°`);
      }
      
      // Debugowanie asymetrii ruchu
      if (Math.abs(newDirection) === 60 || Math.abs(newDirection) === -60) {
        const testRadians = (Math.abs(newDirection) * Math.PI) / 180;
        const testOffset = Math.abs(Math.sin(testRadians)) * 4;
        console.log(`Speed test: ${Math.abs(newDirection)}° = ${testOffset.toFixed(2)}px offset (should be same for +60° and -60°)`);
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

    // Aktualizuj pozycję tła (porusza się z prawej do lewej)
    setBackgroundOffset(prev => {
      const newOffset = prev - currentGameSpeedRef.current;
      // Płynne zapętlenie tła - gdy tło wyjdzie poza szerokość obrazu, wraca na początek
      // Używamy szerokości obrazu tła zamiast szerokości ekranu
      const imageWidth = gameArea.clientWidth; // Zakładamy że obraz ma szerokość ekranu
      return newOffset <= -imageWidth ? newOffset + imageWidth : newOffset;
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
          console.log(`New collectible generated: ${newCollectible.type} (+${newCollectible.points}pts) at x: ${newCollectible.x}, y: ${newCollectible.y}`);
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
    // Wybierz losowe tło i obraz ZigZac
    selectRandomBackground();
    selectRandomZigzacImage();
    
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
    <div className="h-screen w-screen overflow-hidden" data-game="wrapper">
      <style>{gateAnimationStyle}</style>
      
      {/* Animowane tło */}
      {selectedBackground && (
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(/assety/tlo-gra/${selectedBackground})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: `${backgroundOffset}px 0`,
            zIndex: 0
          }}
        />
      )}
      {/* Score - top left */}
      <div className="fixed top-4 left-4 font-bold text-[3rem] z-50 text-uppercase">
        SCORE: {score}
      </div>
      
      {/* User name - bottom left */}
      <div className="fixed bottom-4 left-4 font-bold text-[3rem] z-50 uppercase">
        Player: {localStorage.getItem('username') || 'Guest'}
      </div>
      
      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30" data-game-wrapper="true">
          <div className="bg-white p-8 rounded-lg text-center max-w-md mx-4">
            <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
            <p className="text-2xl font-bold mb-4">Score: {score}</p>
            <div className="flex gap-4 justify-center">
              <h2 
                onClick={handleRestartGame}
                className="text-2xl font-bold cursor-pointer hover:text-gray-700"
              >
                Restart Game
              </h2>
              <h2 
                onClick={() => navigate("/")}
                className="text-2xl font-bold cursor-pointer hover:text-gray-700"
              >
                Back to Home
              </h2>
            </div>
          </div>
        </div>
      )}
      
      <div className="h-full w-full">
        <div
          ref={gameAreaRef}
          className="relative border-4 border-gray-800 overflow-hidden shadow-2xl h-full w-full"
          style={{ 
            width: '100vw', 
            height: '100vh'
          }}
        >
          {/* Bramki */}
          {gates.map(gate => (
            <div key={gate.id}>
              {/* IQOS - statyczny, przesunięty na boki */}
              <img
                src={`/assety/przeszkody/iqos/${gate.color === 'szary' ? 'igos-szary' : gate.color === 'niebieski' ? 'iqos-niebieski' : 'iqos-zloty'}.png`}
                alt="Gate obstacle"
                style={{
                  position: 'absolute',
                  top: '00px',
                  left: `${gate.x}px`,
                  width: '60px',
                  height: '250px',
                  objectFit: 'cover',
                  transform: 'rotate(180deg)',
                  zIndex: 10,
                  opacity: 1,
                  pointerEvents: 'none'
                }}
              />
              <img
                src={`/assety/przeszkody/iqos/${gate.color === 'szary' ? 'igos-szary' : gate.color === 'niebieski' ? 'iqos-niebieski' : 'iqos-zloty'}.png`}
                alt="Gate obstacle"
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  left: `${gate.x}px`,
                  width: '60px',
                  height: '250px',
                  objectFit: 'cover',
                  zIndex: 10,
                  opacity: 1,
                  pointerEvents: 'none'
                }}
              />
              
              {/* Wrapper bramki - tylko faja */}
              <div 
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
                className="flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                style={{ 
                  height: `${gate.topHeight + 70}px`,
                  width: '60px',
                  marginTop: '-100px'
                }}
                data-hit="game-over"
              >
                {/* Faja - tło */}
                <img
                  src={`/assety/przeszkody/iqos/faja.png`}
                  alt="Gate obstacle"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: 'auto',
                    width: '100%',
                    objectFit: 'cover',
                    zIndex: 5,
                    opacity: 1,
                    transform: 'rotate(180deg)'
                  }}
                />
              </div>
              
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
                className="flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                style={{ 
                  height: `${gate.bottomHeight + 70}px`,
                  width: '60px',
                  marginBottom: '-100px'
                }}
                data-hit="game-over"
              >
                {/* Faja - tło */}
                <img
                  src={`/assety/przeszkody/iqos/faja.png`}
                  alt="Gate obstacle"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: 'auto',
                    width: '100%',
                    objectFit: 'cover',
                    zIndex: 5,
                    opacity: 1
                  }}
                />
              </div>
              </div>
            </div>
          ))}
          
          {/* Obiekty zbierane */}
          {collectibles.map(collectible => (
            !collectible.collected && (
              <div
                key={collectible.id}
                className="absolute w-12 h-12 z-15"
                style={{
                  left: collectible.x - 12,
                  top: collectible.y - 12,
                }}
                data-collectible={collectible.id}
              >
                {/* Różne style dla różnych typów obiektów */}
                {collectible.type === 'coin' && (
                  <img 
                    src="/assety/do-zbierania/logo.gif" 
                    alt="Coin" 
                    className="w-full h-full object-contain"
                  />
                )}
                {collectible.type === 'gem' && (
                  <img 
                    src="/assety/do-zbierania/ring.gif" 
                    alt="Gem" 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )
          ))}
          
          {/* ZigZac (wąż) */}
          {selectedZigzacImage && (
            <img
              src={`/assety/glowy/${selectedZigzacImage}`}
              alt="ZigZac"
              className="absolute w-12 h-12 z-20"
              style={{
                left: zigzac.x - 12,
                top: zigzac.y - 12,
                transform: `rotate(${zigzac.direction}deg)`
              }}
              data-zigzac="true"
            />
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Game;
