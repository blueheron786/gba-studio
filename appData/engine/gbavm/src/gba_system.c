#include "gba_system.h"

static uint16_t keys_current = 0;
static uint16_t keys_previous = 0;

void gba_init(void) {
    // Initialize GBA system
    // Set up display mode 0 with BG0 enabled
    REG_DISPCNT = MODE_0 | BG0_ENABLE;
    
    // Clear VRAM
    for (int i = 0; i < 0x18000/2; i++) {
        MEM_VRAM[i] = 0;
    }
    
    // Clear palette
    for (int i = 0; i < 256; i++) {
        MEM_PALETTE[i] = 0;
    }
}

void wait_vblank(void) {
    while (REG_VCOUNT < 160);
    while (REG_VCOUNT >= 160);
}

void vsync(void) {
    wait_vblank();
}

uint16_t get_keys(void) {
    keys_previous = keys_current;
    keys_current = ~REG_KEYINPUT & 0x03FF;
    return keys_current;
}

bool key_pressed(uint16_t key) {
    return (keys_current & key) && !(keys_previous & key);
}

bool key_released(uint16_t key) {
    return !(keys_current & key) && (keys_previous & key);
}

void set_mode(uint16_t mode) {
    REG_DISPCNT = (REG_DISPCNT & 0xFFF8) | (mode & 0x0007);
}

void set_palette_color(uint16_t index, uint16_t color) {
    MEM_PALETTE[index] = color;
}

void load_palette(const uint16_t* palette, uint16_t start, uint16_t count) {
    for (uint16_t i = 0; i < count; i++) {
        MEM_PALETTE[start + i] = palette[i];
    }
}

void dma_copy(const void* src, void* dest, uint32_t count) {
    REG_DMA3SAD = (uint32_t)src;
    REG_DMA3DAD = (uint32_t)dest;
    REG_DMA3CNT = count | 0x80000000; // Enable DMA
}

void dma_fill(uint32_t value, void* dest, uint32_t count) {
    volatile uint32_t temp = value;
    REG_DMA3SAD = (uint32_t)&temp;
    REG_DMA3DAD = (uint32_t)dest;
    REG_DMA3CNT = count | 0x81000000; // Enable DMA with fixed source
}
