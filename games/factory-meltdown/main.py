# /// script
# dependencies = ["pygame-ce"]
# ///
from __future__ import annotations

import asyncio
import math
import random

import pygame

WIDTH, HEIGHT = 960, 540
FPS = 60
BG = (7, 10, 14)
GRID = (18, 25, 32)
TEXT = (220, 235, 245)
MUTED = (116, 137, 154)
CYAN = (76, 229, 255)
GREEN = (104, 255, 158)
AMBER = (255, 196, 82)
RED = (255, 77, 110)
VIOLET = (158, 126, 255)

pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Factory Meltdown — Nyttetech Arcade")
clock = pygame.time.Clock()
font = pygame.font.Font(None, 24)
small = pygame.font.Font(None, 18)
big = pygame.font.Font(None, 44)


class Player:
    def __init__(self):
        self.pos = pygame.Vector2(115, 270)
        self.radius = 13
        self.speed = 220
        self.health = 100
        self.flash = 0.0

    def update(self, dt: float, keys):
        direction = pygame.Vector2(
            keys[pygame.K_d] - keys[pygame.K_a] + keys[pygame.K_RIGHT] - keys[pygame.K_LEFT],
            keys[pygame.K_s] - keys[pygame.K_w] + keys[pygame.K_DOWN] - keys[pygame.K_UP],
        )
        if direction.length_squared() > 0:
            direction = direction.normalize()
            self.pos += direction * self.speed * dt
        self.pos.x = max(28, min(WIDTH - 28, self.pos.x))
        self.pos.y = max(76, min(HEIGHT - 30, self.pos.y))
        self.flash = max(0.0, self.flash - dt)

    def draw(self):
        color = RED if self.flash > 0 else CYAN
        pygame.draw.circle(screen, (16, 31, 40), self.pos, self.radius + 6)
        pygame.draw.circle(screen, color, self.pos, self.radius, 2)
        pygame.draw.circle(screen, color, self.pos, 4)
        direction = pygame.Vector2(18, 0)
        pygame.draw.line(screen, color, self.pos, self.pos + direction, 2)


class Station:
    def __init__(self, name: str, x: int, y: int, color, fault_types: list[str]):
        self.name = name
        self.pos = pygame.Vector2(x, y)
        self.color = color
        self.fault_types = fault_types
        self.fault: str | None = None
        self.pulse = random.random() * math.tau

    def draw(self, t: float):
        x, y = int(self.pos.x), int(self.pos.y)
        rect = pygame.Rect(x - 38, y - 28, 76, 56)
        pygame.draw.rect(screen, (13, 20, 28), rect, border_radius=8)
        border = RED if self.fault else self.color
        pygame.draw.rect(screen, border, rect, 2, border_radius=8)
        pygame.draw.line(screen, (43, 57, 69), (x - 26, y - 8), (x + 26, y - 8), 2)
        pygame.draw.circle(screen, border, (x - 19, y + 9), 5)
        pygame.draw.circle(screen, GREEN if not self.fault else RED, (x + 18, y + 9), 4)
        if self.fault:
            r = 38 + int(4 * math.sin(t * 5 + self.pulse))
            pygame.draw.circle(screen, RED, (x, y), r, 1)
            warning = small.render("FAULT", True, RED)
            screen.blit(warning, warning.get_rect(center=(x, y - 42)))
        label = small.render(self.name, True, TEXT)
        screen.blit(label, label.get_rect(center=(x, y + 40)))


class Drone:
    def __init__(self, x: int, y: int, vx: float, vy: float):
        self.pos = pygame.Vector2(x, y)
        self.vel = pygame.Vector2(vx, vy)
        self.radius = 12

    def update(self, dt: float):
        self.pos += self.vel * dt
        if self.pos.x < 40 or self.pos.x > WIDTH - 40:
            self.vel.x *= -1
        if self.pos.y < 90 or self.pos.y > HEIGHT - 40:
            self.vel.y *= -1

    def draw(self):
        pygame.draw.circle(screen, (31, 23, 36), self.pos, self.radius + 4)
        pygame.draw.circle(screen, VIOLET, self.pos, self.radius, 2)
        pygame.draw.line(screen, VIOLET, self.pos + (-8, 0), self.pos + (8, 0), 2)


