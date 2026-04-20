#!/bin/bash
# Script de inicio para Qiru Center Automation
mkdir -p data
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
