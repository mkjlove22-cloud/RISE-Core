\documentclass[11pt, a4paper]{article}
\usepackage[a4paper, top=2.5cm, bottom=2.5cm, left=2cm, right=2cm]{geometry}
\usepackage{amsmath} % For advanced math environments (align, etc.)
\usepackage{amssymb} % For common math symbols
\usepackage{booktabs} % For nice tables
\usepackage{fontspec} % For font management
\usepackage[korean, bidi=basic, provide=*]{babel}

\babelprovide[import, onchar=ids fonts]{korean}
\babelprovide[import, onchar=ids fonts]{english}

% Set default/Latin font to Sans Serif in the main (rm) slot
\babelfont{rm}{Noto Sans}
% Assign a specific font for Korean text
\babelfont[korean]{rm}{Noto Sans CJK KR}

\title{RISE-Core 시스템 수학적 정의 (Mathematical Definitions)}
\author{RISE-Core Framework}
\date{\today}

\begin{document}
\maketitle
\thispagestyle{empty}

\section{M0 --- 목적 함수 $\Xi(t)$ (Objective Function $\Xi(t)$)}

우리는 시간 $t$에서의 \textbf{전역 상태 벡터} $\mathbf{x}(t)$를 다음과 같이 정의합니다.
$$
\mathbf{x}(t) = (r(t), W_C(t), G(t), E(t))
$$
\begin{itemize}
    \item $r(t)$: Kuramoto 공명 지표 (coherence / order parameter)
    \item $W_C(t)$: 의미(Meaning) 핵심 가중치 (Core meaning weight)의 집단 평균
    \item $G(t)$: 자원 불평등을 나타내는 Gini 계수
    \item $E(t)$: 집단 평균 감정/정동 값
\end{itemize}

RISE-Core 시스템의 목적 함수 $\Xi(t)$는 다음 요소의 가중 합으로 정의됩니다.
$$
\Xi(t) = r(t) \cdot W_C(t) - \lambda_G G(t) - \lambda_E E(t)
$$
여기서,
\begin{itemize}
    \item $\lambda_G \geq 0$: 불평등 페널티 가중치 (Gini penalty weight)
    \item $\lambda_E \geq 0$: 감정 에너지 과부하 페널티 가중치 (Emotion penalty weight)
\end{itemize}

최종 목표는 일정 구간 $[T_{\mathrm{rec, start}}, T_{\mathrm{rec, end}}]$에 대해 다음 조건을 만족하도록 파라미터 및 정책을 설계하는 것입니다.
$$
\bar{\Xi}_{\mathrm{rec}} = \frac{1}{T_{\mathrm{rec, end}} - T_{\mathrm{rec, start}}} \sum_{t=T_{\mathrm{rec, start}}}^{T_{\mathrm{rec, end}}} \Xi(t) \geq \Xi_{\mathrm{crit}}
$$

\section{P1 --- 공명 계층 (Kuramoto Dynamics)}

각 노드 $i = 1, \dots, N$는 위상 $\theta_i(t)$와 고유 주파수 $\omega_i(t)$를 가집니다.

\subsection{Kuramoto 기본 식}
노드의 위상 $\theta_i$의 시간 변화율은 다음과 같습니다.
$$
\frac{d\theta_i}{dt} = \omega_i(t) + \sum_{j \in \mathcal{N}(i)} K_{ij}(t) \sin(\theta_j(t) - \theta_i(t)) + \eta_i(t)
$$
공명 지표 $r(t)$는 표준 Kuramoto order parameter로 정의됩니다.
$$
r(t) = \frac{1}{N} \left| \sum_{j=1}^{N} e^{i\theta_j(t)} \right| \in [0, 1]
$$
\subsection{실제 결합 강도}
실제 노드 간 결합 강도 $K_{ij}(t)$는 다음과 같이 동적으로 결정됩니다.
$$
K_{ij}(t) = \alpha(t) \cdot K_{ij}^{(0)} \cdot F_j(t)
$$

\section{P2 --- 적응적 항상성 (Adaptive Homeostasis)}

\subsection{Dynamic Alpha (직접 커플링 증폭)}
동조도 $r(t)$가 임계값 $r_{\mathrm{crit}}$ 아래로 떨어지면, 시스템은 자기 조절을 통해 복원력을 키웁니다.
$$
\alpha(t) = 
\begin{cases}
    1, & r(t) \geq r_{\mathrm{crit}} \\
    1 + \mu(r_{\mathrm{crit}} - r(t))^{\gamma}, & r(t) < r_{\mathrm{crit}}
\end{cases}
$$

\section{P3 --- 자원 공정성 (Resource Fairness)}