def draw_grid(offset: float):
    screen.fill(BG)
    step = 40
    ox = int(offset) % step
    for x in range(-step + ox, WIDTH, step):
        pygame.draw.line(screen, GRID, (x, 64), (x, HEIGHT), 1)
    for y in range(64, HEIGHT, step):
        pygame.draw.line(screen, GRID, (0, y), (WIDTH, y), 1)
    pygame.draw.rect(screen, (10, 15, 21), (0, 0, WIDTH, 64))
    pygame.draw.line(screen, (36, 48, 60), (0, 64), (WIDTH, 64), 1)


def draw_conveyors(t: float):
    belts = [pygame.Rect(205, 142, 550, 34), pygame.Rect(205, 365, 550, 34)]
    for belt in belts:
        pygame.draw.rect(screen, (12, 18, 24), belt, border_radius=5)
        pygame.draw.rect(screen, (44, 55, 64), belt, 2, border_radius=5)
        for x in range(belt.left + 15, belt.right - 10, 34):
            dx = int((t * 38) % 34)
            pygame.draw.line(screen, (43, 68, 77), (x + dx, belt.top + 5), (x + dx + 10, belt.centery), 2)
            pygame.draw.line(screen, (43, 68, 77), (x + dx + 10, belt.centery), (x + dx, belt.bottom - 5), 2)


def new_fault(stations: list[Station], previous: Station | None = None) -> Station:
    choices = [s for s in stations if s is not previous]
    station = random.choice(choices)
    station.fault = random.choice(station.fault_types)
    return station


def reset_faults(stations: list[Station]):
    for station in stations:
        station.fault = None


