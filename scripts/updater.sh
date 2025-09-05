#!/bin/bash
echo "[ Mithra-Ymir Updater ]"
if [ -d ".git" ]; then
  git pull
else
  git clone https://github.com/ymir-core/mithraymir.git .
fi
