RISE-Core Mathematical Specification v1.0

Plain Markdown Edition (Copy-Paste Safe)
Kuramoto-based Multi-layer Resilience Model

0. Scope / 범위

RISE-Core는 Kuramoto 위상 동기화 모델과 4대 원칙(P1~P4)을 결합한 다층 네트워크 시스템이다.
본 문서는 다음을 정의한다:

상태 변수(State Space)

네트워크 구조

P1~P4 동역학

공격/복원 모델

목적 함수 Xi(t)

시뮬레이션 규칙

1. State Space / 상태 변수

각 노드 i = 1…N 은 다음 상태를 가진다.

Phase (P1/P2):
theta_i(t) ∈ [0, 2π)

Natural Frequency:
omega_i(t) ∈ R

Resource:
R_i(t) ≥ 0

Emotion / Energy:
E_i(t) ∈ [-1, 1]

Meaning Weight (P4):
W_i(t) ∈ [W_min, W_max]

2. Network Structure

Sparse undirected graph

Neighbors of node i: N_i (expected degree ≈ d)

Base coupling matrix K0[i][j] ≥ 0
(K0[i][j] = 0 if j ∉ N_i)

3. Global Indicators
3.1 Order Parameter

r(t) = absolute value of (1/N * Σ_j exp(i * theta_j(t)))
0 ≈ disorder
1 = full synchronization

3.2 Gini Coefficient

G(t) = ( Σ_i Σ_j |R_i - R_j| ) / (2 * N * Σ_i R_i)

3.3 Mean Values

W_avg(t) = (1/N) * Σ_i W_i(t)
E_avg(t) = (1/N) * Σ_i E_i(t)

4. P1 — Resonance Filtering
4.1 Dynamic Alpha

If r(t) ≥ r_crit → alpha(t) = 1
Else alpha(t) = 1 + mu * (r_crit - r(t))^gamma
Upper bound: alpha(t) ≤ alpha_max (default = 5.0)

4.2 Meaning Mask

F_j(t) = 1 if W_j(t) ≥ tau
F_j(t) = 0 otherwise

4.3 Effective Coupling

K_tilde_ij = K0_ij * F_j(t)
K_hat_ij = K_tilde_ij / (1 + lambda_R * R_j)
K_ij(t) = alpha(t) * K_hat_ij

4.4 Phase Update (Euler)

theta_i(t+dt) =
theta_i(t)

dt * ( omega_i(t) + Σ_j K_ij(t) * sin(theta_j - theta_i) )

noise
(mod 2π)

5. P2 — Adaptive Homeostasis

omega_avg(t) = (1/N) * Σ_i omega_i(t)

If r(t) ≥ r_crit → eta_omega = eta_omega_base
Else → eta_omega = eta_omega_boost

Update:
omega_i(t+dt) = omega_i(t) + dt * eta_omega * (omega_avg(t) - omega_i(t))

6. P4 — Meaning Stability
6.1 Attack Term

Attack window = [t_attack, t_attack + T_attack)
During attack:
nu_W_i(t) = nu_attack with probability p_hit (~0.1)

6.2 Meaning Weight Update

dW_i/dt =

eta_W_base * r(t) * (1 - W_i)

nu_W_i(t) * (1 - W_i)

lambda_W * (1 - W_i)

Discrete update:
W_i(t+dt) = clamp( W_i(t) + dt * dW_i/dt, W_min, W_max )

7. P3 — Resource Fairness
7.1 Local Update

ΔR_local_i =
(kappa * (a_E * E_i + a_s * random_uniform))
/ (1 + lambda_R * R_i)

R_i(t+dt) = max(0, R_i + ΔR_local_i)

7.2 Redistribution (Gini-based)

Sort R ascending.
Redistribution scope:
k = floor(rho_redis * N)

Top k = rich
Bottom k = poor

Extract:
extract_i = phi * R_i for rich nodes

TotalExtract = Σ extract_i

Distribute evenly among poor nodes:
R_j += TotalExtract / k

8. Emotion Dynamics

E_i(t+dt) =
clip(
c_E * E_i(t)

(1 - c_E) * tanh(R_i * W_i)

noise,
-1, 1
)

9. Objective Function Xi(t)

Xi(t) =

r(t) * W_avg(t)

0.5 * G(t)

0.1 * E_avg(t)

Interpretation:

High r × High W → ordered + meaningful

High G → inequality penalty

High E_avg → emotional load penalty

10. Attack & Recovery Criterion

Recovery window:
t_rec_start = t_attack + T_attack + 1
t_rec_end = t_rec_start + T_rec - 1 (default 100)

Xi_rec = mean of Xi over recovery window

PASS if Xi_rec ≥ Xi_min (default 0.40)

11. Full Simulation Step (Summary)

Compute r, W_avg, E_avg, G

Compute alpha(t)

Compute K_ij(t)

Update omega_i(t)

Update theta_i(t)

Update W_i(t)

Update R_i(t)

Redistribution if G > threshold

Update E_i(t)

Compute Xi(t)

Update recovery average Xi_rec

12. Notes for Implementers

Euler integration

Parameters highly affect PASS/FAIL

Browser simulator = reference implementation

END OF DOCUMENT
