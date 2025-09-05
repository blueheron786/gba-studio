#include "engine.h"

// GBA ROM entry point - called from startup.s
// Use a different section to avoid interfering with ROM header
__attribute__((section(".text.main")))
int main(void) {
    engine_run();
    return 0;
}
