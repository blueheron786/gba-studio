#ifndef GBA_TYPES_H
#define GBA_TYPES_H

#include <stdint.h>
#include <stdbool.h>

// GBA specific includes
#include "gba_system.h"

// Screen dimensions
#define SCREEN_WIDTH  240
#define SCREEN_HEIGHT 160

// Tile dimensions  
#define TILE_WIDTH  8
#define TILE_HEIGHT 8

// Map dimensions in tiles
#define MAP_WIDTH  (SCREEN_WIDTH / TILE_WIDTH)
#define MAP_HEIGHT (SCREEN_HEIGHT / TILE_HEIGHT)

#define COLLISION_GROUP_NONE 0x0
#define COLLISION_GROUP_PLAYER 0x1
#define COLLISION_GROUP_1 0x2
#define COLLISION_GROUP_2 0x4
#define COLLISION_GROUP_3 0x8
#define COLLISION_GROUP_MASK 0xF

#define COLLISION_GROUP_FLAG_1 0x10
#define COLLISION_GROUP_FLAG_2 0x20
#define COLLISION_GROUP_FLAG_3 0x40
#define COLLISION_GROUP_FLAG_4 0x80
#define COLLISION_GROUP_FLAG_PLATFORM COLLISION_GROUP_FLAG_3
#define COLLISION_GROUP_FLAG_SOLID COLLISION_GROUP_FLAG_4

typedef enum {
    LCD_simple,
    LCD_parallax,
    LCD_fullscreen
} LCD_isr_e;

typedef struct animation_t
{
    uint8_t start;
    uint8_t end;
} animation_t;

typedef struct actor_t
{
    bool active               : 1;
    bool pinned               : 1;
    bool hidden               : 1;
    bool disabled             : 1;
    bool anim_noloop          : 1;
    bool collision_enabled    : 1;
    bool movement_interrupt   : 1;
    bool persistent           : 1;
    uint8_t sprite_index;
    uint8_t palette_index;
    uint16_t x;
    uint16_t y;
    int16_t vel_x;
    int16_t vel_y;
    uint8_t anim_frame;
    uint8_t anim_speed;
    uint8_t anim_tick;
    uint8_t collision_group;
    uint8_t movement_type;
    uint16_t bounds_x;
    uint16_t bounds_y;
    uint16_t bounds_w;
    uint16_t bounds_h;
} actor_t;

typedef struct scene_t
{
    uint8_t width;
    uint8_t height;
    uint8_t type;
    uint8_t num_actors;
    uint8_t num_triggers;
    uint8_t num_projectiles;
    uint16_t background_index;
    uint16_t palette_index;
    actor_t *actors;
    // Add other scene data as needed
} scene_t;

typedef struct sprite_t
{
    uint8_t width;
    uint8_t height;
    uint8_t num_frames;
    uint8_t *data;
} sprite_t;

typedef struct palette_t
{
    uint16_t colors[16]; // GBA uses 16-bit colors
} palette_t;

#endif // GBA_TYPES_H
