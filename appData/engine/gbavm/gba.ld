/* GBA Linker Script */

ENTRY(_start)

MEMORY
{
    rom : ORIGIN = 0x08000000, LENGTH = 32M
    iwram : ORIGIN = 0x03000000, LENGTH = 32K
    ewram : ORIGIN = 0x02000000, LENGTH = 256K
}

SECTIONS
{
    .text :
    {
        *(.text.startup)
        *(.text)
        *(.rodata)
        . = ALIGN(4);
    } > rom

    .data :
    {
        __data_start = .;
        *(.data)
        . = ALIGN(4);
        __data_end = .;
    } > iwram AT > rom

    __data_load = LOADADDR(.data);
    __data_size = SIZEOF(.data);

    .bss :
    {
        __bss_start = .;
        *(.bss)
        *(COMMON)
        . = ALIGN(4);
        __bss_end = .;
    } > iwram

    __bss_size = SIZEOF(.bss);

    /* Heap (EWRAM) */
    .heap :
    {
        __heap_start = .;
        . = . + 128K; /* 128K heap */
        __heap_end = .;
    } > ewram

    /* Stack */
    __stack_top = ORIGIN(iwram) + LENGTH(iwram);

    /* ROM padding to 1MB for emulator compatibility */
    .pad :
    {
        . = . + 1M - SIZEOF(.text) - SIZEOF(.data);
    } > rom
}
