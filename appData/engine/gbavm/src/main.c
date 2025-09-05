#include "engine.h"
#include "gba_system.h"

// GBA ROM entry point - called from startup.s
// Use a different section to avoid interfering with ROM header
__attribute__((section(".text.main")))
int main(void) {
    // Initialize basic GBA system
    gba_init();
    
    // Set Mode 3 for bitmap mode
    REG_DISPCNT = MODE_3 | BG2_ENABLE;
    
    // Fill screen with solid color to test
    uint16_t* vram = (uint16_t*)MEM_VRAM;
    uint16_t test_color = RGB15(0, 31, 31); // Cyan color
    
    // Fill entire screen
    for (int i = 0; i < 240 * 160; i++) {
        vram[i] = test_color;
    }
    
    // Simple infinite loop to keep ROM running
    while (1) {
        // Do nothing - just keep the display active
    }
    
    return 0;
}