async def main():
    player = Player()
    stations = [
        Station("24V PSU", 180, 245, CYAN, ["undervoltage", "blown fuse"]),
        Station("PLC", 360, 245, VIOLET, ["I/O timeout", "watchdog"]),
        Station("Sensor", 545, 245, GREEN, ["no signal", "misalignment"]),
        Station("Valve", 725, 245, AMBER, ["coil open", "air pressure"]),
        Station("Motor", 850, 360, RED, ["overload", "contactor"]),
    ]
    drones = [
        Drone(290, 105, 130, 80),
        Drone(660, 465, -150, -65),
        Drone(830, 120, -95, 100),
    ]
    current_fault = new_fault(stations)
    score = 0
    repairs = 0
    combo = 1
    time_left = 90.0
    fault_timer = 0.0
    message = "Find den røde station og tryk E tæt på den"
    message_time = 4.0
    running = True
    game_over = False

    while running:
        dt = min(clock.tick(FPS) / 1000.0, 0.04)
        await asyncio.sleep(0)
        t = pygame.time.get_ticks() / 1000.0
        interact = False

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_e:
                    interact = True
                if event.key == pygame.K_r and game_over:
                    player = Player()
                    score = 0
                    repairs = 0
                    combo = 1
                    time_left = 90.0
                    fault_timer = 0.0
                    game_over = False
                    reset_faults(stations)
                    current_fault = new_fault(stations)
                    message = "Ny vagt startet"
                    message_time = 2.0

        keys = pygame.key.get_pressed()
        if not game_over:
            player.update(dt, keys)
            time_left -= dt
            fault_timer += dt
            message_time = max(0.0, message_time - dt)

            for drone in drones:
                drone.update(dt)
                if player.pos.distance_to(drone.pos) < player.radius + drone.radius + 3 and player.flash <= 0:
                    player.health -= 12
                    player.flash = 0.8
                    combo = 1
                    message = "AGV collision: -12 health"
                    message_time = 1.8

            if interact:
                nearby = min(stations, key=lambda s: player.pos.distance_to(s.pos))
                distance = player.pos.distance_to(nearby.pos)
                if distance <= 70:
                    if nearby is current_fault and nearby.fault:
                        bonus = max(10, int(100 - fault_timer * 7))
                        earned = bonus * combo
                        score += earned
                        repairs += 1
                        combo = min(5, combo + 1)
                        message = f"{nearby.name}: {nearby.fault} repaired  +{earned}"
                        message_time = 2.3
                        nearby.fault = None
                        fault_timer = 0.0
                        time_left = min(99.0, time_left + 4.0)
                        current_fault = new_fault(stations, nearby)
                    else:
                        combo = 1
                        message = f"{nearby.name}: ingen aktiv fejl. Diagnose spildt."
                        message_time = 2.0
                else:
                    message = "Du er for langt fra en station"
                    message_time = 1.3

            if time_left <= 0 or player.health <= 0:
                game_over = True

        draw_grid(t * 8)
        draw_conveyors(t)
        for station in stations:
            station.draw(t)
        for drone in drones:
            drone.draw()
        player.draw()

        # HUD
        title = font.render("FACTORY MELTDOWN", True, TEXT)
        screen.blit(title, (18, 14))
        subtitle = small.render("Nyttetech maintenance shift", True, MUTED)
        screen.blit(subtitle, (18, 39))

        stats = [
            (f"TIME {max(0, time_left):05.1f}", AMBER),
            (f"HEALTH {max(0, player.health):03d}", GREEN if player.health > 35 else RED),
            (f"SCORE {score:05d}", CYAN),
            (f"x{combo} COMBO", VIOLET),
        ]
        sx = 475
        for text, color in stats:
            rendered = small.render(text, True, color)
            screen.blit(rendered, (sx, 25))
            sx += rendered.get_width() + 24

        # Nearby prompt
        nearest = min(stations, key=lambda s: player.pos.distance_to(s.pos))
        if player.pos.distance_to(nearest.pos) <= 70 and not game_over:
            prompt = small.render(f"[E] DIAGNOSE {nearest.name}", True, CYAN)
            pygame.draw.rect(screen, (5, 10, 14), prompt.get_rect(center=(WIDTH // 2, HEIGHT - 24)).inflate(18, 10), border_radius=7)
            screen.blit(prompt, prompt.get_rect(center=(WIDTH // 2, HEIGHT - 24)))

        if message_time > 0 and not game_over:
            rendered = small.render(message, True, TEXT)
            box = rendered.get_rect(center=(WIDTH // 2, 82)).inflate(22, 12)
            pygame.draw.rect(screen, (12, 18, 25), box, border_radius=8)
            pygame.draw.rect(screen, (55, 73, 88), box, 1, border_radius=8)
            screen.blit(rendered, rendered.get_rect(center=box.center))

        controls = small.render("WASD / ARROWS = move     E = diagnose / repair", True, MUTED)
        screen.blit(controls, (18, HEIGHT - 24))

        if game_over:
            overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            overlay.fill((0, 0, 0, 190))
            screen.blit(overlay, (0, 0))
            headline = big.render("SHIFT OVER", True, RED if player.health <= 0 else CYAN)
            screen.blit(headline, headline.get_rect(center=(WIDTH // 2, 205)))
            result = font.render(f"Repairs: {repairs}     Score: {score}", True, TEXT)
            screen.blit(result, result.get_rect(center=(WIDTH // 2, 255)))
            reason = small.render("AGV incident" if player.health <= 0 else "90 seconds survived", True, MUTED)
            screen.blit(reason, reason.get_rect(center=(WIDTH // 2, 286)))
            restart = font.render("Press R to restart", True, AMBER)
            screen.blit(restart, restart.get_rect(center=(WIDTH // 2, 335)))

        pygame.display.flip()

    pygame.quit()


asyncio.run(main())
