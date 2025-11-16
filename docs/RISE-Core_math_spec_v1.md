# RISE-Core Mathematical Specification v1

## 1. Global State

우리는 시간 $t$에서의 전역 상태 벡터를 다음과 같이 정의한다:

$$
x(t) = \bigl(r(t), W_c(t), G(t), \bar{E}(t)\bigr)
$$

- $r(t)$ : Kuramoto 공명 지표 (coherence / order parameter)
- $W_c(t)$ : 의미(Meaning) 핵심 가중치 (Core meaning weight)
- $G(t)$ : 자원 불평등을 나타내는 Gini 계수
- $\bar{E}(t)$ : 집단 평균 감정/정동 값

---

## 2. M0 — Objective Function $\Xi(t)$

RISE-Core 시스템의 목적 함수는 다음과 같이 정의한다:

$$
\Xi(t) \;=\; r(t)\, W_c(t)\;-\;\lambda_G\, G(t)\;-\;\lambda_E\, \bar{E}(t)
$$

여기서:

- $\lambda_G \ge 0$ : 불평등 페널티 가중치  
- $\lambda_E \ge 0$ : 감정 에너지 과부하 페널티 가중치  

목표는 일정 구간 $[T_{\mathrm{rec, start}}, T_{\mathrm{rec, end}}]$에 대해


\overline{\Xi} \;=\; \frac{1}{T_{\mathrm{rec, end}} - T_{\mathrm{rec, start}}}
\sum_{t = T_{\mathrm{rec, start}}}^{T_{\mathrm{rec, end}}} \Xi(t)
\;\ge\; 0.40


를 만족하도록 파라미터 및 정책을 설계하는 것이다.

---

## 3. P1 — Resonance Layer (Kuramoto Dynamics)

각 노드 $i = 1, \dots, N$는 위상 $\theta_i(t)$와 고유 주파수 $\omega_i(t)$를 가진다.

### 3.1 Kuramoto 기본 식


\frac{d\theta_i}{dt}
\;=\;
\omega_i(t)
\;+\;
\sum_{j \in \mathcal{N}(i)} K_{ij}(t)\, \sin\bigl(\theta_j(t) - \theta_i(t)\bigr)
\;+\; \eta_i(t)


- $\mathcal{N}(i)$ : 노드 $i$의 이웃(neighbor) 집합  
- $K_{ij}(t)$ : 시간에 따라 달라지는 결합 강도 (coupling strength)  
- $\eta_i(t)$ : 작은 노이즈 항

공명 지표 $r(t)$는 표준 Kuramoto order parameter로 정의한다:


r(t)
=
\frac{1}{N}
\left|
\sum_{j=1}^{N} e^{\,i\theta_j(t)}
\right|
\in [0,1]


---

## 4. P2 — Adaptive Homeostasis (Self-Regulation)

동조도가 임계값 $r_{\mathrm{crit}}$ 아래로 떨어지면, 시스템은 자기조절을 통해 복원력을 키운다.

### 4.1 Dynamic Alpha (직접 커플링 증폭)

동조도에 따라 동적 증폭 계수 $\alpha(t)$를 정의한다:


alpha(t)
=
\begin{cases}
1, & r(t) \ge r_{\mathrm{crit}} \\
1 + \mu\, \bigl(r_{\mathrm{crit}} - r(t)\bigr)^{\gamma}, & r(t) < r_{\mathrm{crit}}
\end{cases}


- $\mu > 0$ : 증폭 강도
- $\gamma \ge 1$ : 비선형 정도

실제 결합 강도는


K_{ij}(t) = \alpha(t)\, K_{ij}^{(0)}\, F_j(t)


처럼 증폭된다. 여기서 $K_{ij}^{(0)}$는 기본 결합 행렬, $F_j(t)$는 P4 필터(아래 참조).

---

## 5. P3 — Resource Fairness (Gini Control)

각 노드 $i$는 자원 $R_i(t)$를 가진다. Gini 계수는


G(t)
=
\frac{
\sum_{i=1}^{N} \sum_{j=1}^{N} \bigl| R_i(t) - R_j(t) \bigr|
}{
2N \sum_{k=1}^{N} R_k(t)
}


로 정의한다.

$G(t) > G_{\mathrm{th}}$인 경우, 상/하위 $\rho_{\mathrm{redis}}$ 비율의 노드를 대상으로 재분배가 수행된다.

---

## 6. P4 — Meaning Stability (Core Weight $W_c$)

각 노드 또는 개념 단위의 의미 가중치 $W_{c,i}(t)$는 다음과 같이 진화한다:



$$
\frac{dW_{c,i}}{dt}
=
\eta_W\, r(t)\, \bigl(1 - W_{c,i}(t)\bigr)
\;-\;
\nu_W(t)\, \bigl(1 - W_{c,i}(t)\bigr)
\;+\;
\lambda_W\, \bigl(1 - W_{c,i}(t)\bigr)
$$




- $\eta_W$ : 공명 기반 의미 회복 속도
- $\nu_W(t)$ : 공격(meaning collapse) 강도
- $\lambda_W$ : 자동 복원(auto-repair) 항

전역 평균 의미는


W_c(t)
=
\frac{1}{N}
\sum_{i=1}^{N} W_{c,i}(t)


로 정의한다.
