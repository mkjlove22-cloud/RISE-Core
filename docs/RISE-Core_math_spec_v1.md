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
($\Xi_{\mathrm{crit}}$는 보통 0.40과 같은 임계값으로 설정됨)

\section{P1 --- 공명 계층 (Kuramoto Dynamics)}

각 노드 $i = 1, \dots, N$는 위상 $\theta_i(t)$와 고유 주파수 $\omega_i(t)$를 가집니다.

\subsection{Kuramoto 기본 식}
노드의 위상 $\theta_i$의 시간 변화율은 다음과 같습니다.
$$
\frac{d\theta_i}{dt} = \omega_i(t) + \sum_{j \in \mathcal{N}(i)} K_{ij}(t) \sin(\theta_j(t) - \theta_i(t)) + \eta_i(t)
$$
\begin{itemize}
    \item $\mathcal{N}(i)$: 노드 $i$의 이웃(neighbor) 집합
    \item $K_{ij}(t)$: 시간에 따라 달라지는 결합 강도 (coupling strength)
    \item $\eta_i(t)$: 작은 노이즈 항 (random noise)
\end{itemize}
공명 지표 $r(t)$는 표준 Kuramoto order parameter로 정의됩니다.
$$
r(t) = \frac{1}{N} \left| \sum_{j=1}^{N} e^{i\theta_j(t)} \right| \in [0, 1]
$$
\subsection{실제 결합 강도}
실제 노드 간 결합 강도 $K_{ij}(t)$는 다음과 같이 동적으로 결정됩니다.
$$
K_{ij}(t) = \alpha(t) \cdot K_{ij}^{(0)} \cdot F_j(t)
$$
\begin{itemize}
    \item $\alpha(t)$: 동조도에 따라 증폭되는 동적 증폭 계수 (P2-Adaptive Homeostasis 참조)
    \item $K_{ij}^{(0)}$: 기본 결합 행렬 (initial coupling matrix)
    \item $F_j(t)$: P4 필터 (노드 $j$의 의미 가중치 기반 필터)
\end{itemize}

\section{P2 --- 적응적 항상성 (Adaptive Homeostasis)}

\subsection{Dynamic Alpha (직접 커플링 증폭)}
동조도 $r(t)$가 임계값 $r_{\mathrm{crit}}$ 아래로 떨어지면, 시스템은 자기 조절을 통해 복원력을 키웁니다. 동조도에 따른 증폭 계수 $\alpha(t)$를 정의합니다.
$$
\alpha(t) = 
\begin{cases}
    1, & r(t) \geq r_{\mathrm{crit}} \\
    1 + \mu(r_{\mathrm{crit}} - r(t))^{\gamma}, & r(t) < r_{\mathrm{crit}}
\end{cases}
$$
\begin{itemize}
    \item $\mu > 0$: 증폭 강도
    \item $\gamma \geq 1$: 비선형 강도
\end{itemize}

\section{P3 --- 자원 공정성 (Resource Fairness)}

각 노드는 자원 $R_i(t)$를 가집니다. 자원 불평등을 측정하는 Gini 계수 $G(t)$는 다음과 같이 정의됩니다.
$$
G(t) = \frac{\sum_{i=1}^{N} \sum_{j=1}^{N} |R_i(t) - R_j(t)|}{2N \sum_{k=1}^{N} R_k(t)}
$$
$G(t)$가 임계값 $G_{\mathrm{th}}$ 이상인 경우, 상위/하위 $\rho_{\mathrm{redis}}$ 비율의 노드를 대상으로 자원 재분배가 수행됩니다.

\section{P4 --- 의미 안정성 (Meaning Stability)}

각 노드 또는 개념 단위의 \textbf{의미 핵심 가중치} $W_{C, i}(t)$는 감정 $E_i(t)$와 공명 $r(t)$에 따라 다음과 같이 진화합니다.

$$
\frac{dW_{C, i}}{dt} = \eta_W \cdot r(t) \cdot (1 - W_{C, i}) - \nu_W(t) \cdot (1 - W_{C, i}) + \lambda_W \cdot (1 - W_{C, i})
$$
\begin{itemize}
    \item $\eta_W$: 공명에 기반한 회복 속도 (Resonance-based recovery rate)
    \item $\nu_W(t)$: 외부 공격(Attack) 또는 내부 부패(Decay)에 의한 의미 손실율
    \item $\lambda_W$: 자율 복구율 (Autonomous repair rate)
\end{itemize}

\end{document}
