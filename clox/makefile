CC = gcc
CFLAGS = -std=c99 -Wall -Wextra -g
SRCDIR = src
SOURCES = $(wildcard $(SRCDIR)/*.c)
OBJECTS = $(SOURCES:.c=.o)
TARGET = clox

.PHONY: all clean

all: $(TARGET)
	@rm -f $(OBJECTS)

$(TARGET): $(OBJECTS)
	$(CC) $(OBJECTS) -o $(TARGET)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJECTS) $(TARGET)

run: $(TARGET)
	@rm -f $(OBJECTS)
	./$(TARGET)
