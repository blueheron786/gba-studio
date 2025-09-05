@; GBA Startup Code
@; ARM Assembly

.section .text.startup
.global _start
.arm

@; GBA ROM Header - must be exactly at ROM offset 0x00000000
_rom_header:
    b _start                        @; 0x00: Branch to _start (simple branch)
    .space 156, 0                   @; 0x04-0x9F: Nintendo logo area (filled by gbafix)
    .ascii "GBASTUDIO   "          @; 0xA0-0xAB: Game title (12 chars)
    .ascii "GBAS"                  @; 0xAC-0xAF: Game code (4 chars)  
    .ascii "01"                    @; 0xB0-0xB1: Maker code (2 chars)
    .byte 0x96                     @; 0xB2: Fixed value
    .byte 0x00                     @; 0xB3: Main unit code
    .byte 0x00                     @; 0xB4: Device type
    .space 7, 0                    @; 0xB5-0xBB: Reserved
    .byte 0x00                     @; 0xBC: Software version
    .byte 0x00                     @; 0xBD: Complement check (filled by gbafix)
    .space 2, 0                    @; 0xBE-0xBF: Reserved

_start:
    @; Set up processor modes and stack
    mov r0, #0x12                  @; IRQ mode
    msr cpsr, r0
    ldr sp, =0x03007FA0            @; Set IRQ stack
    
    mov r0, #0x1F                  @; System mode
    msr cpsr, r0
    ldr sp, =0x03008000            @; Set system stack
    
    @; Initialize .data section
    ldr r0, =__data_load
    ldr r1, =__data_start
    ldr r2, =__data_size
    bl copy_memory
    
    @; Clear .bss section
    ldr r0, =__bss_start
    ldr r1, =__bss_size
    mov r2, #0
    bl fill_memory
    
    @; Jump to main
    bl main
    
    @; Infinite loop if main returns
loop:
    b loop

@; Copy memory function
copy_memory:
    cmp r2, #0
    beq copy_done
    ldrb r3, [r0], #1
    strb r3, [r1], #1
    subs r2, r2, #1
    bne copy_memory
copy_done:
    bx lr

@; Fill memory function  
fill_memory:
    cmp r1, #0
    beq fill_done
    strb r2, [r0], #1
    subs r1, r1, #1
    bne fill_memory
fill_done:
    bx lr
