#include "../include/rise_core.h"
#include <stdio.h>

void rise_init() { printf("[Init] RISE-Core initialized.\n"); }
void rise_step() { printf("[Step] Simulation step executed.\n"); }
void rise_finalize() { printf("[Finalize] RISE-Core terminated.\n"); }
