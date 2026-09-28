import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Keyboard,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const difficulties = [
    { id: 'easy', name: 'Warm-up', range: 50, detail: '1–50', accent: 'Quick read' },
    { id: 'medium', name: 'Focus', range: 100, detail: '1–100', accent: 'Just right' },
    { id: 'hard', name: 'Deep cut', range: 500, detail: '1–500', accent: 'For the brave' },
  ] as const;

  type DifficultyId = (typeof difficulties)[number]['id'];
  type Guess = { value: number; result: 'higher' | 'lower' | 'correct' };

  const [difficulty, setDifficulty] = useState<DifficultyId>('medium');
  const [target, setTarget] = useState(67);
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [status, setStatus] = useState<'ready' | 'higher' | 'lower' | 'won'>('ready');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const max = difficulties.find((item) => item.id === difficulty)?.range ?? 100;
  const activeDifficulty = difficulties.find((item) => item.id === difficulty) ?? difficulties[1];
  const attempts = guesses.length;
  const progress = Math.min(100, attempts * 15);
  const rangeCopy = useMemo(() => {
    if (guesses.length === 0) return `Between 1 and ${max}`;
    const values = guesses.map((item) => item.value);
    const low = Math.max(1, ...values.filter((value) => value < target));
    const high = Math.min(max, ...values.filter((value) => value > target));
    if (status === 'won') return `You found it in ${attempts} ${attempts === 1 ? 'try' : 'tries'}`;
    if (status === 'higher') return `Somewhere between ${low + 1} and ${max}`;
    return `Somewhere between 1 and ${high - 1}`;
  }, [attempts, guesses, max, status, target]);

  useEffect(() => {
    if (status === 'higher' || status === 'lower') {
      inputRef.current?.focus();
    }
  }, [status]);

  const createTarget = (range: number) => Math.floor(Math.random() * range) + 1;

  const startRound = (nextDifficulty = difficulty) => {
    const nextMax = difficulties.find((item) => item.id === nextDifficulty)?.range ?? 100;
    setTarget(createTarget(nextMax));
    setGuess('');
    setGuesses([]);
    setHint(null);
    setRoundScore(0);
    setStatus('ready');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const changeDifficulty = (next: DifficultyId) => {
    setDifficulty(next);
    startRound(next);
  };

  const submitGuess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(guess);
    if (!Number.isInteger(value) || value < 1 || value > max || status === 'won') return;
    const result: Guess['result'] = value === target ? 'correct' : value < target ? 'higher' : 'lower';
    const nextGuesses = [...guesses, { value, result }];
    setGuesses(nextGuesses);
    setGuess('');
    setStatus(result === 'correct' ? 'won' : result);
    if (result === 'correct') {
      const earned = Math.max(10, Math.round(100 - (nextGuesses.length - 1) * 9 - (hint ? 10 : 0)));
      setRoundScore(earned);
      setBestScore((current) => Math.max(current, earned));
      setRounds((current) => current + 1);
    } else {
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 400);
    }
  };

  const revealHint = () => {
    if (hint || status === 'won') return;
    setHint(target % 2 === 0 ? 'The number is even.' : 'The number is odd.');
  };

  return (
    <main className="game-shell grain min-h-[100dvh] overflow-hidden">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
        <header className="animate-enter-up flex items-center justify-between">
          <button
            type="button"
            onClick={() => startRound()}
            className="group flex items-center gap-3 text-left"
            data-testid="button-brand-new-round"
            aria-label="Start a new round"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ef6953] text-[#fff8ed] shadow-[4px_4px_0_hsl(224_31%_17%)] transition-transform group-hover:-translate-y-0.5">
              <Target size={20} strokeWidth={2.5} />
            </span>
            <span>
              <span className="block font-display text-base font-bold tracking-tight text-foreground">Higher or Lower</span>
              <span className="block font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">A tiny challenge</span>
            </span>
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-2 text-xs font-semibold text-muted-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#ef6953]" />
            Solo mode
          </div>
        </header>

        <div className="grid flex-1 gap-10 pb-8 pt-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-20 lg:pb-14 lg:pt-20">
          <section className="flex flex-col justify-center">
            <div className="animate-enter-up max-w-3xl" style={{ animationDelay: '80ms' }}>
              <p className="mb-5 flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[.2em] text-[#c44d3b]">
                <Sparkles size={14} />
                Make your move
              </p>
              <h1 className="font-display text-[clamp(3.5rem,9vw,7.5rem)] font-bold leading-[.88] tracking-[-.075em] text-foreground">
                Find the
                <span className="relative ml-3 inline-block text-[#ef6953]">
                  number.
                  <span className="absolute -bottom-2 left-1 h-2 w-[92%] -rotate-2 rounded-full bg-[#f6cb57] sm:-bottom-4 sm:h-3" />
                </span>
              </h1>
              <p className="mt-8 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
                A quick test of instinct and logic. I’m thinking of a number. How few guesses can you make?
              </p>
            </div>

            <div className="mt-12 max-w-xl animate-enter-up" style={{ animationDelay: '160ms' }}>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Choose your range</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{activeDifficulty.name} · {activeDifficulty.accent}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{activeDifficulty.detail}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {difficulties.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeDifficulty(item.id)}
                    className={`rounded-2xl border px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                      difficulty === item.id
                        ? 'border-foreground bg-foreground text-background shadow-[4px_4px_0_#ef6953]'
                        : 'border-border bg-card/60 text-foreground hover:border-foreground/50'
                    }`}
                    data-testid={`button-difficulty-${item.id}`}
                    aria-pressed={difficulty === item.id}
                  >
                    <span className="block font-display text-sm font-bold">{item.name}</span>
                    <span className={`mt-1 block font-mono text-[10px] ${difficulty === item.id ? 'text-background/65' : 'text-muted-foreground'}`}>{item.detail}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 max-w-xl animate-enter-up" style={{ animationDelay: '240ms' }}>
              <form onSubmit={submitGuess} className={`relative flex gap-2 ${isShaking ? 'animate-[shake_.35s_ease-in-out]' : ''}`} aria-label="Submit a guess">
                <label htmlFor="guess" className="sr-only">Your guess</label>
                <input
                  id="guess"
                  ref={inputRef}
                  value={guess}
                  onChange={(event) => setGuess(event.target.value.replace(/[^0-9]/g, ''))}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={`Enter 1–${max}`}
                  className="number-input min-w-0 flex-1 rounded-2xl border-2 border-border bg-card px-5 py-4 font-mono text-lg text-foreground shadow-[3px_3px_0_hsl(224_18%_82%)] transition-all placeholder:text-muted-foreground/65 focus:border-foreground focus:shadow-[5px_5px_0_#f6cb57]"
                  data-testid="input-guess"
                  aria-describedby="range-status"
                />
                <button
                  type="submit"
                  className="group flex shrink-0 items-center gap-2 rounded-2xl bg-[#ef6953] px-5 py-4 font-display text-sm font-bold text-[#fff8ed] shadow-[4px_4px_0_hsl(224_31%_17%)] transition-all hover:-translate-y-0.5 hover:bg-[#df5b46] active:translate-y-0.5 active:shadow-[2px_2px_0_hsl(224_31%_17%)] disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="button-submit-guess"
                  disabled={!guess || status === 'won'}
                >
                  Guess <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
              <div className="mt-3 flex min-h-6 items-center justify-between gap-4">
                <p id="range-status" className={`font-mono text-xs ${status === 'won' ? 'text-[#287c70]' : 'text-muted-foreground'}`} data-testid="status-feedback" aria-live="polite">
                  {status === 'won' ? 'That’s it. Nicely read.' : rangeCopy}
                </p>
                <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground" data-testid="text-attempt-count">{attempts} {attempts === 1 ? 'attempt' : 'attempts'}</span>
              </div>
            </div>

            <div className="mt-10 max-w-xl animate-enter-up" style={{ animationDelay: '320ms' }}>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`${progress}% progress`}>
                <div className="h-full rounded-full bg-[#ef6953] transition-all duration-500" style={{ width: `${Math.max(8, progress)}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Trust your first instinct</span>
                <span className="font-mono">{attempts === 0 ? 'READY' : `${attempts.toString().padStart(2, '0')} / ∞`}</span>
              </div>
            </div>
          </section>

          <aside className="animate-enter-up lg:flex lg:flex-col lg:justify-center" style={{ animationDelay: '180ms' }}>
            <div className="relative overflow-hidden rounded-[2rem] border border-foreground/10 bg-[#e9e2d3] p-5 text-foreground shadow-[8px_8px_0_hsl(224_31%_17%)] sm:p-7">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border-[20px] border-[#f6cb57]/80" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[.18em] text-foreground/55">This round</p>
                    <p className="mt-1 font-display text-xl font-bold">{activeDifficulty.name}</p>
                  </div>
                  <span className="rounded-full bg-[#fff8ed] px-3 py-1 font-mono text-[10px] font-medium text-foreground/70">{activeDifficulty.detail}</span>
                </div>

                <div className={`my-9 flex aspect-square items-center justify-center rounded-full border-[1.5px] border-dashed border-foreground/20 ${status === 'won' ? 'bg-[#f6cb57]' : 'bg-[#f2eadc]'} transition-colors duration-500`}>
                  <div className="text-center">
                    {status === 'won' ? (
                      <>
                        <Check className="mx-auto mb-2 text-[#287c70]" size={28} strokeWidth={2.5} />
                        <p className="font-mono text-4xl font-medium tracking-[-.08em]" data-testid="text-round-score">{roundScore}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[.14em] text-foreground/55">points</p>
                      </>
                    ) : (
                      <>
                        <p className="font-mono text-5xl font-medium tracking-[-.08em] text-foreground/20">?</p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[.14em] text-foreground/55">Hidden number</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-foreground/10 pt-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[.14em] text-foreground/50">Attempts</p>
                    <p className="mt-1 font-display text-2xl font-bold" data-testid="text-round-attempts">{attempts}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[.14em] text-foreground/50">Best score</p>
                    <p className="mt-1 font-display text-2xl font-bold" data-testid="text-best-score">{bestScore || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={revealHint}
                disabled={Boolean(hint) || status === 'won'}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 px-3 py-3 text-xs font-bold text-foreground transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:opacity-55"
                data-testid="button-reveal-hint"
              >
                <Lightbulb size={15} />
                {hint ? 'Hint used' : 'Get a hint'}
              </button>
              <button
                type="button"
                onClick={() => startRound()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 px-3 py-3 text-xs font-bold text-foreground transition-colors hover:border-foreground/50"
                data-testid="button-new-round"
              >
                <RotateCcw size={15} />
                New round
              </button>
            </div>
            {hint && (
              <div className="animate-slide mt-3 flex items-center gap-3 rounded-2xl border border-[#f6cb57] bg-[#f6cb57]/30 px-4 py-3 text-xs font-semibold text-foreground" data-testid="text-hint" aria-live="polite">
                <Lightbulb size={15} className="shrink-0" />
                {hint}
              </div>
            )}
          </aside>
        </div>

        <footer className="animate-enter-up flex flex-col gap-4 border-t border-border/80 pt-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Trophy size={13} /> {rounds} {rounds === 1 ? 'round' : 'rounds'} cleared</span>
            <span className="hidden items-center gap-1.5 sm:flex"><Keyboard size={13} /> Enter to submit</span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em]">Small game. Sharp mind.</p>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
