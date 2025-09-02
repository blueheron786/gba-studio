#ifndef ENGINE_H
#define ENGINE_H

#include "gba_types.h"

// Engine lifecycle functions
void engine_init(void);
void engine_update(void);
void engine_render(void);
void engine_run(void);

// Scene management
void load_scene(uint8_t scene_index);

// Actor management
actor_t* spawn_actor(uint8_t sprite_index, uint16_t x, uint16_t y);
void destroy_actor(actor_t* actor);

#endif // ENGINE_H
