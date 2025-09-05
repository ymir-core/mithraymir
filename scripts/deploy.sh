#!/bin/bash
msg=${1:-"update project"}
git add .
git commit -m "$msg"
git push origin main
