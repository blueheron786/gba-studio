#include <stddef.h>
#include "gba_types.h"
#include "gba_system.h"

// Engine state
static scene_t current_scene;
static actor_t actors[16]; // Maximum 16 actors for now
static bool engine_running = true;

// Default palette (Game Boy-like colors adapted for GBA)
static const uint16_t default_palette[4] = {
    RGB15(31, 31, 31), // White
    RGB15(21, 21, 21), // Light gray  
    RGB15(10, 10, 10), // Dark gray
    RGB15(0, 0, 0)     // Black
};

void engine_init(void) {
    // Initialize GBA hardware
    gba_init();
    
    // Set Mode 3 immediately for testing
    REG_DISPCNT = MODE_3 | BG2_ENABLE;
    
    // Load default palette
    load_palette(default_palette, 0, 4);
    
    // Initialize current scene
    current_scene.width = MAP_WIDTH;
    current_scene.height = MAP_HEIGHT;
    current_scene.type = 0;
    current_scene.num_actors = 0;
    current_scene.num_triggers = 0;
    current_scene.num_projectiles = 0;
    current_scene.background_index = 0;
    current_scene.palette_index = 0;
    current_scene.actors = actors;
    
    // Clear all actors
    for (int i = 0; i < 16; i++) {
        actors[i].active = false;
    }
    
    // Draw initial pattern immediately to test
    uint16_t* vram = (uint16_t*)MEM_VRAM;
    for (int i = 0; i < 240 * 160; i++) {
        vram[i] = RGB15(31, 0, 31);  // Bright magenta to test
    }
}

void engine_update(void) {
    // Update input
    get_keys();
    
    // Update actors
    for (int i = 0; i < current_scene.num_actors; i++) {
        if (actors[i].active) {
            // Update actor position
            actors[i].x += actors[i].vel_x;
            actors[i].y += actors[i].vel_y;
            
            // Update animation
            if (actors[i].anim_speed > 0) {
                actors[i].anim_tick++;
                if (actors[i].anim_tick >= actors[i].anim_speed) {
                    actors[i].anim_tick = 0;
                    actors[i].anim_frame++;
                    // Handle animation looping here
                }
            }
        }
    }
}

void engine_render(void) {
    wait_vblank();
    
    // Render background
    // TODO: Implement background rendering from project data
    
    // Render sprites/actors  
    // TODO: Implement sprite rendering from project data
}

void engine_run(void) {
    engine_init();
    
    while (engine_running) {
        engine_update();
        engine_render();
    }
}

// Scene management functions
void load_scene(uint8_t scene_index) {
    // TODO: Implement scene loading
}

// Actor management functions
actor_t* spawn_actor(uint8_t sprite_index, uint16_t x, uint16_t y) {
    // Find free actor slot
    for (int i = 0; i < 16; i++) {
        if (!actors[i].active) {
            actors[i].active = true;
            actors[i].sprite_index = sprite_index;
            actors[i].x = x;
            actors[i].y = y;
            actors[i].vel_x = 0;
            actors[i].vel_y = 0;
            actors[i].anim_frame = 0;
            actors[i].anim_speed = 0;
            actors[i].anim_tick = 0;
            actors[i].collision_group = COLLISION_GROUP_NONE;
            actors[i].hidden = false;
            actors[i].disabled = false;
            actors[i].collision_enabled = true;
            
            if (i >= current_scene.num_actors) {
                current_scene.num_actors = i + 1;
            }
            
            return &actors[i];
        }
    }
    return NULL; // No free slots
}

void destroy_actor(actor_t* actor) {
    if (actor) {
        actor->active = false;
    }
}
