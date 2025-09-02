#ifndef GBA_SYSTEM_H
#define GBA_SYSTEM_H

#include <stdint.h>
#include <stdbool.h>

// GBA Hardware Registers
#define REG_DISPCNT    *(volatile uint16_t*)0x04000000  // Display Control
#define REG_DISPSTAT   *(volatile uint16_t*)0x04000004  // Display Status
#define REG_VCOUNT     *(volatile uint16_t*)0x04000006  // Vertical Counter
#define REG_BG0CNT     *(volatile uint16_t*)0x04000008  // BG0 Control
#define REG_BG1CNT     *(volatile uint16_t*)0x0400000A  // BG1 Control
#define REG_BG2CNT     *(volatile uint16_t*)0x0400000C  // BG2 Control
#define REG_BG3CNT     *(volatile uint16_t*)0x0400000E  // BG3 Control

// Input registers
#define REG_KEYINPUT   *(volatile uint16_t*)0x04000130  // Key Input

// DMA registers
#define REG_DMA3SAD    *(volatile uint32_t*)0x040000D4  // DMA3 Source Address
#define REG_DMA3DAD    *(volatile uint32_t*)0x040000D8  // DMA3 Destination Address
#define REG_DMA3CNT    *(volatile uint32_t*)0x040000DC  // DMA3 Control

// Memory areas
#define MEM_PALETTE    ((uint16_t*)0x05000000)          // Palette RAM
#define MEM_VRAM       ((uint16_t*)0x06000000)          // Video RAM
#define MEM_OAM        ((uint16_t*)0x07000000)          // Object Attribute Memory

// Display modes
#define MODE_0         0x0000
#define MODE_1         0x0001
#define MODE_2         0x0002
#define MODE_3         0x0003
#define MODE_4         0x0004
#define MODE_5         0x0005

// Background enable bits
#define BG0_ENABLE     0x0100
#define BG1_ENABLE     0x0200
#define BG2_ENABLE     0x0400
#define BG3_ENABLE     0x0800
#define OBJ_ENABLE     0x1000

// Key definitions
#define KEY_A          0x0001
#define KEY_B          0x0002
#define KEY_SELECT     0x0004
#define KEY_START      0x0008
#define KEY_RIGHT      0x0010
#define KEY_LEFT       0x0020
#define KEY_UP         0x0040
#define KEY_DOWN       0x0080
#define KEY_R          0x0100
#define KEY_L          0x0200

// Color conversion macro (5-5-5 RGB)
#define RGB15(r,g,b)   ((r) | ((g) << 5) | ((b) << 10))

// Basic system functions
void gba_init(void);
void wait_vblank(void);
void vsync(void);

// Input functions
uint16_t get_keys(void);
bool key_pressed(uint16_t key);
bool key_released(uint16_t key);

// Graphics functions
void set_mode(uint16_t mode);
void set_palette_color(uint16_t index, uint16_t color);
void load_palette(const uint16_t* palette, uint16_t start, uint16_t count);

// Memory functions
void dma_copy(const void* src, void* dest, uint32_t count);
void dma_fill(uint32_t value, void* dest, uint32_t count);

#endif // GBA_SYSTEM_H
