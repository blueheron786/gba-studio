# GBA VM Makefile
# Requires devkitARM toolchain

# Toolchain
PREFIX := arm-none-eabi-
CC := $(PREFIX)gcc
LD := $(PREFIX)ld
OBJCOPY := $(PREFIX)objcopy

# Directories
SRCDIR := src
INCDIR := include
OBJDIR := obj
BINDIR := bin

# Compiler flags
CFLAGS := -mthumb -mthumb-interwork -mcpu=arm7tdmi
CFLAGS += -Wall -Wextra -O2 -fomit-frame-pointer
CFLAGS += -I$(INCDIR)

# Linker flags
LDFLAGS := -T gba.ld -Map $(BINDIR)/game.map

# Source files
SOURCES := $(wildcard $(SRCDIR)/*.c)
ASMSOURCES := $(wildcard $(SRCDIR)/*.s)
OBJECTS := $(SOURCES:$(SRCDIR)/%.c=$(OBJDIR)/%.o) $(ASMSOURCES:$(SRCDIR)/%.s=$(OBJDIR)/%.o)

# Default target
all: $(BINDIR)/game.gba

# Create directories
$(OBJDIR):
	mkdir -p $(OBJDIR)

$(BINDIR):
	mkdir -p $(BINDIR)

# Compile object files
$(OBJDIR)/%.o: $(SRCDIR)/%.c | $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJDIR)/%.o: $(SRCDIR)/%.s | $(OBJDIR)
	$(CC) $(CFLAGS) -c $< -o $@

# Link ELF binary
$(BINDIR)/game.elf: $(OBJECTS) | $(BINDIR)
	$(CC) $(CFLAGS) $(OBJECTS) -o $@ $(LDFLAGS)

# Convert to GBA ROM
$(BINDIR)/game.gba: $(BINDIR)/game.elf
	$(OBJCOPY) -O binary $< $@

# Clean
clean:
	rm -rf $(OBJDIR) $(BINDIR)

# Phony targets
.PHONY: all clean
