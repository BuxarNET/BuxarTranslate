#!/bin/bash

# Script to build Thunderbird extension XPI package

echo "Building BuxarTranslate extension..."

# Определяем корневую директорию проекта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_ROOT/src"
BUILD_DIR="$PROJECT_ROOT/build"

echo "Project root: $PROJECT_ROOT"
echo "Source directory: $SRC_DIR"

# Проверяем существование исходной директории
if [ ! -d "$SRC_DIR" ]; then
    echo "❌ ERROR: Source directory $SRC_DIR does not exist!"
    echo "Current directory: $(pwd)"
    echo "Directory contents:"
    ls -la
    exit 1
fi

# Создаем директорию для сборки
mkdir -p "$BUILD_DIR"

# Создаем XPI пакет
cd "$SRC_DIR"
zip -r "$BUILD_DIR/BuxarTranslate.xpi" ./*

if [ $? -eq 0 ]; then
    echo "✅ Build successful: $BUILD_DIR/BuxarTranslate.xpi"
    echo "📦 File size: $(du -h "$BUILD_DIR/BuxarTranslate.xpi" | cut -f1)"
else
    echo "❌ Build failed!"
    exit 1
fi