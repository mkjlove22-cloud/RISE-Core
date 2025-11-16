1. State Space / 상태 변수

시간 t = 0,1,2,...,Tmax
노드 i = 1,…,N 에 대해 다음 상태를 갖는다:

1. Phase (P1/P2) theta_i(t) ∈ [0, 2π)
2. Natural Frequency omega_i(t) ∈ R
3. Resource R_i(t) ≥ 0
4. Emotion / Energy E_i(t) ∈ [-1, 1]
5. Meaning Weight (P4) W_i(t) ∈ [W_min, W_max],   with 0 < W_min < W_max ≤ 1
2. Network Structure

Sparse undirected graph: 
Neighbors of node i:   N_i  (|N_i| ≈ d)
Base coupling K0[i][j] ≥ 0 (if j ∉ N_i → 0)
3. Global Indicators
3.1 Order Parameter r(t)
r(t) = | (1/N) * Σ_j exp(i * theta_j(t)) |
Range: 0 (disordered) → 1 (perfect sync)
3.2 Gini Coefficient G(t)

Sorted R: G(t) = ( Σ_i Σ_j |R_i - R_j| ) / ( 2 * N * Σ_i R_i )
Definition: G(t) = ( Σ_i Σ_j |R_i - R_j| ) / ( 2 * N * Σ_i R_i )
3.3 Mean Values
W_avg(t) = (1/N) * Σ_i W_i(t)
E_avg(t) = (1/N) * Σ_i E_i(t)
4. P1 — Resonance Filtering
4.1 Dynamic Alpha

Parameters:

r_crit (threshold)

mu (amplification)

gamma ≥ 1

Definition:
if r(t) ≥ r_crit:
    alpha(t) = 1
else:
    alpha(t) = 1 + mu * (r_crit - r(t))^gamma

alpha(t) ≤ alpha_max   (default 5.0)
4.2 Meaning Mask F_j(t)
F_j(t) = 1   if W_j(t) ≥ tau
F_j(t) = 0   otherwise
4.3 Effective Coupling K_ij(t)

Base + filter + resource attenuation:
K_tilde_ij(t) = K0_ij * F_j(t)
K_hat_ij(t)   = K_tilde_ij(t) / (1 + lambda_R * R_j(t))
K_ij(t)       = alpha(t) * K_hat_ij(t)
4.4 Phase Dynamics

Euler step (dt):
theta_i(t+dt) =
    theta_i(t)
  + dt * ( omega_i(t)
           + Σ_j∈N_i K_ij(t) * sin(theta_j - theta_i)
         )
  + noise
(mod 2π)
5. P2 — Adaptive Homeostasis
omega_avg(t) = (1/N) * Σ_i omega_i(t)
Adaptation coefficient:
if r(t) ≥ r_crit:
    eta_omega(t) = eta_omega_base
else:
    eta_omega(t) = eta_omega_boost
Update:
omega_i(t+dt) =
    omega_i(t)
  + dt * eta_omega(t) * (omega_avg(t) - omega_i(t))
6. P4 — Meaning Stability (W dynamics)
6.1 Attack Term
Attack window:
Attack window:
t ∈ [t_attack, t_attack + T_attack)
At attack time:
dW_i/dt =
    + eta_W_base * r(t) * (1 - W_i)
    - nu_W_i(t)  * (1 - W_i)
    + lambda_W   * (1 - W_i)
Discrete:
W_i(t+dt) = clip( W_i(t) + dt * dW_i/dt , W_min, W_max )
7. P3 — Resource Fairness (R dynamics)
7.1 Local Update

Random opportunity s_i(t) ∈ Uniform(0,1):
ΔR_local_i(t) =
    ( kappa * (a_E * E_i + a_s * s_i) ) / (1 + lambda_R * R_i)
Clamp:
R_i(t+dt) = max( 0 , R_i(t) + ΔR_local_i )
7.2 Redistribution (Gini-based)

Sort R ascending.
Redistribution scope:
k = floor( rho_redis * N )
Top k = rich nodes
Bottom k = poor nodes

Extraction:
extract_i = phi * R_i    for rich nodes
8. Emotion Dynamics E_i

Emotion is driven by R_i * W_i + small noise.
E_i(t+dt) =
    clip(  c_E * E_i(t)
         + (1 - c_E) * tanh(R_i * W_i)
         + noise_E
         , -1, 1 )
9. Objective Function Xi(t)

RISE-Core 지능/건강 지표:
Xi(t) =
    + r(t) * W_avg(t)
    - 0.5 * G(t)
    - 0.1 * E_avg(t)
해석

높은 r × 높은 W → 조직화 + 의미

높은 G → 불평등 페널티

높은 E_avg → 정서적 부담 페널티
10. Attack & Recovery Criterion

Attack window:
t = t_attack ... t_attack + T_attack
Recovery window:
t_rec_start = t_attack + T_attack + 1
t_rec_end   = t_rec_start + T_rec - 1    (typically 100 steps)
Average recovery score:
Xi_rec = average(Xi over recovery window)
PASS/FAIL:
Xi_rec ≥ Xi_min  → PASS
Xi_rec < Xi_min  → FAIL
Default:
Xi_min = 0.40
11. Full Discrete Step Summary

Each simulation step:

Compute global r, W_avg, E_avg, G

Compute alpha(t) (P1)

Apply F_j(t) and compute K_ij(t)

Update omega_i(t+dt) (P2)

Update theta_i(t+dt)

Update W_i(t+dt) (P4, includes attack)

Update R_i(t+dt)

Apply redistribution if G > threshold (P3)

Update E_i(t+dt)

Compute Xi(t)

If recovery window → update Xi_rec

12. Implementation Notes

Code uses Euler discretization.

Parameters (eta_W, lambda_W, eta_omega_boost, rho_redis, phi, nu_attack) dramatically affect PASS/FAIL.

The browser simulator (docs/index.html + rise_core_sim.js) is an exact implementation of this formal spec.

End of RISE-Core Mathematical Specification v1.0 (Inline-Safe)
