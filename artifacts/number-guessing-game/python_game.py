"""Core rules for the Number Guessing Game.

The browser UI can use the same rules through a future API adapter, while this
module remains runnable on its own for Python users and automated checks.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from random import Random


DIFFICULTIES: dict[str, dict[str, int]] = {
    "easy": {"minimum": 1, "maximum": 50, "max_attempts": 10},
    "medium": {"minimum": 1, "maximum": 100, "max_attempts": 8},
    "hard": {"minimum": 1, "maximum": 500, "max_attempts": 7},
}


@dataclass(frozen=True)
class GuessResult:
    status: str
    message: str
    attempts_used: int
    attempts_left: int
    score: int
    is_complete: bool
    distance: int | None = None


@dataclass
class NumberGuessingGame:
    difficulty: str = "medium"
    rng: Random = field(default_factory=Random)
    secret_number: int = field(init=False)
    guesses: list[int] = field(default_factory=list, init=False)
    score: int = field(default=0, init=False)
    streak: int = field(default=0, init=False)
    is_complete: bool = field(default=False, init=False)

    def __post_init__(self) -> None:
        if self.difficulty not in DIFFICULTIES:
            raise ValueError(f"Unknown difficulty: {self.difficulty}")
        self.reset()

    @property
    def settings(self) -> dict[str, int]:
        return DIFFICULTIES[self.difficulty]

    @property
    def attempts_left(self) -> int:
        return max(self.settings["max_attempts"] - len(self.guesses), 0)

    def reset(self, difficulty: str | None = None) -> None:
        """Start a fresh round while preserving the player's streak."""
        if difficulty is not None:
            if difficulty not in DIFFICULTIES:
                raise ValueError(f"Unknown difficulty: {difficulty}")
            self.difficulty = difficulty

        settings = self.settings
        self.secret_number = self.rng.randint(
            settings["minimum"], settings["maximum"]
        )
        self.guesses.clear()
        self.score = 0
        self.is_complete = False

    def guess(self, value: int) -> GuessResult:
        """Evaluate one guess and return a UI-friendly result."""
        if self.is_complete:
            return self._result(
                "complete",
                "Start a new round to keep playing.",
            )

        if not isinstance(value, int) or isinstance(value, bool):
            return self._result("invalid", "Enter a whole number.")

        settings = self.settings
        if not settings["minimum"] <= value <= settings["maximum"]:
            return self._result(
                "invalid",
                f"Choose a number from {settings['minimum']} to {settings['maximum']}.",
            )

        if value in self.guesses:
            return self._result(
                "duplicate",
                "You already tried that number. Make a new guess.",
            )

        self.guesses.append(value)
        if value == self.secret_number:
            self.is_complete = True
            self.score = self._calculate_score()
            self.streak += 1
            return self._result(
                "correct",
                f"Nice work. {value} was the number.",
                distance=0,
            )

        if self.attempts_left == 0:
            self.is_complete = True
            self.streak = 0
            return self._result(
                "lost",
                f"Round over. The number was {self.secret_number}.",
                distance=abs(self.secret_number - value),
            )

        direction = "higher" if value < self.secret_number else "lower"
        distance = abs(self.secret_number - value)
        hint = "You're very close." if distance <= 5 else "Use the range to narrow it down."
        return self._result(
            direction,
            f"Try {direction}. {hint}",
            distance=distance,
        )

    def _calculate_score(self) -> int:
        """Reward fast wins more heavily, with a difficulty multiplier."""
        multiplier = {"easy": 1, "medium": 2, "hard": 3}[self.difficulty]
        base = self.settings["max_attempts"] - len(self.guesses) + 1
        return max(base, 1) * 100 * multiplier

    def _result(
        self,
        status: str,
        message: str,
        distance: int | None = None,
    ) -> GuessResult:
        return GuessResult(
            status=status,
            message=message,
            attempts_used=len(self.guesses),
            attempts_left=self.attempts_left,
            score=self.score,
            is_complete=self.is_complete,
            distance=distance,
        )


if __name__ == "__main__":
    game = NumberGuessingGame()
    print(
        f"Guess a number from {game.settings['minimum']} to "
        f"{game.settings['maximum']}."
    )
    while not game.is_complete:
        raw_guess = input("Your guess: ").strip()
        try:
            result = game.guess(int(raw_guess))
        except ValueError:
            result = game.guess(None)  # type: ignore[arg-type]
        print(result.message)
    print(f"Score: {game.score}")