각 노드는 자원 $R_i(t)$를 가집니다. 자원 불평등을 측정하는 Gini 계수 $G(t)$는 다음과 같이 정의됩니다.
$$
G(t) = \frac{\sum_{i=1}^{N} \sum_{j=1}^{N} |R_i(t) - R_j(t)|}{2N \sum_{k=1}^{N} R_k(t)}
$$
$G(t)$가 임계값 $G_{\mathrm{th}}$ 이상인 경우, 상위/하위 $\rho_{\mathrm{redis}}$ 비율의 노드를 대상으로 자원 재분배가 수행됩니다.

\section{P4 --- 의미 안정성 (Meaning Stability)}

각 노드 또는 개념 단위의 \textbf{의미 핵심 가중치} $W_{C, i}(t)$의 진화 방정식은 다음과 같습니다.
$$
\frac{dW_{C, i}}{dt} = \eta_W \cdot r(t) \cdot (1 - W_{C, i}) - \nu_W(t) \cdot (1 - W_{C, i}) + \lambda_W \cdot (1 - W_{C, i})
$$
여기서, $F_i(t)$는 $W_{C, i}(t)$를 기반으로 한 이진 필터입니다.
$$
F_i(t) = \begin{cases} 1, & W_{C, i}(t) \geq \tau_W \\ 0, & W_{C, i}(t) < \tau_W \end{cases}
$$

\section{P5 --- 감정 관리 (Emotion Management) \textbf{[NEW]}}
각 노드의 감정/노력 수준 $E_i(t)$는 자원 ($R_i$)과 의미 가중치 ($W_{C, i}$)에 비선형적으로 영향을 받으며, 다음 방정식에 따라 변화합니다.

$$
\frac{dE_i}{dt} = -\delta_E E_i + \gamma_E \left( \tanh(\beta_R R_i + \beta_W W_{C, i}) - E_i \right) + \eta_E(t)
$$
\begin{itemize}
    \item $\delta_E$: 기본 감정 소멸률 (Base decay rate of emotion)
    \item $\gamma_E$: 감정 조정 속도 (Emotion adjustment speed)
    \item $\beta_R, \beta_W$: $R_i$와 $W_{C, i}$가 $E_i$에 미치는 민감도 계수 (Sensitivity coefficients)
    \item $\eta_E(t)$: 감정 노이즈/외란 항 (Noise/perturbation term)
\end{itemize}

\section{P6 --- 복원력 정량화 (Resilience Quantification) \textbf{[NEW]}}

RISE-Core 프레임워크는 시스템이 외부 공격 $A(t)$에 노출된 경우의 복원력을 다음 지표로 정량화합니다. 공격 $A(t)$는 일반적으로 $\nu_W(t)$와 $\nu_E(t)$의 형태로 시스템에 도입됩니다.

\subsection{상태 변이 영역}
RISE 시스템은 다음 세 가지 영역으로 구분됩니다:
\begin{itemize}
    \item $\mathcal{D}_0$: 안정 영역 (Normal Operation)
    \item $\mathcal{D}_{\mathrm{atk}}$: 공격 영역 (Attack Period)
    \item $\mathcal{D}_{\mathrm{rec}}$: 복원 영역 (Recovery Period)
\end{itemize}

\subsection{복원 시간 (Recovery Time)}
공격 종료 시점 $T_{\mathrm{end}}$ 이후, 목적 함수 $\Xi(t)$가 $\Xi_{\mathrm{crit}}$를 초과하여 안정적으로 유지되는 최소 시간 $\Delta T_{\mathrm{safe}}$를 복원 완료 시간으로 정의합니다.
$$
T_{\mathrm{rec}} = \min \{ t > T_{\mathrm{end}} \mid \forall t' \in [t, t + \Delta T_{\mathrm{safe}}], \Xi(t') \geq \Xi_{\mathrm{crit}} \}
$$

\subsection{잔존 복원력 ($\mathcal{R}_{\mathrm{res}}$)}
시스템이 공격에 노출되는 동안 목적 함수 $\Xi(t)$의 손실 면적을 활용하여 잔존 복원력을 정량화합니다.
$$
\mathcal{R}_{\mathrm{res}}(t) = 1 - \frac{\int_{T_{\mathrm{start}}}^{T_{\mathrm{end}}} \max(0, \Xi_{\mathrm{crit}} - \Xi(t)) dt}{(T_{\mathrm{end}} - T_{\mathrm{start}}) \cdot \Xi_{\mathrm{crit}}}
$$
여기서 $\mathcal{R}_{\mathrm{res}} \in [0, 1]$이며, 1에 가까울수록 공격 기간 동안 손실이 적어 복원력이 높음을 의미합니다.

\end{document}
