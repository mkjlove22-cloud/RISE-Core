#include <stdio.h>
#include "../include/rise_core.h"

int main() {
    printf("RISE-Core Simulation Skeleton Running...\n");
    rise_init();
    rise_step();
    rise_finalize();
    return 0;
}
